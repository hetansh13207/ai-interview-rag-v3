from pydantic import BaseModel, Field


class ChatEvaluationReport(BaseModel):
    overall_score: float = Field(
        ge=0,
        le=10,
    )

    technical_knowledge_score: float = Field(
        ge=0,
        le=10,
    )

    role_relevance_score: float = Field(
        ge=0,
        le=10,
    )

    problem_solving_score: float = Field(
        ge=0,
        le=10,
    )

    communication_score: float = Field(
        ge=0,
        le=10,
    )

    resume_understanding_score: float = Field(
        ge=0,
        le=10,
    )

    strengths: list[str] = Field(
        default_factory=list
    )

    weaknesses: list[str] = Field(
        default_factory=list
    )

    technical_assessment: str

    overall_feedback: str

    recommendation: str


class EvaluateChatInterviewRequest(BaseModel):
    session_id: str