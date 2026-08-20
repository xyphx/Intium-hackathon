import uuid
from datetime import datetime, timezone
from app.database import get_db

class RiskService:
    @staticmethod
    def calculate_risk(sensor_data: dict):
        risk_score = 0
        event_types = []
        
        temp = sensor_data.get("temperature")
        if temp is not None:
            if temp > 60:
                risk_score += 80
                event_types.append("fire")
            elif temp > 40:
                risk_score += 40
                event_types.append("high_temperature")
                
        smoke = sensor_data.get("smoke")
        if smoke is not None:
            if smoke > 50:
                risk_score += 60
                event_types.append("smoke")
                
        motion = sensor_data.get("motion")
        if motion:
            risk_score += 20
            event_types.append("motion")
            
        if risk_score > 100:
            risk_score = 100
            
        risk_level = "LOW"
        if risk_score >= 80:
            risk_level = "CRITICAL"
        elif risk_score >= 50:
            risk_level = "HIGH"
        elif risk_score >= 20:
            risk_level = "MEDIUM"
            
        return risk_score, risk_level, event_types

    @staticmethod
    async def evaluate_cloud_result(cloud_result: dict):
        risk = cloud_result.get("risk", {})
        risk_score = risk.get("score", 0)
        risk_level = risk.get("level", "LOW")
        
        # Determine if we should create an event
        if risk_level in ["LOW", "MEDIUM"] and not cloud_result.get("cloud_ai", {}).get("classification"):
            return None
            
        db = get_db()
        now = datetime.now(timezone.utc).isoformat()
        
        event_type = cloud_result.get("cloud_ai", {}).get("classification")
        if not event_type or event_type == "unknown":
            if risk_level == "CRITICAL":
                event_type = "critical_anomaly"
            elif risk_level == "HIGH":
                event_type = "high_risk_anomaly"
            else:
                event_type = "suspicious_activity"
                
        event_doc = {
            "event_id": f"EVT-{uuid.uuid4().hex[:8].upper()}",
            "node_id": cloud_result["node_id"],
            "event_type": event_type,
            "confidence": cloud_result.get("cloud_ai", {}).get("confidence", 0.0),
            "risk_score": risk_score,
            "risk_level": risk_level,
            "status": "detected",
            "confirmed": cloud_result.get("fusion", {}).get("nodes_confirmed", 0) > 0,
            "evidence": risk.get("evidence", []),
            "timestamp": now
        }
        
        await db.events.insert_one(event_doc)
        event_doc.pop('_id', None)
        
        from app.services.alert_service import AlertService
        if risk_level == "CRITICAL":
            await AlertService.create_alert(event_doc)
            
        from app.websocket.manager import manager
        await manager.broadcast("NEW_EVENT", event_doc)
        
        return event_doc
