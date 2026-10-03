from datetime import datetime, timezone
from uuid import uuid4

from app.interview.chat.schemas import (
    ChatInterviewState,
    ChatMessage,
)


_chat_sessions: dict[str, ChatInterviewState] = {}


def create_chat_interview_state(
    resume_id: str,
    target_role: str,
    duration_minutes: int,
) -> ChatInterviewState:

    state = ChatInterviewState(
        session_id=str(uuid4()),
        resume_id=resume_id,
        target_role=target_role,
        duration_minutes=duration_minutes,
        started_at=datetime.now(timezone.utc),
    )

    _chat_sessions[state.session_id] = state

    return state


def get_chat_interview_state(
    session_id: str,
) -> ChatInterviewState | None:

    return _chat_sessions.get(session_id)


def save_chat_interview_state(
    state: ChatInterviewState,
) -> ChatInterviewState:

    _chat_sessions[state.session_id] = state

    return state


def add_message(
    state: ChatInterviewState,
    role: str,
    content: str,
) -> ChatInterviewState:

    state.messages.append(
        ChatMessage(
            role=role,
            content=content,
        )
    )

    save_chat_interview_state(state)

    return state


def get_elapsed_seconds(
    state: ChatInterviewState,
) -> float:

    now = datetime.now(timezone.utc)

    elapsed = (
        now - state.started_at
    ).total_seconds()

    return max(
        0.0,
        elapsed,
    )


def get_remaining_seconds(
    state: ChatInterviewState,
) -> float:

    total_seconds = (
        state.duration_minutes * 60
    )

    elapsed_seconds = get_elapsed_seconds(
        state
    )

    return max(
        0.0,
        total_seconds - elapsed_seconds,
    )


def is_time_expired(
    state: ChatInterviewState,
) -> bool:

    return get_remaining_seconds(
        state
    ) <= 0


def refresh_completion_state(
    state: ChatInterviewState,
) -> ChatInterviewState:

    if not state.completed and is_time_expired(state):
        state.completed = True
        save_chat_interview_state(state)

    return state