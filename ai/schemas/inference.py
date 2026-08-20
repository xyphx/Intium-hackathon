from pydantic import BaseModel, Field
from typing import Optional, List

class EdgeAI(BaseModel):
    event: Optional[str] = None
    confidence: Optional[float] = None
    model_version: Optional[str] = None

class CloudAI(BaseModel):
    classification: Optional[str] = None
    confidence: Optional[float] = None

class SensorFusion(BaseModel):
    nodes_confirmed: int = 0
    evidence_count: int = 0

class Trend(BaseModel):
    temperature: Optional[str] = None
    smoke: Optional[str] = None
    battery: Optional[str] = None

class Anomaly(BaseModel):
    detected: bool = False
    score: float = 0.0
    reason: Optional[str] = None

class Risk(BaseModel):
    score: int = 0
    level: str = "LOW"
    evidence: List[str] = Field(default_factory=list)

class CloudAIResult(BaseModel):
    node_id: str
    edge_ai: EdgeAI
    cloud_ai: CloudAI
    fusion: SensorFusion
    trend: Trend
    anomaly: Anomaly
    risk: Risk
