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
    async def evaluate_reading(sensor_data: dict):
        risk_score, risk_level, event_types = RiskService.calculate_risk(sensor_data)
        
        if not event_types:
            return None # No significant event
            
        db = get_db()
        now = datetime.now(timezone.utc).isoformat()
        
        # Combine event types for this reading
        main_event_type = event_types[0] if "fire" not in event_types else "fire"
        
        event_doc = {
            "event_id": f"EVT-{uuid.uuid4().hex[:8].upper()}",
            "node_id": sensor_data["node_id"],
            "event_type": main_event_type,
            "confidence": 0.9 if risk_score > 80 else 0.7,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "status": "detected",
            "confirmed": False,
            "timestamp": now
        }
        
        await db.events.insert_one(event_doc)
        event_doc.pop('_id', None)
        
        # Phase 6 Alert generation hook here if critical
        from app.services.alert_service import AlertService
        if risk_level == "CRITICAL":
            await AlertService.create_alert(event_doc)
            
        from app.websocket.manager import manager
        await manager.broadcast("NEW_EVENT", event_doc)
        
        return event_doc
