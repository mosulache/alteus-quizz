from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from alteus_client import AlteusConfigError, AlteusResponseError, alteus_call_json
from models import AnswerOptionCreate, QuestionCreate


router = APIRouter(prefix="/api/ai", tags=["ai"])


# Keep in sync with backend/main.py and frontend/src/lib/quizConstraints.ts
QUIZ_TEXT_LIMITS = {
    "title": 60,
    "description": 120,
    "question_text": 90,
    "option_text": 45,
    "explanation": 220,
}


def _clamp_str(v: str | None, limit: int) -> str | None:
    if v is None:
        return None
    v = v.replace("\r\n", " ").replace("\n", " ").replace("\r", " ")
    v = " ".join(v.split())
    return v[:limit]


def _ensure_single_correct(options: List[AnswerOptionCreate]) -> None:
    correct = [o for o in options if o.is_correct]
    if len(correct) != 1:
        raise ValueError("Expected exactly 1 correct option.")


def _normalize_options(options: List[AnswerOptionCreate]) -> List[AnswerOptionCreate]:
    if len(options) != 4:
        raise ValueError("Expected exactly 4 options.")
    out: List[AnswerOptionCreate] = []
    for i, opt in enumerate(options):
        out.append(
            AnswerOptionCreate(
                text=_clamp_str(opt.text, QUIZ_TEXT_LIMITS["option_text"]) or f"Option {i+1}",
                is_correct=bool(opt.is_correct),
                order=i,
            )
        )
    _ensure_single_correct(out)
    return out


def _normalize_question(q: QuestionCreate, *, default_time_limit: int, order: int) -> QuestionCreate:
    text = _clamp_str(q.text, QUIZ_TEXT_LIMITS["question_text"]) or f"Question {order+1}"
    explanation = _clamp_str(q.explanation, QUIZ_TEXT_LIMITS["explanation"])
    opts = _normalize_options(q.options)
    return QuestionCreate(
        text=text,
        time_limit=q.time_limit or default_time_limit,
        points=q.points or 1000,
        order=order,
        explanation=explanation,
        media_url=q.media_url,
        question_type=q.question_type or "single",
        options=opts,
    )


def _language_default(language: Optional[str]) -> str:
    return (language or "Romanian").strip() or "Romanian"


def _questions_json_array(existing_questions: Optional[List[str]]) -> str:
    # We only need texts to help the model avoid duplicates.
    # Keep it short to reduce prompt length.
    arr = [(q or "").strip()[:QUIZ_TEXT_LIMITS["question_text"]] for q in (existing_questions or []) if (q or "").strip()]
    import json

    return json.dumps(arr, ensure_ascii=False)


def _options_json_array(old_options: Optional[List[str]]) -> str:
    arr = [(o or "").strip()[:QUIZ_TEXT_LIMITS["option_text"]] for o in (old_options or []) if (o or "").strip()]
    import json

    return json.dumps(arr, ensure_ascii=False)


def _prompt_description(*, title: str, goal: str, language: str) -> str:
    return f"""You are a quiz authoring assistant. Output ONLY valid JSON. No markdown, no extra text.

Generate a concise quiz description for a quiz creation app.

Constraints:
- Language: {language} (default Romanian if not specified)
- Length: 1-2 sentences, max 120 characters, single line (no newline)
- Must align with the quiz goal
- Avoid fluff and generic marketing

Input:
Title: "{title}"
Goal: "{goal}"

Return EXACTLY this JSON shape:
{{
  "description": "..."
}}
"""


def _prompt_questions(
    *,
    title: str,
    goal: str,
    description: Optional[str],
    language: str,
    default_time_limit: int,
    existing_questions: Optional[List[str]],
    additional: bool,
    count: int,
) -> str:
    existing_json = _questions_json_array(existing_questions)
    desc = (description or "").strip()
    header = (
        f"Generate {count} additional multiple-choice questions that do NOT repeat or closely mimic the existing ones."
        if additional
        else f"Create {count} high-quality multiple-choice questions for a quiz app."
    )
    return f"""You are a quiz generator. Output ONLY valid JSON. No markdown, no commentary.

{header}

Constraints:
- Language: {language} (default Romanian)
- Exactly {count} questions
- 4 options per question
- Exactly 1 correct option
- Provide a short explanation (1-3 short sentences)
- Keep questions and options VERY short for UI, especially TV layout:
  - question text max 90 characters
  - option text max 45 characters
  - explanation max 220 characters
- Avoid duplicates and near-duplicates with existing questions
- Options must be plausible (no obviously silly distractors)

Context:
Title: "{title}"
Goal: "{goal}"
Description (if any): "{desc}"
Default time limit (seconds): {default_time_limit}

Existing questions (may be empty):
{existing_json}

Return EXACTLY this JSON shape:
{{
  "questions": [
    {{
      "text": "...",
      "time_limit": {default_time_limit},
      "points": 1000,
      "order": 0,
      "question_type": "single",
      "options": [
        {{ "text": "...", "is_correct": true, "order": 0 }},
        {{ "text": "...", "is_correct": false, "order": 1 }},
        {{ "text": "...", "is_correct": false, "order": 2 }},
        {{ "text": "...", "is_correct": false, "order": 3 }}
      ],
      "explanation": "..."
    }}
  ]
}}
"""


def _prompt_regenerate_options(
    *,
    goal: str,
    description: Optional[str],
    language: str,
    question_text: str,
    old_options: Optional[List[str]],
) -> str:
    old_options_json = _options_json_array(old_options)
    desc = (description or "").strip()
    return f"""You are a quiz assistant. Output ONLY valid JSON. No markdown.

Regenerate ONLY the answer options for the given question. Keep the question text unchanged.

Constraints:
- Language: {language} (default Romanian)
- Provide 4 options
- Exactly 1 correct option
- Options must be plausible and close in difficulty
- Avoid reusing the old options
- Provide a short explanation consistent with the new correct option
- Keep options VERY short for TV layout (max 45 characters each)
- Keep explanation short (max 220 characters)

Context:
Goal: "{goal}"
Description (if any): "{desc}"

Question (do not change):
"{question_text}"

Old options to avoid:
{old_options_json}

Return EXACTLY:
{{
  "options": [
    {{ "text": "...", "is_correct": true, "order": 0 }},
    {{ "text": "...", "is_correct": false, "order": 1 }},
    {{ "text": "...", "is_correct": false, "order": 2 }},
    {{ "text": "...", "is_correct": false, "order": 3 }}
  ],
  "explanation": "..."
}}
"""


class DescriptionRequest(BaseModel):
    title: str = Field(..., min_length=1)
    goal: str = Field(..., min_length=1)
    language: Optional[str] = None


class DescriptionResponse(BaseModel):
    description: str


class QuestionsRequest(BaseModel):
    title: str = Field(..., min_length=1)
    goal: str = Field(..., min_length=1)
    description: Optional[str] = None
    language: Optional[str] = None
    default_time_limit: int = 30
    existing_questions: Optional[List[str]] = None
    count: int = Field(10, ge=1, le=50)


class QuestionsResponse(BaseModel):
    questions: List[QuestionCreate]


class RegenerateOptionsRequest(BaseModel):
    title: str = Field(..., min_length=1)
    goal: str = Field(..., min_length=1)
    description: Optional[str] = None
    language: Optional[str] = None
    question_text: str = Field(..., min_length=1)
    old_options: Optional[List[str]] = None


class RegenerateOptionsResponse(BaseModel):
    options: List[AnswerOptionCreate]
    explanation: str


@router.post("/quiz/description", response_model=DescriptionResponse)
async def generate_description(payload: DescriptionRequest):
    title = _clamp_str(payload.title, QUIZ_TEXT_LIMITS["title"]) or ""
    goal = _clamp_str(payload.goal, QUIZ_TEXT_LIMITS["description"]) or ""
    language = _language_default(payload.language)

    prompt = _prompt_description(title=title, goal=goal, language=language)
    try:
        data = await alteus_call_json(prompt)
        description = _clamp_str(str(data.get("description", "")).strip(), QUIZ_TEXT_LIMITS["description"]) or ""
        if not description:
            raise AlteusResponseError("Model returned empty description.")
        return DescriptionResponse(description=description)
    except (AlteusConfigError, AlteusResponseError) as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/quiz/questions", response_model=QuestionsResponse)
async def generate_questions(payload: QuestionsRequest):
    title = _clamp_str(payload.title, QUIZ_TEXT_LIMITS["title"]) or ""
    goal = _clamp_str(payload.goal, QUIZ_TEXT_LIMITS["description"]) or ""
    description = _clamp_str(payload.description, QUIZ_TEXT_LIMITS["description"])
    language = _language_default(payload.language)
    default_time_limit = payload.default_time_limit or 30
    count = int(payload.count or 10)

    prompt = _prompt_questions(
        title=title,
        goal=goal,
        description=description,
        language=language,
        default_time_limit=default_time_limit,
        existing_questions=payload.existing_questions,
        additional=False,
        count=count,
    )

    try:
        data = await alteus_call_json(prompt, timeout_s=90.0)
        raw = data.get("questions")
        if not isinstance(raw, list) or len(raw) != count:
            raise AlteusResponseError(f"Model must return exactly {count} questions.")

        questions: List[QuestionCreate] = []
        for i, item in enumerate(raw):
            q = QuestionCreate.model_validate(item)
            questions.append(_normalize_question(q, default_time_limit=default_time_limit, order=i))
        return QuestionsResponse(questions=questions)
    except (AlteusConfigError, AlteusResponseError, ValueError) as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/quiz/questions/more", response_model=QuestionsResponse)
async def generate_more_questions(payload: QuestionsRequest):
    title = _clamp_str(payload.title, QUIZ_TEXT_LIMITS["title"]) or ""
    goal = _clamp_str(payload.goal, QUIZ_TEXT_LIMITS["description"]) or ""
    description = _clamp_str(payload.description, QUIZ_TEXT_LIMITS["description"])
    language = _language_default(payload.language)
    default_time_limit = payload.default_time_limit or 30
    count = int(payload.count or 10)

    prompt = _prompt_questions(
        title=title,
        goal=goal,
        description=description,
        language=language,
        default_time_limit=default_time_limit,
        existing_questions=payload.existing_questions,
        additional=True,
        count=count,
    )

    try:
        data = await alteus_call_json(prompt, timeout_s=90.0)
        raw = data.get("questions")
        if not isinstance(raw, list) or len(raw) != count:
            raise AlteusResponseError(f"Model must return exactly {count} questions.")

        questions: List[QuestionCreate] = []
        for i, item in enumerate(raw):
            q = QuestionCreate.model_validate(item)
            questions.append(_normalize_question(q, default_time_limit=default_time_limit, order=i))
        return QuestionsResponse(questions=questions)
    except (AlteusConfigError, AlteusResponseError, ValueError) as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/quiz/question/options/regenerate", response_model=RegenerateOptionsResponse)
async def regenerate_options(payload: RegenerateOptionsRequest):
    goal = _clamp_str(payload.goal, QUIZ_TEXT_LIMITS["description"]) or ""
    description = _clamp_str(payload.description, QUIZ_TEXT_LIMITS["description"])
    language = _language_default(payload.language)
    question_text = _clamp_str(payload.question_text, QUIZ_TEXT_LIMITS["question_text"]) or ""

    prompt = _prompt_regenerate_options(
        goal=goal,
        description=description,
        language=language,
        question_text=question_text,
        old_options=payload.old_options,
    )

    try:
        data = await alteus_call_json(prompt, timeout_s=60.0)
        raw_opts = data.get("options")
        if not isinstance(raw_opts, list) or len(raw_opts) != 4:
            raise AlteusResponseError("Model must return exactly 4 options.")
        options = [AnswerOptionCreate.model_validate(o) for o in raw_opts]
        options = _normalize_options(options)
        explanation = _clamp_str(str(data.get("explanation", "")).strip(), QUIZ_TEXT_LIMITS["explanation"]) or ""
        return RegenerateOptionsResponse(options=options, explanation=explanation)
    except (AlteusConfigError, AlteusResponseError, ValueError) as e:
        raise HTTPException(status_code=502, detail=str(e))


