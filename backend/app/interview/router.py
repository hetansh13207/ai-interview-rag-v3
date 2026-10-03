from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.analyzer.schemas import CandidateProfile
from app.interview.analysis.service import analyze_answer
from app.interview.interviewer import generate_next_question
from app.interview.planner import create_interview_plan
from app.interview.state import add_turn, create_interview_state
from app.interview.schemas import InterviewState, InterviewPlan
from app.rag.service import retrieve_resume_context
from app.auth import get_current_user_id

router = APIRouter(
    prefix="/interview",
    tags=["Interview"],
)


class InterviewPlanRequest(BaseModel):
    profile: CandidateProfile
    target_role: str


class StartInterviewRequest(BaseModel):
    resume_id: str
    profile: CandidateProfile
    target_role: str
    plan: InterviewPlan | None = None


class AnswerRequest(BaseModel):
    state: InterviewState
    answer: str

class AnalyzeAnswerRequest(BaseModel):
    question: str
    answer: str
    resume_context: str = ""


@router.post("/plan")
def generate_interview_plan(request: InterviewPlanRequest, user_id: str = Depends(get_current_user_id)):
    try:
        plan = create_interview_plan(
            profile=request.profile,
            target_role=request.target_role,
        )

        return {
            "plan": plan.model_dump(),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Interview plan generation failed: {str(exc)}",
        ) from exc


@router.post("/start")
def start_interview(request: StartInterviewRequest, user_id: str = Depends(get_current_user_id)):
    try:
        if request.plan is not None:
            plan = request.plan
        else:
            plan = create_interview_plan(
                profile=request.profile,
                target_role=request.target_role,
            )

        state = create_interview_state(
            resume_id=request.resume_id,
            plan=plan,
        )

        question = generate_next_question(state)

        return {
            "state": state.model_dump(),
            "question": question,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Interview start failed: {str(exc)}",
        ) from exc


@router.post("/answer")
def submit_answer(request: AnswerRequest, user_id: str = Depends(get_current_user_id)):
    try:
        state = request.state

        if state.completed:
            raise HTTPException(
                status_code=400,
                detail="Interview is already completed.",
            )

        current_question = state.plan.questions[
            state.current_question_index
        ]

        resume_context = retrieve_resume_context(
            query=current_question.question,
            resume_id=state.resume_id,
            limit=5,
        )

        context_text = "\n\n".join(
            item["text"]
            for item in resume_context
        )

        analysis = analyze_answer(
            question=current_question.question,
            answer=request.answer,
            resume_context=context_text,
        )

        updated_state = add_turn(
            state=state,
            question=current_question.question,
            answer=request.answer,
            topic=current_question.topic,
            difficulty=current_question.difficulty,
        )

        next_question = generate_next_question(
            state=updated_state,
            answer_analysis=analysis,
        )

        return {
            "state": updated_state.model_dump(),
            "analysis": analysis.model_dump(),
            "question": next_question,
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Answer processing failed: {str(exc)}",
        ) from exc


@router.post("/analyze-answer")
def analyze_interview_answer(request: AnalyzeAnswerRequest, user_id: str = Depends(get_current_user_id)):
    try:
        analysis = analyze_answer(
            question=request.question,
            answer=request.answer,
            resume_context=request.resume_context,
        )

        return {
            "analysis": analysis.model_dump(),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Answer analysis failed: {str(exc)}",
        ) from exc

    