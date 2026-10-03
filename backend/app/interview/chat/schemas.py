from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["ai", "candidate"]
    content: str


class ChatInterviewState(BaseModel):
    session_id: str
    resume_id: str
    target_role: str
    duration_minutes: Literal[2, 5, 10, 20]

    started_at: datetime

    messages: list[ChatMessage] = Field(
        default_factory=list
    )

    current_topic: str | None = None

    covered_topics: list[str] = Field(
        default_factory=list
    )

    closing_started: bool = False

    current_topic_question_count: int = 0

    clarification_attempted: bool = False

    insufficient_evidence_topics: list[str] = Field(
        default_factory=list
    )

    completed: bool = False

    evaluation: "ChatEvaluationReport | None" = None


class ChatInterviewStatus(BaseModel):
    session_id: str
    duration_minutes: Literal[2, 5, 10, 20]
    remaining_seconds: int
    completed: bool


class StartChatInterviewRequest(BaseModel):
    resume_id: str
    target_role: str
    duration_minutes: Literal[2, 5, 10, 20]


class SendChatMessageRequest(BaseModel):
    session_id: str
    message: str


class EvaluateChatInterviewRequest(BaseModel):
    session_id: str


from app.interview.chat.analysis.schemas import (
    ChatEvaluationReport,
)