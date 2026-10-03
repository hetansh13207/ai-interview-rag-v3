import os

from dotenv import load_dotenv
from openai import OpenAI

from app.interview.analysis.schemas import AnswerAnalysis

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
model = os.getenv("OPENAI_MODEL")

if not api_key:
    raise RuntimeError("OPENAI_API_KEY is not configured.")

if not model:
    raise RuntimeError("OPENAI_MODEL is not configured.")

client = OpenAI(api_key=api_key)


def analyze_answer(
    question: str,
    answer: str,
    resume_context: str,
) -> AnswerAnalysis:

    response = client.responses.parse(
        model=model,
        input=[
            {
                "role": "system",
                "content": (
                    """You are a technical interview answer evaluator. 
                    Evaluate the candidate's answer objectively. 
                    Use the resume context only to understand the 
                    candidate's background. 
                    Do not assume facts that are not provided. 
                    Evaluate correctness, technical depth, and clarity. 
                    Give a score from 0 to 10. 
                    Identify concrete strengths and weaknesses. 
                    Recommend whether the interviewer should probe 
                    deeper, maintain the difficulty, or move to another 
                    topic.
                    Evaluate the candidate's answer using three independent numerical
                    dimensions, each from 0 to 10:

                    1. correctness_score:
                    How technically correct the answer is.

                    2. technical_depth_score:
                    How deeply the candidate understands the concept, including
                    implementation details, trade-offs, edge cases, and reasoning
                    where relevant.

                    3. clarity_score:
                    How clearly, logically, and directly the candidate communicates.

                    Also provide the corresponding qualitative descriptions in:
                    correctness, technical_depth, and clarity.

                    The overall score should reflect the quality of the answer across
                    correctness, technical depth, and clarity.

                    Do not give high scores merely because an answer is long.
                    Do not penalize concise answers if they correctly answer the question.

                    Base the evaluation on the question being asked and the candidate's
                    actual answer. Do not assume information that the candidate did not provide."""
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Interview question:\n{question}\n\n"
                    f"Candidate answer:\n{answer}\n\n"
                    f"Relevant resume context:\n"
                    f"{resume_context or 'No resume context available.'}"
                ),
            },
        ],
        text_format=AnswerAnalysis,
    )

    return response.output_parsed