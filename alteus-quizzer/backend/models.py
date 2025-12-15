from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel, JSON
from datetime import datetime
import uuid

# --- Base Models ---

class QuizBase(SQLModel):
    title: str
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

class Quiz(QuizBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    questions: List["Question"] = Relationship(back_populates="quiz", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    sessions: List["Session"] = Relationship(back_populates="quiz")

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
    participants: List["Participant"] = Relationship(back_populates="session")

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
