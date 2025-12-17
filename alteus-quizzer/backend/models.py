from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel, JSON
from datetime import datetime
import uuid
from sqlalchemy import Column, Text

# --- Base Models ---

class AppSettingsBase(SQLModel):
    default_timer_seconds: int = 30
    points_system: str = "standard"  # standard, simple, no_points
    leaderboard_frequency: str = "every_round"  # every_round, end_only, top_3
    enable_test_mode: bool = True
    require_player_names: bool = True
    organization_name: str = "Alteus.ai"
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class QuizBase(SQLModel):
    title: str
    goal: Optional[str] = Field(default=None, sa_column=Column(Text))
    description: Optional[str] = None
    background_image: Optional[str] = None
    default_time_limit: int = 30
    created_at: datetime = Field(default_factory=datetime.utcnow)

class QuestionBase(SQLModel):
    text: str
    time_limit: Optional[int] = None
    points: int = 1000
    order: int
    explanation: Optional[str] = None
    media_url: Optional[str] = None
    question_type: str = "single" # single, multiple

class AnswerOptionBase(SQLModel):
    text: str
    is_correct: bool = False
    order: int

class SessionBase(SQLModel):
    code: str = Field(index=True, unique=True)
    status: str = "WAITING" # WAITING, ACTIVE, FINISHED
    current_question_index: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ParticipantBase(SQLModel):
    name: str
    color: str
    score: int = 0
    joined_at: datetime = Field(default_factory=datetime.utcnow)

# --- Table Models ---

class AppSettings(AppSettingsBase, table=True):
    # Singleton row; we will always read/update id=1
    id: Optional[int] = Field(default=1, primary_key=True)

class Quiz(QuizBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    questions: List["Question"] = Relationship(back_populates="quiz", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    sessions: List["Session"] = Relationship(back_populates="quiz", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class Question(QuestionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    quiz_id: Optional[int] = Field(default=None, foreign_key="quiz.id")
    quiz: Optional[Quiz] = Relationship(back_populates="questions")
    options: List["AnswerOption"] = Relationship(back_populates="question", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class AnswerOption(AnswerOptionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    question_id: Optional[int] = Field(default=None, foreign_key="question.id")
    question: Optional[Question] = Relationship(back_populates="options")

class Session(SessionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    quiz_id: Optional[int] = Field(default=None, foreign_key="quiz.id")
    quiz: Optional[Quiz] = Relationship(back_populates="sessions")
    participants: List["Participant"] = Relationship(back_populates="session", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class Participant(ParticipantBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: Optional[int] = Field(default=None, foreign_key="session.id")
    session: Optional[Session] = Relationship(back_populates="participants")

# --- Schemas for API ---

class AnswerOptionCreate(AnswerOptionBase):
    pass

class AnswerOptionRead(AnswerOptionBase):
    id: int

class QuestionCreate(QuestionBase):
    options: List[AnswerOptionCreate]

class QuestionRead(QuestionBase):
    id: int
    options: List[AnswerOptionRead]

class QuizCreate(QuizBase):
    questions: List[QuestionCreate]

class QuizRead(QuizBase):
    id: int
    questions: List[QuestionRead]

class SessionRead(SessionBase):
    id: int
    quiz: QuizRead

# --- Settings Schemas ---

class AppSettingsRead(AppSettingsBase):
    id: int

class AppSettingsUpdate(SQLModel):
    default_timer_seconds: Optional[int] = None
    points_system: Optional[str] = None
    leaderboard_frequency: Optional[str] = None
    enable_test_mode: Optional[bool] = None
    require_player_names: Optional[bool] = None
    organization_name: Optional[str] = None
