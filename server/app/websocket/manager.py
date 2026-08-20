from fastapi import WebSocket
import json
from typing import List

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message_type: str, data: dict):
        message = {
            "type": message_type,
            "data": data
        }
        text_message = json.dumps(message, default=str)
        for connection in self.active_connections:
            try:
                await connection.send_text(text_message)
            except:
                pass

manager = ConnectionManager()
