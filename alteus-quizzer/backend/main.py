from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from typing import List
from contextlib import asynccontextmanager
from sqlalchemy.orm import selectinload
import random
import string
import json
import os

from database import init_db, get_session
from models import (
    Quiz,
    QuizCreate,
    QuizRead,
    Question,
    AnswerOption,
    Session,
    SessionRead,
    SessionBase,
    AppSettings,
    AppSettingsRead,
    AppSettingsUpdate,
)
from game_manager import manager, games, ActiveGame
from ai_routes import router as ai_router

# --- Text constraints (keep in sync with frontend + specs) ---
QUIZ_TEXT_LIMITS = {
    "title": 60,
    "goal": 600,
    "description": 120,
    "question_text": 90,
    "option_text": 45,
    "explanation": 220,
}

def _clamp_str(v: str | None, limit: int) -> str | None:
    if v is None:
        return None
    # Keep single-line (avoid TV/UI breakage)
    v = v.replace("\r\n", " ").replace("\n", " ").replace("\r", " ")
    v = " ".join(v.split())  # collapse whitespace
    return v[:limit]

def _sanitize_quiz_payload(quiz: QuizCreate) -> QuizCreate:
    """
    Defensive sanitation so we don't persist overly long strings even if frontend constraints are bypassed.
    This avoids breaking existing DB data and keeps TV layout readable.
    """
    quiz.title = _clamp_str(quiz.title, QUIZ_TEXT_LIMITS["title"]) or ""
    quiz.goal = _clamp_str(getattr(quiz, "goal", None), QUIZ_TEXT_LIMITS["goal"])
    quiz.description = _clamp_str(quiz.description, QUIZ_TEXT_LIMITS["description"])

    for qi, q in enumerate(quiz.questions):
        q.text = _clamp_str(q.text, QUIZ_TEXT_LIMITS["question_text"]) or f"Question {qi + 1}"
        q.explanation = _clamp_str(q.explanation, QUIZ_TEXT_LIMITS["explanation"])
        # Ensure options exist and are clamped
        for oi, opt in enumerate(q.options):
            opt.text = _clamp_str(opt.text, QUIZ_TEXT_LIMITS["option_text"]) or f"Option {oi + 1}"
    return quiz

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="Alteus Quizzer API", lifespan=lifespan)

# AI routes (backend-only calls to Alteus.ai)
app.include_router(ai_router)

# CORS Configuration
origins = [
    "http://localhost:5173",  # Vite default
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

# Allow LAN IP access in dev (e.g. http://192.168.x.x:5173)
# You can override with env var CORS_ALLOW_ORIGIN_REGEX if you want stricter control.
origin_regex = os.getenv(
    "CORS_ALLOW_ORIGIN_REGEX",
    r"^https?://(localhost|127\.0\.0\.1|\d{1,3}(\.\d{1,3}){3})(:\d+)?$",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Alteus Quizzer Backend is running!"}

# --- App Settings ---

SETTINGS_SINGLETON_ID = 1

async def _get_or_create_settings(db: AsyncSession) -> AppSettings:
    result = await db.exec(select(AppSettings).where(AppSettings.id == SETTINGS_SINGLETON_ID))
    settings = result.one_or_none()
    if settings:
        return settings
    settings = AppSettings(id=SETTINGS_SINGLETON_ID)
    db.add(settings)
    await db.commit()
    await db.refresh(settings)
    return settings

@app.get("/settings", response_model=AppSettingsRead)
async def read_settings(db: AsyncSession = Depends(get_session)):
    return await _get_or_create_settings(db)

@app.put("/settings", response_model=AppSettingsRead)
async def update_settings(payload: AppSettingsUpdate, db: AsyncSession = Depends(get_session)):
    settings = await _get_or_create_settings(db)
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        if v is None:
            continue
        # Treat empty strings as "unset" so we fall back to .env for Alteus provider config.
        if k in {"alteus_api_url", "alteus_api_key", "alteus_endpoint_id"}:
            if isinstance(v, str):
                v = v.strip()
                if v == "":
                    v = None
        setattr(settings, k, v)
    # bump updated_at
    from datetime import datetime
    settings.updated_at = datetime.utcnow()
    db.add(settings)
    await db.commit()
    await db.refresh(settings)
    return settings

# --- Quiz CRUD ---

@app.post("/quizzes/", response_model=QuizRead)
async def create_quiz(quiz: QuizCreate, db: AsyncSession = Depends(get_session)):
    quiz = _sanitize_quiz_payload(quiz)
    # Create Quiz instance
    db_quiz = Quiz(
        title=quiz.title,
        goal=getattr(quiz, "goal", None),
        description=quiz.description,
        background_image=quiz.background_image,
        default_time_limit=quiz.default_time_limit
    )
    db.add(db_quiz)
    await db.commit()
    await db.refresh(db_quiz)
    
    for q_data in quiz.questions:
        db_question = Question(
            quiz_id=db_quiz.id,
            text=q_data.text,
            time_limit=q_data.time_limit,
            points=q_data.points,
            order=q_data.order,
            explanation=q_data.explanation,
            media_url=q_data.media_url,
            question_type=q_data.question_type
        )
        db.add(db_question)
        await db.commit()
        await db.refresh(db_question)
        
        for opt_data in q_data.options:
            db_option = AnswerOption(
                question_id=db_question.id,
                text=opt_data.text,
                is_correct=opt_data.is_correct,
                order=opt_data.order
            )
            db.add(db_option)
    
    await db.commit()
    
    # Reload with relationships
    stmt = select(Quiz).where(Quiz.id == db_quiz.id).options(
        selectinload(Quiz.questions).selectinload(Question.options)
    )
    result = await db.exec(stmt)
    return result.one()

@app.put("/quizzes/{quiz_id}", response_model=QuizRead)
async def update_quiz(quiz_id: int, quiz_data: QuizCreate, db: AsyncSession = Depends(get_session)):
    quiz_data = _sanitize_quiz_payload(quiz_data)
    # Fetch existing quiz
    stmt = select(Quiz).where(Quiz.id == quiz_id).options(
        selectinload(Quiz.questions).selectinload(Question.options)
    )
    result = await db.exec(stmt)
    db_quiz = result.one_or_none()
    
    if not db_quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Update basic fields
    db_quiz.title = quiz_data.title
    db_quiz.goal = getattr(quiz_data, "goal", None)
    db_quiz.description = quiz_data.description
    db_quiz.default_time_limit = quiz_data.default_time_limit
    
    # Update questions: Simplest approach is delete all and recreate
    # Note: In a real prod app, you might want to diff/update to preserve stats/ids if needed
    
    # Remove existing questions (cascade should handle options)
    # However, selectinload doesn't always play nice with direct list manipulation for deletion in some async contexts
    # Let's try clearing the list
    for q in db_quiz.questions:
        await db.delete(q) # Explicitly delete
        
    db_quiz.questions = []
    
    # Add new questions
    for q_data in quiz_data.questions:
        db_question = Question(
            quiz_id=db_quiz.id,
            text=q_data.text,
            time_limit=q_data.time_limit,
            points=q_data.points,
            order=q_data.order,
            explanation=q_data.explanation,
            media_url=q_data.media_url,
            question_type=q_data.question_type
        )
        db.add(db_question)
        # Need to commit/flush to get ID? Or just add to session
        # We can add to DB session directly
        
        # We can't add options immediately if we don't have question ID yet?
        # SQLModel/SQLAlchemy can handle this via relationships if constructed carefully
        # But let's do step-by-step for safety
        
        await db.commit() 
        await db.refresh(db_question)

        for opt_data in q_data.options:
            db_option = AnswerOption(
                question_id=db_question.id,
                text=opt_data.text,
                is_correct=opt_data.is_correct,
                order=opt_data.order
            )
            db.add(db_option)
            
    await db.commit()
    await db.refresh(db_quiz)

    # Reload with relationships
    stmt = select(Quiz).where(Quiz.id == db_quiz.id).options(
        selectinload(Quiz.questions).selectinload(Question.options)
    )
    result = await db.exec(stmt)
    return result.one()


@app.get("/quizzes/", response_model=List[QuizRead])
async def read_quizzes(db: AsyncSession = Depends(get_session)):
    stmt = select(Quiz).options(selectinload(Quiz.questions).selectinload(Question.options))
    result = await db.exec(stmt)
    return result.all()

@app.get("/quizzes/{quiz_id}", response_model=QuizRead)
async def read_quiz(quiz_id: int, db: AsyncSession = Depends(get_session)):
    stmt = select(Quiz).where(Quiz.id == quiz_id).options(
        selectinload(Quiz.questions).selectinload(Question.options)
    )
    result = await db.exec(stmt)
    quiz = result.one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz


@app.delete("/quizzes/{quiz_id}")
async def delete_quiz(quiz_id: int, db: AsyncSession = Depends(get_session)):
    # Load quiz with related entities so cascades + in-memory cleanup can work reliably.
    stmt = (
        select(Quiz)
        .where(Quiz.id == quiz_id)
        .options(
            selectinload(Quiz.questions).selectinload(Question.options),
            selectinload(Quiz.sessions).selectinload(Session.participants),
        )
    )
    result = await db.exec(stmt)
    quiz = result.one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # If there are active in-memory games for sessions of this quiz, drop them.
    for s in list(getattr(quiz, "sessions", []) or []):
        code = getattr(s, "code", None)
        if code:
            games.pop(code, None)
            manager.active_connections.pop(code, None)
            manager.participant_connections.pop(code, None)
            manager.host_connections.pop(code, None)

    await db.delete(quiz)
    await db.commit()
    return {"ok": True}

# --- Session Management ---

def generate_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))

@app.post("/sessions/", response_model=SessionRead)
async def create_session(quiz_id: int, session_db: AsyncSession = Depends(get_session)):
    # Load quiz with all data
    stmt = select(Quiz).where(Quiz.id == quiz_id).options(
        selectinload(Quiz.questions).selectinload(Question.options)
    )
    result = await session_db.exec(stmt)
    quiz = result.one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    settings = await _get_or_create_settings(session_db)

    # Create Session in DB
    code = generate_code()
    # Ensure uniqueness loop (simplified)
    db_session = Session(quiz_id=quiz.id, code=code, status="WAITING")
    session_db.add(db_session)
    await session_db.commit()
    await session_db.refresh(db_session)

    # Initialize Active Game in Memory
    # Convert SQLModel to dict structure expected by ActiveGame
    # We need to manually construct the dict to ensure nested lists are correct
    quiz_data = {
        "title": quiz.title,
        "questions": [
            {
                "id": q.id,
                "text": q.text,
                "time_limit": q.time_limit or quiz.default_time_limit,
                "points": q.points,
                "media_url": q.media_url,
                "explanation": q.explanation,
                "options": [{"id": o.id, "text": o.text, "is_correct": o.is_correct} for o in q.options]
            } for q in quiz.questions
        ]
    }
    
    games[code] = ActiveGame(
        quiz_data,
        code,
        settings={
            "defaultTimerSeconds": settings.default_timer_seconds,
            "pointsSystem": settings.points_system,
            "leaderboardFrequency": settings.leaderboard_frequency,
            "enableTestMode": settings.enable_test_mode,
            "requirePlayerNames": settings.require_player_names,
            "organizationName": settings.organization_name,
        },
    )
    
    # Manually attach the fully loaded quiz to the session object
    # This prevents the MissingGreenlet error when Pydantic tries to access the lazy relationship
    db_session.quiz = quiz
    
    return db_session

@app.websocket("/ws/{session_code}/{client_id}")
async def websocket_endpoint(websocket: WebSocket, session_code: str, client_id: str):
    is_host = client_id == "host"
    
    if session_code not in games:
        await websocket.close(code=4000, reason="Session not found")
        return

    game = games[session_code]
    await manager.connect(websocket, session_code, client_id, is_host)
    
    try:
        # Send initial state
        await websocket.send_json({"type": "STATE_UPDATE", "state": game.get_state()})
        
        while True:
            data = await websocket.receive_json()
            # Process actions
            action = data.get("action")
            
            if is_host:
                if action == "START_GAME":
                    game.start_game()
                elif action == "NEXT_QUESTION":
                    game.next_question()
                elif action == "SKIP_TIMER":
                    game.skip_timer()
                elif action == "RESET":
                    game.reset_game()
                    # Prune disconnected players
                    active_ids = list(manager.participant_connections.get(session_code, {}).keys())
                    game.prune_participants(active_ids)
            else:
                if action == "JOIN":
                    name = data.get("name", "Anonymous")
                    color = data.get("color", "#000000")
                    game.add_participant(client_id, name, color)
                elif action == "SUBMIT_ANSWER":
                    answer_id = data.get("answerId")
                    game.submit_answer(client_id, answer_id)
            
            # Broadcast update
            await manager.broadcast(session_code, {"type": "STATE_UPDATE", "state": game.get_state()})
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_code, client_id, is_host)
        
        # If waiting, remove participant immediately (Clean Lobby)
        if session_code in games and not is_host:
            game = games[session_code]
            if game.status == "WAITING":
                game.remove_participant(client_id)
                await manager.broadcast(session_code, {"type": "STATE_UPDATE", "state": game.get_state()})

