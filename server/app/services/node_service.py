from datetime import datetime, timezone
from fastapi import HTTPException
from app.database import get_db
from app.schemas.node import NodeCreate, NodeHeartbeat

class NodeService:
    @staticmethod
    async def get_node(node_id: str):
        db = get_db()
        node = await db.nodes.find_one({"node_id": node_id}, {"_id": 0})
        if not node:
            raise HTTPException(status_code=404, detail="Node not found")
        return node

    @staticmethod
    async def get_all_nodes():
        db = get_db()
        cursor = db.nodes.find({}, {"_id": 0})
        return await cursor.to_list(length=100)

    @staticmethod
    async def register_node(node_data: NodeCreate):
        db = get_db()
        
        existing_node = await db.nodes.find_one({"node_id": node_data.node_id})
        if existing_node:
            raise HTTPException(status_code=400, detail="Node already registered")
        
        now = datetime.now(timezone.utc).isoformat()
        node_doc = node_data.model_dump()
        node_doc.update({
            "status": "online",
            "battery": None,
            "last_seen": now,
            "created_at": now
        })
        
        await db.nodes.insert_one(node_doc)
        
        node_doc.pop('_id', None)
        
        from app.websocket.manager import manager
        await manager.broadcast("NODE_ONLINE", node_doc)
        
        return {"success": True, "data": node_doc, "message": "Node registered successfully"}

    @staticmethod
    async def handle_heartbeat(node_id: str, heartbeat: NodeHeartbeat):
        db = get_db()
        now = datetime.now(timezone.utc).isoformat()
        
        update_data = {
            "status": "online",
            "last_seen": now
        }
        
        if heartbeat.battery is not None:
            update_data["battery"] = heartbeat.battery
            
        result = await db.nodes.update_one(
            {"node_id": node_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Node not found")
            
        from app.websocket.manager import manager
        await manager.broadcast("NODE_STATUS_CHANGED", {"node_id": node_id, **update_data})
            
        return {"success": True, "message": "Heartbeat processed"}
