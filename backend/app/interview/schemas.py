from pydantic import BaseModel, Field


class InterviewQuestion(BaseModel):
    question: str
    topic: str
    difficulty: str


class InterviewPlan(BaseModel):
    target_role: str
    total_questions: int = Field(default=10, ge=1)
    topics: list[str] = Field(default_factory=list)
    questions: list[InterviewQuestion] = Field(default_factory=list)


class InterviewTurn(BaseModel):
    question: str
    answer: str
    topic: str
    difficulty: str


class InterviewState(BaseModel):
    resume_id: str
    plan: InterviewPlan
    current_question_index: int = 0
    turns: list[InterviewTurn] = Field(default_factory=list)
    completed: bool = False