from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.analyzer.schemas import CandidateProfile
from app.analyzer.service import analyze_resume
from app.auth import get_current_user_id
from app.rag.service import ingest_resume
from app.resume.service import extract_text_from_pdf
from app.resume.validator import validate_resume_document


router = APIRouter(
    prefix="/resume",
    tags=["Resume"],
)


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
) -> dict:

    # =====================================================
    # 1. FILE CHECK
    # =====================================================

    if not file:
        raise HTTPException(
            status_code=400,
            detail="Please upload a resume PDF.",
        )


    # =====================================================
    # 2. PDF CHECK
    # =====================================================

    if file.content_type != "application/pdf":

        raise HTTPException(
            status_code=400,
            detail=(
                "Only PDF files are supported. "
                "Please upload your resume as a PDF."
            ),
        )


    # =====================================================
    # 3. EXTRACT TEXT
    # =====================================================

    try:

        text = await extract_text_from_pdf(
            file
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:

        raise HTTPException(
            status_code=400,
            detail=(
                "The uploaded PDF could not be processed. "
                "Please upload a valid resume PDF."
            ),
        ) from exc


    # =====================================================
    # 4. DOCUMENT TYPE VALIDATION
    #
    # IMPORTANT:
    #
    # This happens BEFORE:
    # - analyze_resume()
    # - creating resume_id
    # - embeddings
    # - Qdrant chunks
    # =====================================================

    try:

        validation = validate_resume_document(
            text
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "The document could not be validated. "
                "Please try again."
            ),
        ) from exc


    # =====================================================
    # 5. REJECT NON-RESUME DOCUMENTS
    # =====================================================

    if not validation.is_resume:

        raise HTTPException(
            status_code=400,
            detail=(
                "This document does not appear to be a resume or CV. "
                "Please upload a resume/CV created for job or internship applications."
            ),
        )


    # =====================================================
    # 6. CONFIDENCE CHECK
    #
    # If the classifier is uncertain, reject rather than
    # accidentally putting unrelated documents into RAG.
    # =====================================================

    if validation.confidence < 0.70:

        raise HTTPException(
            status_code=400,
            detail=(
                "We could not confidently identify this document as a resume or CV. "
                "Please upload a clear resume/CV."
            ),
        )


    # =====================================================
    # 7. ANALYZE RESUME
    # =====================================================

    try:

        profile: CandidateProfile = analyze_resume(
            text
        )


        # =================================================
        # 8. CREATE RESUME ID
        # =================================================

        resume_id = str(
            uuid4()
        )


        # =================================================
        # 9. CHUNK + EMBED + SAVE TO QDRANT
        #
        # This is reached ONLY for a valid resume.
        # =================================================

        rag_result = ingest_resume(
            resume_text=text,
            resume_id=resume_id,
        )


    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Resume processing failed: {str(exc)}"
            ),
        ) from exc


    # =====================================================
    # 10. SUCCESS
    # =====================================================

    return {

        "resume_id":
            resume_id,

        "filename":
            file.filename,

        "profile":
            profile.model_dump(),

        "rag":
            rag_result,

    }