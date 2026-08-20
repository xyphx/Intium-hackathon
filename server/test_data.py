import asyncio
import httpx
import json

BASE_URL = "http://localhost:8001/api"

async def populate():
    async with httpx.AsyncClient() as client:
        print("Registering nodes...")
        n1 = await client.post(f"{BASE_URL}/nodes/register", json={
            "node_id": "NODE-01",
            "name": "North Gate Sensor",
            "capabilities": ["temperature", "smoke", "motion"],
            "location": {"latitude": 8.5241, "longitude": 76.9366}
        })
        print(n1.json())
        
        n2 = await client.post(f"{BASE_URL}/nodes/register", json={
            "node_id": "NODE-02",
            "name": "South Wing Cam",
            "capabilities": ["temperature", "motion", "camera"],
            "location": {"latitude": 8.5300, "longitude": 76.9400}
        })
        print(n2.json())
        
        print("Sending normal telemetry (NODE-01)...")
        r1 = await client.post(f"{BASE_URL}/sensor-data", json={
            "node_id": "NODE-01",
            "temperature": 25.5,
            "smoke": 5.0,
            "motion": False,
            "battery": 95
        })
        print(r1.json())
        
        await asyncio.sleep(2)
        
        print("Sending CRITICAL telemetry (NODE-01)...")
        r2 = await client.post(f"{BASE_URL}/sensor-data", json={
            "node_id": "NODE-01",
            "temperature": 85.0,
            "smoke": 75.0,
            "motion": True,
            "battery": 94
        })
        print(r2.json())
        print("Done populating test data.")

if __name__ == "__main__":
    asyncio.run(populate())
