from sqlalchemy import Column, Integer, String, DateTime, JSON
from datetime import datetime
from app.database import Base

class InterviewHistory(Base):
    __tablename__ = "interview_history"

    id = Column(Integer, primary_key=True, index=True)
    clerk_user_id = Column(String, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    messages = Column(JSON, nullable=False)
    evaluation = Column(JSON, nullable=True)
