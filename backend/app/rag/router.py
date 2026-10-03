from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth import get_current_user_id
from app.rag.service import retrieve_resume_context


router = APIRouter(
    prefix="/rag",
    tags=["RAG"],
)


class RetrievalRequest(BaseModel):
    resume_id: str
    query: str = Field(..., min_length=1)
    limit: int = 5


@router.post("/retrieve")
def retrieve_context(
    request: RetrievalRequest,
    user_id: str = Depends(get_current_user_id),
):
    try:
        results = retrieve_resume_context(
            query=request.query,
            resume_id=request.resume_id,
            limit=request.limit,
        )

        return {
            "query": request.query,
            "results": results,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Retrieval failed: {str(exc)}",
        ) from exc