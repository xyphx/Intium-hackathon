from fastapi import APIRouter, Path, Query
from typing import Optional
from app.schemas.sensor import SensorDataCreate
from app.services.sensor_service import SensorService

router = APIRouter(prefix="/api/sensor-data", tags=["Sensors"])

@router.post("")
async def receive_sensor_data(data: SensorDataCreate):
    print(f"[SENSOR DATA RECEIVED] Node: {data.node_id} | Payload: {data.model_dump()}")
    return await SensorService.process_sensor_data(data)

@router.get("")
async def get_all_sensor_data(limit: int = Query(50, le=500)):
    readings = await SensorService.get_sensor_data(limit=limit)
    return {"success": True, "data": readings}

@router.get("/{node_id}")
async def get_node_sensor_data(node_id: str = Path(...), limit: int = Query(50, le=500)):
    readings = await SensorService.get_sensor_data(node_id=node_id, limit=limit)
    return {"success": True, "data": readings}
