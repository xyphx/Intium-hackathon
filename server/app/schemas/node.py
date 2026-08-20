from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Location(BaseModel):
    latitude: float
    longitude: float

class NodeBase(BaseModel):
    name: str
    capabilities: List[str] = []
    location: Optional[Location] = None

class NodeCreate(NodeBase):
    node_id: str

class NodeHeartbeat(BaseModel):
    node_id: str
    battery: Optional[float] = None
    timestamp: Optional[datetime] = None

class NodeResponse(NodeBase):
    node_id: str
    status: str
    battery: Optional[float] = None
    last_seen: Optional[datetime] = None
    created_at: datetime
