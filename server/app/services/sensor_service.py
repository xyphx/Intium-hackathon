from datetime import datetime, timezone
from fastapi import HTTPException
from app.database import get_db
from app.schemas.sensor import SensorDataCreate

class SensorService:
    @staticmethod
    async def process_sensor_data(data: SensorDataCreate):
        db = get_db()
        
        # Verify node exists or auto-register if missing
        node = await db.nodes.find_one({"node_id": data.node_id})
        from app.services.node_service import get_base_location
        import random

        if not node:
            base_loc = get_base_location()
            lat = base_loc[0] + random.uniform(-0.45, 0.45)
            lon = base_loc[1] + random.uniform(-0.45, 0.45)
            now = datetime.now(timezone.utc).isoformat()
            node_doc = {
                "node_id": data.node_id,
                "name": f"Sensor Node {data.node_id}",
                "capabilities": ["temperature", "smoke"],
                "location": {"latitude": lat, "longitude": lon},
                "status": "online",
                "battery": data.battery,
                "last_seen": now,
                "created_at": now
            }
            await db.nodes.insert_one(node_doc)
            node_doc.pop('_id', None)
            from app.websocket.manager import manager
            await manager.broadcast("NODE_ONLINE", node_doc)
        elif not node.get("location"):
            base_loc = get_base_location()
            lat = base_loc[0] + random.uniform(-0.45, 0.45)
            lon = base_loc[1] + random.uniform(-0.45, 0.45)
            loc = {"latitude": lat, "longitude": lon}
            await db.nodes.update_one({"node_id": data.node_id}, {"$set": {"location": loc}})
            node["location"] = loc
            from app.websocket.manager import manager
            await manager.broadcast("NODE_STATUS_CHANGED", {"node_id": data.node_id, "location": loc, "status": "online"})
            
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
        
        # Fetch historical readings for this node
        cursor = db.sensor_readings.find({"node_id": data.node_id}, {"_id": 0}).sort("timestamp", -1).limit(10)
        history = await cursor.to_list(length=10)
        history.reverse() # Oldest to newest
        
        # Fetch recent events
        event_cursor = db.events.find({}, {"_id": 0}).sort("timestamp", -1).limit(20)
        recent_events = await event_cursor.to_list(length=20)
        
        # Cloud AI Processing
        from ai.services.decision_engine import process_telemetry
        cloud_result = process_telemetry(data.node_id, doc, history, recent_events)
        
        # Store Cloud AI Result
        cloud_doc = cloud_result.copy()
        await db.cloud_ai_results.insert_one(cloud_doc)
        cloud_result.pop('_id', None)
        
        # Pass to RiskService to create event/alert based on Cloud AI
        from app.services.risk_service import RiskService
        await RiskService.evaluate_cloud_result(cloud_result)
        
        from app.websocket.manager import manager
        await manager.broadcast("SENSOR_UPDATE", doc)
        await manager.broadcast("CLOUD_AI_RESULT", cloud_result)
        
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
