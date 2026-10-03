from app.interview.schemas import (
    InterviewPlan,
    InterviewState,
    InterviewTurn,
)


def create_interview_state(
    resume_id: str,
    plan: InterviewPlan,
) -> InterviewState:

    return InterviewState(
        resume_id=resume_id,
        plan=plan,
    )


def add_turn(
    state: InterviewState,
    question: str,
    answer: str,
    topic: str,
    difficulty: str,
) -> InterviewState:

    state.turns.append(
        InterviewTurn(
            question=question,
            answer=answer,
            topic=topic,
            difficulty=difficulty,
        )
    )

    state.current_question_index += 1

    if state.current_question_index >= state.plan.total_questions:
        state.completed = True

    return state