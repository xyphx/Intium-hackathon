from fastapi import APIRouter, Path
from typing import List
from app.schemas.node import NodeCreate, NodeHeartbeat, NodeResponse
from app.services.node_service import NodeService

router = APIRouter(prefix="/api/nodes", tags=["Nodes"])

@router.get("", response_model=dict)
async def get_nodes():
    nodes = await NodeService.get_all_nodes()
    return {"success": True, "data": nodes}

@router.post("/register")
async def register_node(node: NodeCreate):
    print(f"[NODE REGISTRATION] Node: {node.node_id} | Payload: {node.model_dump()}")
    return await NodeService.register_node(node)

@router.get("/{node_id}", response_model=dict)
async def get_node(node_id: str = Path(...)):
    node = await NodeService.get_node(node_id)
    return {"success": True, "data": node}

@router.post("/{node_id}/heartbeat")
async def handle_heartbeat(heartbeat: NodeHeartbeat, node_id: str = Path(...)):
    if heartbeat.node_id != node_id:
        heartbeat.node_id = node_id
    return await NodeService.handle_heartbeat(node_id, heartbeat)
