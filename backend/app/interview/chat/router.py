from fastapi import APIRouter, HTTPException, Depends

from app.interview.chat.analysis.schemas import (
    ChatEvaluationReport,
)
from app.interview.chat.analysis.service import (
    evaluate_chat_interview,
)
from app.interview.chat.schemas import (
    ChatInterviewState,
    ChatInterviewStatus,
    EvaluateChatInterviewRequest,
    SendChatMessageRequest,
    StartChatInterviewRequest,
)
from app.interview.chat.state import (
    add_message,
    create_chat_interview_state,
    get_chat_interview_state,
    get_remaining_seconds,
    is_time_expired,
    refresh_completion_state,
    save_chat_interview_state,
)
from app.interview.chat.service import (
    assess_answer_relevance,
    generate_clarification_question,
    generate_closing_question,
    generate_follow_up_question,
    get_previous_interviewer_question,
    mark_insufficient_evidence,
    should_start_closing,
)
from app.auth import get_current_user_id


router = APIRouter(
    prefix="/interview/chat",
    tags=["Interview Chat"],
)


@router.post(
    "/start",
    response_model=ChatInterviewState,
)
def start_chat_interview(
    request: StartChatInterviewRequest,
    user_id: str = Depends(get_current_user_id),
) -> ChatInterviewState:

    if not request.resume_id.strip():
        raise HTTPException(
            status_code=400,
            detail="resume_id cannot be empty.",
        )

    if not request.target_role.strip():
        raise HTTPException(
            status_code=400,
            detail="target_role cannot be empty.",
        )

    state = create_chat_interview_state(
        resume_id=request.resume_id.strip(),
        target_role=request.target_role.strip(),
        duration_minutes=request.duration_minutes,
    )

    opening_message = (
        f"Hi! I'm your AI interviewer for the "
        f"{state.target_role} role. "
        "Let's start with a brief introduction. "
        f"Tell me about your experience and the projects "
        f"most relevant to the {state.target_role} role."
    )

    add_message(
        state=state,
        role="ai",
        content=opening_message,
    )

    return state


@router.get(
    "/{session_id}",
    response_model=ChatInterviewState,
)
def get_chat_interview_state_api(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
) -> ChatInterviewState:
    if not session_id.strip():
        raise HTTPException(status_code=400, detail="session_id cannot be empty.")
    state = get_chat_interview_state(session_id.strip())
    if state is None:
        raise HTTPException(status_code=404, detail="Interview session not found.")
    return state


@router.get(
    "/{session_id}/status",
    response_model=ChatInterviewStatus,
)
def get_chat_interview_status(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
) -> ChatInterviewStatus:

    if not session_id.strip():
        raise HTTPException(
            status_code=400,
            detail="session_id cannot be empty.",
        )

    state = get_chat_interview_state(
        session_id.strip()
    )

    if state is None:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found.",
        )

    state = refresh_completion_state(state)

    remaining_seconds = int(
        get_remaining_seconds(state)
    )

    return ChatInterviewStatus(
        session_id=state.session_id,
        duration_minutes=state.duration_minutes,
        remaining_seconds=remaining_seconds,
        completed=state.completed,
    )


@router.post(
    "/message",
    response_model=ChatInterviewState,
)
def send_chat_message(
    request: SendChatMessageRequest,
    user_id: str = Depends(get_current_user_id),
) -> ChatInterviewState:

    if not request.session_id.strip():
        raise HTTPException(
            status_code=400,
            detail="session_id cannot be empty.",
        )

    if not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="message cannot be empty.",
        )

    state = get_chat_interview_state(
        request.session_id.strip()
    )

    if state is None:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found.",
        )

    state = refresh_completion_state(state)

    if state.completed:
        raise HTTPException(
            status_code=400,
            detail="Interview has already been completed.",
        )

    if is_time_expired(state):
        state.completed = True

        save_chat_interview_state(state)

        raise HTTPException(
            status_code=400,
            detail="Interview time has expired.",
        )

    previous_question = get_previous_interviewer_question(
        state
    )

    candidate_answer = request.message.strip()

    add_message(
        state=state,
        role="candidate",
        content=candidate_answer,
    )

    # If the candidate is answering the final closing
    # question, the interview ends after that answer.
    if state.closing_started:
        closing_message = (
            "Thank you for your time. That concludes the interview. "
            "Your responses have been recorded, and the interview is now complete."
        )

        add_message(
            state=state,
            role="ai",
            content=closing_message,
        )

        state.completed = True

        save_chat_interview_state(state)

        return state

    try:
        relevance = assess_answer_relevance(
            question=previous_question,
            answer=candidate_answer,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to assess the candidate's answer: "
                f"{str(exc)}"
            ),
        ) from exc

    classification = relevance["classification"]

    # ---------------------------------------------------------
    # FIRST CLARIFICATION ATTEMPT
    # ---------------------------------------------------------
    #
    # If the candidate did not properly answer the question,
    # give exactly one clarification opportunity.
    #
    if (
        classification
        in {"partially_answered", "not_answered"}
        and not state.clarification_attempted
    ):
        try:
            clarification_question = (
                generate_clarification_question(
                    state
                )
            )

        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=(
                    "Failed to generate the clarification "
                    f"question: {str(exc)}"
                ),
            ) from exc

        state.clarification_attempted = True

        add_message(
            state=state,
            role="ai",
            content=clarification_question,
        )

        save_chat_interview_state(state)

        return state

    # ---------------------------------------------------------
    # INSUFFICIENT EVIDENCE AFTER CLARIFICATION
    # ---------------------------------------------------------
    #
    # If the candidate still does not answer the question
    # after the clarification attempt, record the current
    # topic as insufficient evidence and move on.
    #
    if (
        classification
        in {"partially_answered", "not_answered"}
        and state.clarification_attempted
    ):
        mark_insufficient_evidence(state)

        state.clarification_attempted = False

    # A satisfactory answer resets the clarification state
    # for the next interview question.
    if classification == "answered":
        state.clarification_attempted = False

    # ---------------------------------------------------------
    # CHECK TIME BEFORE NEXT QUESTION
    # ---------------------------------------------------------

    remaining_seconds = int(
        get_remaining_seconds(state)
    )

    # If time has already expired, complete the interview.
    if remaining_seconds <= 0:
        state.completed = True

        save_chat_interview_state(state)

        return state

    # If very little time remains, enter the closing phase.
    if should_start_closing(
        state,
        remaining_seconds,
    ):
        try:
            closing_question = generate_closing_question(
                state
            )

        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=(
                    "Failed to generate the closing "
                    f"question: {str(exc)}"
                ),
            ) from exc

        state.closing_started = True
        state.clarification_attempted = False

        add_message(
            state=state,
            role="ai",
            content=closing_question,
        )

        save_chat_interview_state(state)

        return state

    # ---------------------------------------------------------
    # GENERATE NORMAL NEXT QUESTION
    # ---------------------------------------------------------

    try:
        next_question = generate_follow_up_question(
            state
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate the next interview "
                f"question: {str(exc)}"
            ),
        ) from exc

    # ---------------------------------------------------------
    # CHECK TIME AGAIN AFTER LLM GENERATION
    # ---------------------------------------------------------
    #
    # The LLM request itself can take several seconds.
    # Therefore, the interview may enter the closing window
    # while the normal question is being generated.
    #
    remaining_seconds = int(
        get_remaining_seconds(state)
    )

    # If the interview expired while generating the question,
    # do not return the generated question.
    if remaining_seconds <= 0:
        state.completed = True

        save_chat_interview_state(state)

        return state

    # If the interview entered the final 30-second window
    # while generating the normal question, discard that
    # normal question and generate the closing question.
    if remaining_seconds <= 30:
        try:
            closing_question = generate_closing_question(
                state
            )

        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=(
                    "Failed to generate the closing "
                    f"question: {str(exc)}"
                ),
            ) from exc

        state.closing_started = True
        state.clarification_attempted = False

        add_message(
            state=state,
            role="ai",
            content=closing_question,
        )

        save_chat_interview_state(state)

        return state

    # Normal case: return the generated next interview question.
    add_message(
        state=state,
        role="ai",
        content=next_question,
    )

    return state


@router.post(
    "/evaluate",
    response_model=ChatEvaluationReport,
)
def evaluate_interview(
    request: EvaluateChatInterviewRequest,
    user_id: str = Depends(get_current_user_id),
) -> ChatEvaluationReport:

    if not request.session_id.strip():
        raise HTTPException(
            status_code=400,
            detail="session_id cannot be empty.",
        )

    state = get_chat_interview_state(
        request.session_id.strip()
    )

    if state is None:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found.",
        )

    state = refresh_completion_state(state)

    if not state.completed:
        raise HTTPException(
            status_code=400,
            detail=(
                "Interview is still in progress. "
                "Evaluation is available after "
                "the interview is completed."
            ),
        )

    if state.evaluation is not None:
        return state.evaluation

    try:
        evaluation = evaluate_chat_interview(
            state
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to evaluate the interview: "
                f"{str(exc)}"
            ),
        ) from exc

    state.evaluation = evaluation

    save_chat_interview_state(state)

    return evaluation


@router.get(
    "/{session_id}/result",
    response_model=ChatEvaluationReport,
)
def get_chat_interview_result(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
) -> ChatEvaluationReport:

    if not session_id.strip():
        raise HTTPException(
            status_code=400,
            detail="session_id cannot be empty.",
        )

    state = get_chat_interview_state(
        session_id.strip()
    )

    if state is None:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found.",
        )

    state = refresh_completion_state(state)

    if not state.completed:
        raise HTTPException(
            status_code=400,
            detail=(
                "Interview is still in progress. "
                "The final result is available after "
                "the interview is completed."
            ),
        )

    if state.evaluation is not None:
        return state.evaluation

    try:
        evaluation = evaluate_chat_interview(
            state
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate the interview result: "
                f"{str(exc)}"
            ),
        ) from exc

    state.evaluation = evaluation

    save_chat_interview_state(state)

    return evaluation