import os

from dotenv import load_dotenv
from openai import OpenAI

from app.interview.schemas import InterviewState
from app.rag.service import retrieve_resume_context

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
model = os.getenv("OPENAI_MODEL")

if not api_key:
    raise RuntimeError("OPENAI_API_KEY is not configured.")

if not model:
    raise RuntimeError("OPENAI_MODEL is not configured.")

client = OpenAI(api_key=api_key)


def generate_next_question(
    state: InterviewState,
    answer_analysis=None,
) -> dict:

    if state.completed:
        return {
            "completed": True,
            "question": None,
            "context": [],
        }

    current_index = state.current_question_index

    if current_index >= len(state.plan.questions):
        return {
            "completed": True,
            "question": None,
            "context": [],
        }

    planned_question = state.plan.questions[current_index]

    query = (
        f"{planned_question.topic} "
        f"{planned_question.question}"
    )

    context = retrieve_resume_context(
        query=query,
        resume_id=state.resume_id,
        limit=5,
    )

    context_text = "\n\n".join(
        item["text"]
        for item in context
    )

    previous_turns = "\n\n".join(
        f"Question: {turn.question}\n"
        f"Answer: {turn.answer}"
        for turn in state.turns[-3:]
    )

    analysis_text = "No previous answer analysis available."

    if answer_analysis:
        analysis_text = (
            f"Score: {answer_analysis.score}/10\n"
            f"Correctness: {answer_analysis.correctness}\n"
            f"Technical depth: {answer_analysis.technical_depth}\n"
            f"Clarity: {answer_analysis.clarity}\n"
            f"Strengths: {answer_analysis.strengths}\n"
            f"Weaknesses: {answer_analysis.weaknesses}\n"
            f"Recommendation: {answer_analysis.recommendation}"
        )

    response = client.responses.create(
        model=model,
        input=[
            {
                "role": "system",
                "content": (
                    "You are an adaptive technical interviewer. "
                    "Ask exactly one interview question. "
                    "Use the interview plan, previous conversation, "
                    "candidate answer analysis, and retrieved resume "
                    "context. "
                    "Adapt the question based on the candidate's "
                    "performance. "
                    "If the candidate demonstrated weakness, probe "
                    "that area appropriately. "
                    "If the candidate demonstrated strong understanding, "
                    "increase the difficulty or go deeper. "
                    "The question must remain relevant to the candidate's "
                    "actual background. "
                    "Do not invent candidate experience. "
                    "Do not provide the answer. "
                    "Do not ask multiple questions at once."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Target role: {state.plan.target_role}\n\n"
                    f"Current topic: {planned_question.topic}\n"
                    f"Difficulty: {planned_question.difficulty}\n"
                    f"Planned question: {planned_question.question}\n\n"
                    f"Previous interview turns:\n"
                    f"{previous_turns or 'No previous turns.'}\n\n"
                    f"Previous answer analysis:\n"
                    f"{analysis_text}\n\n"
                    f"Relevant resume context:\n"
                    f"{context_text or 'No relevant resume context found.'}"
                ),
            },
        ],
    )

    question = response.output_text.strip()

    return {
        "completed": False,
        "question": question,
        "topic": planned_question.topic,
        "difficulty": planned_question.difficulty,
        "context": context,
    }