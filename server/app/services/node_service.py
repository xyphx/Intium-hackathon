from datetime import datetime, timezone
from fastapi import HTTPException
from app.database import get_db
from app.schemas.node import NodeCreate, NodeHeartbeat

import urllib.request
import json
import random

BASE_LAT_LON = None

def get_base_location():
    try:
        req = urllib.request.Request('http://ip-api.com/json', headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=2) as response:
            res = json.loads(response.read().decode())
            if res.get('status') == 'success':
                return res['lat'], res['lon']
    except:
        pass
    return 8.5241, 76.9366

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
        global BASE_LAT_LON
        db = get_db()
        
        existing_node = await db.nodes.find_one({"node_id": node_data.node_id})
        if existing_node:
            raise HTTPException(status_code=400, detail="Node already registered")
        
        now = datetime.now(timezone.utc).isoformat()
        node_doc = node_data.model_dump()
        
        # Auto-assign location if missing (~50km random radius)
        if not node_doc.get("location"):
            if BASE_LAT_LON is None:
                BASE_LAT_LON = get_base_location()
            lat = BASE_LAT_LON[0] + random.uniform(-0.45, 0.45)
            lon = BASE_LAT_LON[1] + random.uniform(-0.45, 0.45)
            node_doc["location"] = {"latitude": lat, "longitude": lon}

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
