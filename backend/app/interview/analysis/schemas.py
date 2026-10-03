from pydantic import BaseModel, Field


class AnswerAnalysis(BaseModel):
    score: float = Field(
        ge=0,
        le=10,
        description="Overall answer score from 0 to 10."
    )

    correctness_score: float = Field(
        ge=0,
        le=10,
        description="How technically correct the answer is, from 0 to 10."
    )

    technical_depth_score: float = Field(
        ge=0,
        le=10,
        description="How deep, complete, and technically detailed the answer is, from 0 to 10."
    )

    clarity_score: float = Field(
        ge=0,
        le=10,
        description="How clearly and logically the answer is communicated, from 0 to 10."
    )

    correctness: str

    technical_depth: str

    clarity: str

    strengths: list[str] = Field(
        default_factory=list
    )

    weaknesses: list[str] = Field(
        default_factory=list
    )

    recommendation: str