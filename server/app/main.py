from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import connect_to_mongo, close_mongo_connection

@asynccontextmanager
async def lifespan(app: FastAPI):
    connect_to_mongo()
    yield
    close_mongo_connection()

app = FastAPI(
    title="XyphX Sentinel API",
    description="Backend API for XyphX intelligent monitoring system",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow React app development server
origins = [
    "http://localhost:5173", # Vite default
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routes import nodes, sensors, events, alerts
from app.websocket.manager import manager
from fastapi import WebSocket, WebSocketDisconnect

@app.get("/api/health")
async def health_check():
    return {"success": True, "message": "API is running"}

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

app.include_router(nodes.router)
app.include_router(sensors.router)
app.include_router(events.router)
app.include_router(alerts.router)
