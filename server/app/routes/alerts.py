from fastapi import APIRouter
from app.services.alert_service import AlertService

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("", response_model=dict)
async def get_alerts():
    alerts = await AlertService.get_alerts()
    return {"success": True, "data": alerts}

@router.patch("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    return await AlertService.acknowledge_alert(alert_id)
