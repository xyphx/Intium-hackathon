import asyncio
import httpx

BASE_URL = "http://localhost:8002/api"

async def populate():
    async with httpx.AsyncClient() as client:
        print("Registering nodes...")
        await client.post(f"{BASE_URL}/nodes/register", json={
            "node_id": "NODE-01", "name": "North Gate Sensor", "capabilities": ["temperature", "smoke"]
        })
        await client.post(f"{BASE_URL}/nodes/register", json={
            "node_id": "NODE-02", "name": "South Wing Cam", "capabilities": ["temperature", "smoke"]
        })
        await client.post(f"{BASE_URL}/nodes/register", json={
            "node_id": "NODE-03", "name": "East Corridor", "capabilities": ["temperature"]
        })
        
        print("\n--- Scenario A: Normal ---")
        await client.post(f"{BASE_URL}/sensor-data", json={
            "node_id": "NODE-01", "temperature": 32, "smoke": 2, "motion": False
        })
        
        print("\n--- Scenario B: Suspicious ---")
        await client.post(f"{BASE_URL}/sensor-data", json={
            "node_id": "NODE-02", "temperature": 61, "smoke": 40,
            "edge_event": "possible_fire", "edge_confidence": 0.65
        })
        
        print("\n--- Scenario C: Confirmed Fire (Multi-node Fusion) ---")
        # Node 1 detects high temp, smoke and edge fire
        await client.post(f"{BASE_URL}/sensor-data", json={
            "node_id": "NODE-01", "temperature": 78, "smoke": 86,
            "edge_event": "fire", "edge_confidence": 0.89
        })
        # Node 2 confirms smoke
        await client.post(f"{BASE_URL}/sensor-data", json={
            "node_id": "NODE-02", "smoke": 80
        })
        # Node 3 confirms temp rising
        await client.post(f"{BASE_URL}/sensor-data", json={
            "node_id": "NODE-03", "temperature": 65
        })
        
        print("\n--- Scenario D: Sensor Anomaly ---")
        # Normal temps for Node 3
        for t in [30, 31, 32, 30]:
            await client.post(f"{BASE_URL}/sensor-data", json={"node_id": "NODE-03", "temperature": t})
            await asyncio.sleep(0.1)
        # Sudden spike
        await client.post(f"{BASE_URL}/sensor-data", json={"node_id": "NODE-03", "temperature": 95})

        print("\nDone populating test data.")

if __name__ == "__main__":
    asyncio.run(populate())
