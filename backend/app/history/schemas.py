from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class HistoryCreate(BaseModel):
    messages: List[Dict[str, Any]]
    evaluation: Dict[str, Any]

class HistoryResponse(BaseModel):
    id: int
    created_at: datetime
    messages: List[Dict[str, Any]]
    evaluation: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
