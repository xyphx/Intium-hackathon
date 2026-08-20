from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SensorDataCreate(BaseModel):
    node_id: str
    timestamp: Optional[datetime] = None
    temperature: Optional[float] = None
    smoke: Optional[float] = None
    humidity: Optional[float] = None
    motion: Optional[bool] = None
    distance: Optional[float] = None
    gas: Optional[float] = None
    battery: Optional[float] = None
    vision_result: Optional[str] = None
    ai_confidence: Optional[float] = None
    rssi: Optional[float] = None
    snr: Optional[float] = None
    gateway_id: Optional[str] = None
