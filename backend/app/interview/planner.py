import os

from dotenv import load_dotenv
from openai import OpenAI

from app.analyzer.schemas import CandidateProfile
from app.interview.schemas import InterviewPlan

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
model = os.getenv("OPENAI_MODEL")

if not api_key:
    raise RuntimeError("OPENAI_API_KEY is not configured.")

if not model:
    raise RuntimeError("OPENAI_MODEL is not configured.")

client = OpenAI(api_key=api_key)


def create_interview_plan(
    profile: CandidateProfile,
    target_role: str,
) -> InterviewPlan:

    response = client.responses.parse(
        model=model,
        input=[
            {
                "role": "system",
                "content": (
                    "You are an expert technical interview planning system. "

                    "Create a personalized technical interview plan using "
                    "BOTH the candidate's resume profile AND the target job role. "

                    "The target role is the primary requirement for deciding "
                    "what technical areas should be evaluated. "

                    "Use the candidate's resume to personalize the questions "
                    "and connect questions to technologies, projects, skills, "
                    "and experience that are actually present in the resume. "

                    "Do not invent candidate experience, technologies, projects, "
                    "or responsibilities. "

                    "The number of questions must be appropriate for the target "
                    "role, the breadth of the role, the candidate's experience, "
                    "and the amount of technical material that needs to be evaluated. "

                    "Choose a practical interview length, generally between "
                    "6 and 10 questions. Do not always use the same number. "

                    "For a narrower or junior role, fewer questions may be appropriate. "
                    "For a broader or more senior role, more questions may be appropriate. "

                    "Make the topics relevant to the target role rather than "
                    "simply listing technologies found in the resume. "

                    "Questions should progressively increase in difficulty "
                    "where appropriate. "

                    "The final total_questions value MUST equal the actual "
                    "number of questions in the questions list."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Target job role:\n"
                    f"{target_role}\n\n"

                    f"Candidate resume profile:\n"
                    f"{profile.model_dump_json(indent=2)}"
                ),
            },
        ],
        text_format=InterviewPlan,
    )

    plan = response.output_parsed

    if not plan.questions:
        raise ValueError(
            "Interview planner returned no questions."
        )

    # Always make the count match the actual generated questions.
    plan.total_questions = len(plan.questions)

    # Ensure the target role shown in the plan is the requested role.
    plan.target_role = target_role

    return plan