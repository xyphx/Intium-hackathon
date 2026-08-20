from fastapi import APIRouter
from app.database import get_db

router = APIRouter(prefix="/api/events", tags=["Events"])

@router.get("", response_model=dict)
async def get_events():
    db = get_db()
    cursor = db.events.find({}, {"_id": 0}).sort("timestamp", -1)
    events = await cursor.to_list(length=100)
    return {"success": True, "data": events}

@router.get("/{event_id}", response_model=dict)
async def get_event(event_id: str):
    db = get_db()
    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        return {"success": False, "message": "Event not found"}
    return {"success": True, "data": event}
