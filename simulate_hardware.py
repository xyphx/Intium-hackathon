import requests
import time
import random
import json

BASE_URL = "http://localhost:8002/api"

def get_base_location():
    try:
        print("Fetching IP-based location...")
        res = requests.get('http://ip-api.com/json', timeout=5).json()
        if res.get('status') == 'success':
            return res['lat'], res['lon']
        return 8.5241, 76.9366
    except Exception as e:
        print(f"Failed to fetch IP location: {e}. Defaulting to Trivandrum.")
        return 8.5241, 76.9366

BASE_LAT, BASE_LON = get_base_location()

NODES = [
    {
        "node_id": "NODE_ALPHA_001",
        "name": "Forest Perimeter Sensor",
        "capabilities": ["temperature", "smoke", "humidity"],
        "location": {"latitude": BASE_LAT + random.uniform(-0.03, 0.03), "longitude": BASE_LON + random.uniform(-0.03, 0.03)},
        "status": "online"
    },
    {
        "node_id": "NODE_BETA_002",
        "name": "Industrial Gas Monitor",
        "capabilities": ["gas", "temperature", "humidity"],
        "location": {"latitude": BASE_LAT + random.uniform(-0.03, 0.03), "longitude": BASE_LON + random.uniform(-0.03, 0.03)},
        "status": "online"
    },
    {
        "node_id": "NODE_GAMMA_003",
        "name": "Intrusion Detection",
        "capabilities": ["motion", "distance", "battery"],
        "location": {"latitude": BASE_LAT + random.uniform(-0.03, 0.03), "longitude": BASE_LON + random.uniform(-0.03, 0.03)},
        "status": "online"
    }
]

def register_nodes():
    print("Registering nodes...")
    for node in NODES:
        try:
            res = requests.post(f"{BASE_URL}/nodes/register", json=node)
            if res.status_code == 200:
                print(f"Registered {node['node_id']} successfully!")
            else:
                print(f"Failed to register {node['node_id']}: {res.text}")
        except Exception as e:
            print(f"Error registering {node['node_id']}: {e}")

def simulate_telemetry():
    print("Starting telemetry simulation... (Press CTRL+C to stop)")
    try:
        while True:
            for node in NODES:
                # Generate random baseline data
                payload = {
                    "node_id": node["node_id"],
                    "temperature": round(random.uniform(25.0, 35.0), 2),
                    "smoke": round(random.uniform(0.0, 0.2), 2),
                    "humidity": round(random.uniform(50.0, 70.0), 2),
                    "gas": round(random.uniform(0.0, 0.5), 2),
                    "motion": random.choice([True, False, False, False]),
                    "distance": round(random.uniform(1.0, 10.0), 2),
                    "battery": random.randint(70, 100)
                }

                # Introduce an artificial anomaly for NODE_ALPHA_001 to trigger the ML risk engine
                if node["node_id"] == "NODE_ALPHA_001" and random.random() > 0.8:
                    print(f"INJECTING ANOMALY FOR {node['node_id']}!")
                    payload["temperature"] = round(random.uniform(60.0, 90.0), 2)
                    payload["smoke"] = round(random.uniform(5.0, 10.0), 2)

                res = requests.post(f"{BASE_URL}/sensor-data", json=payload)
                if res.status_code == 200:
                    print(f"Sent data for {node['node_id']}")
                else:
                    print(f"Error sending data: {res.text}")
                
            time.sleep(3) # Wait 3 seconds before next batch
    except KeyboardInterrupt:
        print("\nSimulation stopped.")

if __name__ == "__main__":
    register_nodes()
    time.sleep(1)
    simulate_telemetry()
