import uuid
from datetime import datetime, timezone
from fastapi import HTTPException
from app.database import get_db

class AlertService:
    @staticmethod
    async def create_alert(event_doc: dict):
        db = get_db()
        now = datetime.now(timezone.utc).isoformat()
        
        alert_doc = {
            "alert_id": f"ALT-{uuid.uuid4().hex[:8].upper()}",
            "event_id": event_doc["event_id"],
            "node_id": event_doc["node_id"],
            "severity": event_doc["risk_level"].lower(),
            "title": f"Possible {event_doc['event_type'].capitalize()} Detected",
            "message": f"High risk event detected at node {event_doc['node_id']}. Confidence: {event_doc.get('confidence', 0)*100}%",
            "acknowledged": False,
            "created_at": now
        }
        
        await db.alerts.insert_one(alert_doc)
        alert_doc.pop('_id', None)
        
        from app.websocket.manager import manager
        await manager.broadcast("NEW_ALERT", alert_doc)
        
        return alert_doc

    @staticmethod
    async def get_alerts():
        db = get_db()
        cursor = db.alerts.find({}, {"_id": 0}).sort("created_at", -1)
        return await cursor.to_list(length=100)

    @staticmethod
    async def acknowledge_alert(alert_id: str):
        db = get_db()
        result = await db.alerts.update_one(
            {"alert_id": alert_id},
            {"$set": {"acknowledged": True}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Alert not found")
        return {"success": True, "message": "Alert acknowledged"}
