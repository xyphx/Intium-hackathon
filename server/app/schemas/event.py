from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EventBase(BaseModel):
    node_id: str
    event_type: str
    confidence: Optional[float] = None
    risk_score: int
    risk_level: str
    status: str = "detected"
    confirmed: bool = False

class EventCreate(EventBase):
    pass

class EventResponse(EventBase):
    event_id: str
    timestamp: datetime
    confirming_node: Optional[str] = None
