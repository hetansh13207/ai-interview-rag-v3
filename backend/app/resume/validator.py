from pydantic import BaseModel, Field
from openai import OpenAI
import os


class ResumeValidation(BaseModel):
    is_resume: bool
    confidence: float = Field(ge=0, le=1)
    reason: str


client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


def validate_resume_document(
    text: str,
) -> ResumeValidation:
    """
    Determine whether the extracted document is actually
    a resume/CV before allowing it into the RAG pipeline.
    """

    if not text or not text.strip():
        return ResumeValidation(
            is_resume=False,
            confidence=1.0,
            reason="The document contains no readable text.",
        )


    # Limit the amount of document text sent for classification.
    # The beginning of a resume normally contains enough information
    # to identify its document type.
    document_text = text[:12000]


    response = client.responses.parse(
        model=os.getenv("OPENAI_MODEL"),
        input=[
            {
                "role": "system",
                "content": """
You are a strict document-type classifier for an AI interview system.

Your ONLY job is to determine whether the uploaded document is
a RESUME/CV intended to describe a person's professional,
technical, educational, project, or work background for hiring.

Return is_resume=true ONLY when the document is genuinely a
resume/CV.

Accept documents such as:
- Resume
- CV
- Curriculum Vitae
- Professional resume
- Technical resume
- Fresher resume
- Student resume intended for job applications
- Internship resume
- Software/ML/Data/Backend/Frontend/Full Stack resume

A student resume is valid if it is clearly structured as a
resume/CV for the person.

REJECT documents such as:
- College assignments
- College practical files
- Lab manuals
- Lab records
- Subject notes
- Syllabus
- Question papers
- Academic handbooks
- College notices
- Certificates
- Academic reports
- Research papers
- Project reports
- Project documentation
- Tutorials
- Textbooks
- Lecture notes
- Course material
- Company documentation
- Invoices
- Forms
- Applications
- Mark sheets
- Timetables
- Any other document that is NOT a resume/CV

Be especially strict with college documents.

For example, a document containing:
- subject code
- subject name
- semester
- experiment index
- assignment list
- marks/signature columns
- lab experiments
- university/college syllabus
should normally be classified as NOT a resume.

Do not classify a document as a resume merely because it contains
words such as:
Python, Java, SQL, Computer Engineering, AI, ML, projects,
skills, technology, or programming.

The document must have the overall purpose and structure of a
person's resume/CV.

Return:
1. is_resume
2. confidence between 0 and 1
3. a short reason explaining the decision.
""",
            },
            {
                "role": "user",
                "content": f"""
Classify this uploaded document:

--- DOCUMENT START ---

{document_text}

--- DOCUMENT END ---
""",
            },
        ],
        text_format=ResumeValidation,
    )


    return response.output_parsed