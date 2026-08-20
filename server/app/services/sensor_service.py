from datetime import datetime, timezone
from fastapi import HTTPException
from app.database import get_db
from app.schemas.sensor import SensorDataCreate

class SensorService:
    @staticmethod
    async def process_sensor_data(data: SensorDataCreate):
        db = get_db()
        
        # Verify node exists
        node = await db.nodes.find_one({"node_id": data.node_id})
        if not node:
            raise HTTPException(status_code=404, detail="Node not found")
            
        doc = data.model_dump()
        if doc.get("timestamp") is None:
            doc["timestamp"] = datetime.now(timezone.utc).isoformat()
        else:
            doc["timestamp"] = doc["timestamp"].isoformat() if isinstance(doc["timestamp"], datetime) else doc["timestamp"]
            
        # Store raw reading
        await db.sensor_readings.insert_one(doc)
        
        # Update node's last_seen and battery if present
        update_data = {"last_seen": doc["timestamp"], "status": "online"}
        if doc.get("battery") is not None:
            update_data["battery"] = doc["battery"]
            
        await db.nodes.update_one(
            {"node_id": data.node_id},
            {"$set": update_data}
        )
        
        from app.services.risk_service import RiskService
        await RiskService.evaluate_reading(doc)
        
        from app.websocket.manager import manager
        await manager.broadcast("SENSOR_UPDATE", doc)
        
        return {"success": True, "message": "Sensor data processed"}

    @staticmethod
    async def get_sensor_data(node_id: str = None, limit: int = 50):
        db = get_db()
        query = {}
        if node_id:
            query["node_id"] = node_id
            
        cursor = db.sensor_readings.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit)
        readings = await cursor.to_list(length=limit)
        return readings
