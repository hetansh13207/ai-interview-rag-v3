from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import InterviewHistory
from app.auth import get_current_user_id
from app.history.schemas import HistoryCreate, HistoryResponse

router = APIRouter(
    prefix="/history",
    tags=["History"],
)

@router.post("/", response_model=HistoryResponse)
def create_history(
    history: HistoryCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    db_history = InterviewHistory(
        clerk_user_id=user_id,
        messages=history.messages,
        evaluation=history.evaluation
    )
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history

@router.get("/", response_model=List[HistoryResponse])
def get_history(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    history_list = db.query(InterviewHistory).filter(InterviewHistory.clerk_user_id == user_id).order_by(InterviewHistory.created_at.desc()).all()
    return history_list
