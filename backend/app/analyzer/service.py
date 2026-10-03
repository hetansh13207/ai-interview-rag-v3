import os

from dotenv import load_dotenv
from openai import OpenAI

from app.analyzer.schemas import CandidateProfile


load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
model = os.getenv("OPENAI_MODEL")

if not api_key:
    raise RuntimeError("OPENAI_API_KEY is not configured.")

if not model:
    raise RuntimeError("OPENAI_MODEL is not configured.")

client = OpenAI(api_key=api_key)


def analyze_resume(resume_text: str) -> CandidateProfile:
    response = client.responses.parse(
        model=model,
        input=[
            {
                "role": "system",
                "content": (
                    "You are a resume analysis system. "
                    "Extract information from the provided resume accurately. "
                    "Do not invent skills, experience, projects, companies, "
                    "roles, or technologies that are not supported by the resume."
                ),
            },
            {
                "role": "user",
                "content": resume_text,
            },
        ],
        text_format=CandidateProfile,
    )

    return response.output_parsed