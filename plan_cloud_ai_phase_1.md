# XyphX — Cloud AI + Backend + Real-Time Dashboard

You are working on the XyphX INTIUM hackathon project.

Your responsibility is the complete SOFTWARE/CLOUD side of the system:

- Cloud AI
- AI data processing
- Sensor fusion
- Multi-node intelligence
- Risk analysis
- Anomaly detection
- Historical analysis
- FastAPI backend
- MongoDB
- WebSockets
- React dashboard
- Real-time visualization
- Edge-to-cloud communication contract

## CRITICAL RULE — NEVER TOUCH FIRMWARE

The `firmware/` directory belongs to another team member.

NEVER:

- modify files inside `firmware/`
- create files inside `firmware/`
- delete files inside `firmware/`
- rename files inside `firmware/`
- refactor firmware
- change PlatformIO configuration
- change ESP32 code
- change sensor code
- change LoRa code
- change edge AI code

Treat the firmware and Edge AI as an EXTERNAL DATA PRODUCER.

If a feature requires firmware support, DO NOT modify firmware.

Instead:

1. Define the required data/message contract.
2. Make the backend capable of receiving it.
3. Document what the firmware team would need to send.
4. Continue developing the cloud side independently.

---

# 1. CURRENT PROJECT STRUCTURE

The repository currently looks like:

```text
Intium-hackathon/
│
├── ai/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── card.tsx
│   │   │   │   └── map.tsx
│   │   │   ├── AlertPanel.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── LiveMap.tsx
│   │   │   └── StatCard.tsx
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   ├── Alerts.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Events.tsx
│   │   │   └── Nodes.tsx
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── index.ts
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── ...
│
├── firmware/
│   └── node1/
│       ├── include/
│       ├── lib/
│       ├── test/
│       └── platformio.ini
│
├── server/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── alerts.py
│   │   │   ├── events.py
│   │   │   ├── nodes.py
│   │   │   └── sensors.py
│   │   ├── schemas/
│   │   │   ├── event.py
│   │   │   ├── node.py
│   │   │   └── sensor.py
│   │   ├── services/
│   │   │   ├── alert_service.py
│   │   │   ├── node_service.py
│   │   │   ├── risk_service.py
│   │   │   └── sensor_service.py
│   │   ├── websocket/
│   │   │   └── manager.py
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── test_data.py
│
├── README.md
├── docker-compose.yml
└── plan_client_server.md
```

Before changing anything:

- inspect the existing implementation
- understand what already works
- preserve useful existing functionality
- extend rather than unnecessarily rewrite
- do not break existing APIs
- do not touch `firmware/`

---

# 2. YOUR ROLE IN THE PROJECT

The project has two intelligence layers.

## EDGE AI — FRIEND

The edge device performs local, low-latency intelligence.

Conceptually:

```text
Sensors / Camera
      ↓
Edge preprocessing
      ↓
Edge AI
      ↓
Local detection
      ↓
Confidence
      ↓
LoRa
```

The edge may provide information such as:

```text
temperature
smoke
motion
distance
battery
camera inference
event type
edge confidence
model version
timestamp
node ID
network information
```

The exact fields depend on the firmware.

DO NOT assume every field exists.

---

# 3. YOUR ROLE — CLOUD AI

The Cloud AI must NOT simply repeat the Edge AI.

The fundamental design principle is:

> EDGE AI = "What is happening at this node right now?"

> CLOUD AI = "What does all available information mean across the entire system?"

Cloud AI should perform:

- multi-node sensor fusion
- edge-result fusion
- historical analysis
- trend analysis
- anomaly detection
- cross-node verification
- global risk assessment
- event correlation
- confidence refinement
- incident intelligence
- system-wide decision support

---

# 4. EDGE → CLOUD → DASHBOARD ARCHITECTURE

Implement this logical flow:

```text
                  EDGE
        ┌─────────────────────┐
        │ ESP32 / ESP32-CAM   │
        │                     │
        │ Sensors             │
        │ Camera              │
        │ Edge AI             │
        └──────────┬──────────┘
                   │
                  LoRa
                   │
                   ▼
                GATEWAY
                   │
                Internet
                   │
                   ▼
        ┌─────────────────────┐
        │       FASTAPI       │
        │    Data Ingestion   │
        └──────────┬──────────┘
                   │
        ┌──────────┼────────────┐
        │          │            │
        ▼          ▼            ▼
    MongoDB    Cloud AI      Event Engine
        │          │            │
        │          │            │
        └──────────┼────────────┘
                   │
             Risk / Decision
                   │
                   ▼
              WebSocket
                   │
                   ▼
        ┌─────────────────────┐
        │        REACT        │
        │  Live Dashboard     │
        └─────────────────────┘
```

Optional future feedback:

```text
Cloud AI
   ↓
Adaptive monitoring command
   ↓
Gateway
   ↓
Edge
```

However, do not modify firmware to support this.

Only define the contract.

---

# 5. CREATE THE CLOUD AI LAYER

The currently existing `ai/` directory should become the dedicated Cloud AI layer.

Recommended structure:

```text
ai/
├── __init__.py
├── config.py
│
├── schemas/
│   ├── telemetry.py
│   ├── inference.py
│   └── prediction.py
│
├── preprocessing/
│   ├── normalize.py
│   └── validation.py
│
├── models/
│   ├── anomaly.py
│   ├── classifier.py
│   └── predictor.py
│
├── services/
│   ├── inference_service.py
│   ├── sensor_fusion.py
│   ├── trend_analysis.py
│   ├── anomaly_detection.py
│   ├── confidence_service.py
│   └── decision_engine.py
│
├── risk/
│   ├── risk_engine.py
│   └── rules.py
│
└── README.md
```

The exact structure can be simplified if needed.

Do not over-engineer the AI directory.

---

# 6. CLOUD AI INPUT

The cloud should be capable of receiving a payload similar to:

```json
{
  "node_id": "NODE-01",
  "timestamp": "2026-08-20T11:30:00Z",

  "sensors": {
    "temperature": 78.4,
    "smoke": 86,
    "motion": true,
    "humidity": null,
    "distance": null
  },

  "edge_ai": {
    "event": "possible_fire",
    "confidence": 0.89,
    "model_version": "edge-v1"
  },

  "network": {
    "rssi": -71,
    "snr": 8.2
  },

  "battery": 82
}
```

This is an EXAMPLE contract.

Do not assume the firmware already sends exactly this structure.

The backend must be flexible enough to adapt to the actual firmware payload.

---

# 7. RAW TELEMETRY VS AI DATA

Maintain a clear distinction.

## Raw telemetry

Data directly received from the edge:

```text
temperature
smoke
motion
humidity
distance
battery
timestamp
```

## Edge AI result

Information produced by the friend's AI:

```text
event
confidence
model_version
```

## Cloud AI result

Information produced by your system:

```text
cloud_prediction
cloud_confidence
risk_score
risk_level
anomaly_score
trend
confirmation_status
```

Never mix these concepts unnecessarily.

---

# 8. SENSOR FUSION

Create a Cloud AI sensor fusion layer.

It should combine available signals.

Example:

```text
Temperature = 78°C
Smoke = 86%
Motion = TRUE
Edge fire confidence = 0.89
```

Cloud AI should combine these.

The output could be:

```json
{
  "classification": "fire",
  "confidence": 0.94
}
```

Do not claim that this is a trained ML prediction if it is actually a rule-based fusion algorithm.

Clearly label:

- rule-based
- ML-based
- statistical

depending on the implementation.

---

# 9. MULTI-NODE SENSOR FUSION

This is one of the most important Cloud AI features.

Example:

```text
NODE-01
Smoke HIGH
Edge AI: Fire 82%

NODE-02
Smoke HIGH
Edge AI: Fire 79%

NODE-03
Temperature HIGH
```

The cloud should recognize:

```text
Multiple nearby nodes report correlated evidence.
```

Then increase confidence.

Example:

```text
Node 01 evidence
+
Node 02 confirmation
+
Node 03 temperature trend
=
High-confidence incident
```

This is a major difference between Edge AI and Cloud AI.

---

# 10. HISTORICAL ANALYSIS

MongoDB stores historical sensor readings and events.

Use history to analyze:

```text
temperature trend
smoke trend
motion frequency
battery trend
risk trend
event frequency
node behavior
```

Example:

```text
10:00 → 35°C
10:05 → 38°C
10:10 → 43°C
10:15 → 51°C
10:20 → 63°C
10:25 → 77°C
```

Cloud AI should identify:

```text
Rapidly increasing temperature trend.
```

The edge may only know:

```text
Current temperature = 77°C
```

The cloud knows the history.

---

# 11. TREND ANALYSIS

Create a trend-analysis service.

It should calculate things such as:

```text
increasing
decreasing
stable
rapidly increasing
rapidly decreasing
```

For relevant numerical sensor values.

Example:

```text
Temperature:
35 → 38 → 43 → 51 → 63 → 77

Trend:
RAPIDLY_INCREASING
```

This trend becomes an input to the risk engine.

---

# 12. ANOMALY DETECTION

Implement cloud-side anomaly detection.

Start simple and explainable.

Detect:

- sudden spikes
- sudden drops
- impossible values
- sensor stuck values
- missing readings
- unusual reading frequency
- abnormal behavior compared with historical baseline

Example:

```text
Normal:
30–40°C

Current:
91°C

Result:
ANOMALY
```

The anomaly system should produce:

```json
{
  "anomaly": true,
  "anomaly_score": 0.91,
  "reason": "Temperature significantly exceeds historical baseline"
}
```

If a real ML anomaly model is implemented, keep it isolated so it can be replaced or retrained later.

---

# 13. EDGE + CLOUD CONFIDENCE FUSION

Do not blindly trust edge confidence.

Example:

```text
Edge AI:
Fire confidence = 0.82

Cloud:
Temperature trend = strong
Smoke = high
Neighbor confirmation = yes
Historical pattern = abnormal
```

Cloud should produce a refined confidence:

```text
Cloud confidence = 0.95
```

The exact formula should be explainable and configurable.

Do not simply average everything.

---

# 14. RISK ENGINE

The existing:

```text
server/app/services/risk_service.py
```

should become the central system-level risk engine.

It should use inputs such as:

```text
raw sensor evidence
edge confidence
cloud AI confidence
historical trend
anomaly score
neighbor confirmation
event frequency
node health
```

Produce:

```text
risk_score
risk_level
reasoning/evidence
```

Risk levels:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Example:

```json
{
  "risk_score": 94,
  "risk_level": "CRITICAL",
  "evidence": [
    "High smoke level",
    "Rapid temperature increase",
    "Edge AI fire confidence 89%",
    "Neighbor node confirmation"
  ]
}
```

This explanation is important for the dashboard and hackathon presentation.

---

# 15. EVENT CORRELATION

The cloud should group related readings into an incident.

Example:

```text
11:30:01
Node 01 detects smoke

11:30:03
Node 01 temperature increases

11:30:05
Node 02 detects smoke

11:30:07
Node 03 confirms abnormal temperature
```

Instead of four unrelated events, the cloud can correlate them into:

```text
INCIDENT-001
Possible Fire
```

This is cloud-level intelligence.

---

# 16. INCIDENT LIFECYCLE

Support:

```text
DETECTED
    ↓
ANALYZING
    ↓
CORRELATED
    ↓
CONFIRMED
    ↓
ALERTED
    ↓
ACKNOWLEDGED
    ↓
RESOLVED
```

Not every event needs every state.

---

# 17. CLOUD AI DECISION ENGINE

Create a decision engine.

Inputs:

```text
cloud confidence
risk score
anomaly
neighbor confirmation
historical trend
event severity
```

Output:

```text
NORMAL
MONITOR
WARNING
HIGH_RISK
CRITICAL
```

Example:

```text
Edge AI:
Possible Fire 82%

Cloud:
Strong temperature trend

Neighbor:
Confirmed

Cloud Decision:
CRITICAL
```

---

# 18. OPTIONAL CLOUD → EDGE COLLABORATION

Design an optional command contract.

Do NOT implement this inside firmware.

The cloud may generate a command like:

```json
{
  "node_id": "NODE-01",
  "command": "increase_sampling",
  "parameters": {
    "interval_seconds": 1,
    "duration_seconds": 30
  }
}
```

Other possible commands:

```text
increase_sampling
capture_additional_image
request_status
change_monitoring_mode
```

This represents adaptive edge-cloud collaboration.

The backend should be capable of generating/storing such commands.

The firmware developer can later decide whether and how to support them.

---

# 19. WEBSOCKET REAL-TIME SYSTEM

Use the existing:

```text
server/app/websocket/manager.py
```

as the WebSocket connection manager.

WebSocket endpoint:

```text
/ws/live
```

Support multiple connected clients.

Message format:

```json
{
  "type": "RISK_UPDATED",
  "timestamp": "...",
  "data": {}
}
```

Message types should include:

```text
NODE_ONLINE
NODE_OFFLINE
NODE_STATUS_CHANGED

SENSOR_UPDATE

EDGE_AI_RESULT

CLOUD_AI_RESULT

RISK_UPDATED

NEW_EVENT
EVENT_UPDATED
EVENT_CONFIRMED

NEW_ALERT
ALERT_ACKNOWLEDGED
ALERT_RESOLVED

ANOMALY_DETECTED

NETWORK_UPDATE

SYSTEM_STATUS
```

---

# 20. REAL-TIME AI FLOW

The most important real-time flow is:

```text
Edge AI
   ↓
Gateway
   ↓
FastAPI
   ↓
Validate
   ↓
Store raw data
   ↓
Cloud AI
   ↓
Sensor Fusion
   ↓
Historical Analysis
   ↓
Anomaly Detection
   ↓
Risk Engine
   ↓
Event/Incident Engine
   ↓
Alert Engine
   ↓
MongoDB
   ↓
WebSocket
   ↓
React
```

React must update without page refresh.

---

# 21. REACT CLOUD AI VISUALIZATION

The existing client already has:

```text
api/client.ts
hooks/useWebSocket.ts
LiveMap.tsx
AlertPanel.tsx
StatCard.tsx
Dashboard.tsx
Alerts.tsx
Events.tsx
Nodes.tsx
```

Preserve and extend these components.

Do not unnecessarily rewrite the entire frontend.

---

# 22. DASHBOARD AI SECTION

Add a dedicated AI intelligence area.

Show:

```text
EDGE AI
Current Edge Detection
Edge Confidence
Model Version

CLOUD AI
Cloud Classification
Cloud Confidence
Risk Score
Risk Level

FUSION
Nodes Confirming
Evidence Count
Anomaly Score
Trend
```

Example:

```text
┌───────────────────────────────────────────┐
│ AI INTELLIGENCE                           │
├───────────────────────────────────────────┤
│                                           │
│ EDGE AI                                   │
│ Possible Fire             89%             │
│                                           │
│ CLOUD AI                                  │
│ Fire                      96%             │
│                                           │
│ SENSOR FUSION                             │
│ 3 nodes confirmed                         │
│                                           │
│ TREND                                     │
│ Temperature rapidly increasing            │
│                                           │
│ RISK                                      │
│ 🔴 CRITICAL — 94/100                      │
└───────────────────────────────────────────┘
```

---

# 23. EXPLAINABLE AI

Do not only show:

```text
Risk = 94
```

Show WHY.

Example:

```text
CRITICAL RISK

Reasons:

✓ High smoke level
✓ Rapid temperature increase
✓ Edge AI confidence 89%
✓ Neighbor confirmation
✓ Historical anomaly detected
```

This makes the system easier to understand and defend during judging.

---

# 24. NODE DETAILS

When selecting a node, show three sections.

## Raw telemetry

```text
Temperature
Smoke
Motion
Battery
```

## Edge AI

```text
Detection
Confidence
Model Version
```

## Cloud AI

```text
Classification
Confidence
Risk
Anomaly
Trend
Confirmation
```

This clearly demonstrates Edge vs Cloud intelligence.

---

# 25. EVENT DETAIL PAGE

Create an event detail view.

Example:

```text
INCIDENT EVT-001

Type:
Fire

Primary Node:
NODE-01

Edge AI:
89%

Cloud AI:
96%

Risk:
94 / CRITICAL

Confirmed By:
NODE-02
NODE-03

Trend:
Rapid temperature increase

Anomaly:
Detected

Status:
CONFIRMED
```

Then show the timeline:

```text
11:30:01
Edge detection

11:30:03
Cloud received data

11:30:05
Historical anomaly detected

11:30:07
Neighbor confirmation

11:30:08
Risk → CRITICAL

11:30:09
Alert generated
```

---

# 26. MAP INTELLIGENCE

The existing `LiveMap.tsx` should show:

```text
node location
node status
risk level
active incidents
gateway
```

Use OpenStreetMap.

Node colors:

```text
GREEN  = healthy
YELLOW = warning
ORANGE = high risk
RED    = critical
BLACK/GRAY = offline
```

Clicking a node should open its details.

If multiple nearby nodes participate in an incident, visually show the relationship where practical.

---

# 27. NODE NETWORK VIEW

Add a network view if feasible.

Example:

```text
NODE-01 🟢
     │
     │ LoRa
     │
NODE-02 🟡
     │
     │
GATEWAY 🟢
```

Show:

- node status
- gateway
- links
- signal information if available
- active incidents

Do not invent RSSI/SNR if firmware does not provide it.

---

# 28. MONGODB DATA MODEL

Use separate collections for:

```text
nodes
sensor_readings
edge_ai_results
cloud_ai_results
events
incidents
alerts
network_logs
ai_decisions
```

You may simplify if some collections are unnecessary.

Important distinction:

### `sensor_readings`

Raw data.

### `edge_ai_results`

Friend's AI output.

### `cloud_ai_results`

Your AI output.

### `events`

Individual meaningful events.

### `incidents`

Correlated multi-event situations.

### `alerts`

User-facing notifications.

### `ai_decisions`

Final cloud decisions and reasoning.

---

# 29. EXAMPLE CLOUD AI RESULT

Store something similar to:

```json
{
  "event_id": "EVT-001",

  "node_id": "NODE-01",

  "edge_ai": {
    "classification": "possible_fire",
    "confidence": 0.89
  },

  "cloud_ai": {
    "classification": "fire",
    "confidence": 0.96
  },

  "fusion": {
    "nodes_confirmed": 3,
    "evidence_count": 5
  },

  "trend": {
    "temperature": "rapidly_increasing",
    "smoke": "increasing"
  },

  "anomaly": {
    "detected": true,
    "score": 0.91
  },

  "risk": {
    "score": 94,
    "level": "critical"
  }
}
```

This should be flexible.

---

# 30. CLOUD AI MODEL STRATEGY

Do not pretend that a trained AI model exists if there is no training dataset.

Implement the AI architecture in stages.

## Stage 1

Explainable rule-based sensor fusion.

## Stage 2

Statistical anomaly detection.

## Stage 3

ML model using collected sensor data.

## Stage 4

More advanced model if sufficient data exists.

The architecture must allow Stage 1 to be replaced by Stage 3/4 without redesigning the entire backend.

---

# 31. AI MODEL INTERFACE

Create an abstraction such as:

```python
class AIModel:
    def predict(self, features):
        ...
```

Then implementations can later include:

```text
RuleBasedModel
AnomalyModel
MLClassifier
```

The backend should not care which model implementation is being used.

---

# 32. AI FEATURES TO PRIORITIZE

Prioritize these:

### HIGH PRIORITY

1. Edge AI result ingestion
2. Cloud sensor fusion
3. Multi-node confirmation
4. Cloud risk score
5. Historical trend analysis
6. Anomaly detection
7. Event correlation
8. Real-time WebSocket updates
9. Explainable AI result
10. React AI visualization

### MEDIUM PRIORITY

11. Network health analysis
12. Node health prediction
13. Adaptive monitoring commands
14. Advanced ML model

### LOW PRIORITY

15. Complex deep-learning pipelines
16. Large language model integration
17. Overly complex prediction systems

Do not sacrifice reliability for flashy AI.

---

# 33. TEST WITHOUT FIRMWARE

Create test/mock telemetry in:

```text
server/test_data.py
```

or another software-only test location.

Do NOT put anything in `firmware/`.

Create scenarios such as:

## Scenario A — Normal

```text
Temperature: 32
Smoke: 2
Motion: false
Edge AI: none
```

Expected:

```text
Risk: LOW
```

## Scenario B — Suspicious

```text
Temperature: 61
Smoke: 40
Edge AI: possible_fire 0.65
```

Expected:

```text
Risk: MEDIUM/HIGH
```

## Scenario C — Confirmed fire

```text
NODE-01
Temperature: 78
Smoke: 86
Edge confidence: 0.89

NODE-02
Smoke: 80

NODE-03
Temperature rising
```

Expected:

```text
Cloud classification: fire
Cloud confidence: high
Risk: CRITICAL
Alert: CREATED
```

## Scenario D — Sensor anomaly

```text
Normal temperature: 30–40
Current: 95
```

Expected:

```text
Anomaly detected
```

---

# 34. DEVELOPMENT ORDER

Follow this order.

## Phase 1 — Inspect current code

Inspect:

```text
ai/
server/
client/
plan_client_server.md
```

Do not touch firmware.

---

## Phase 2 — Stabilize telemetry contract

Define:

```text
raw sensor payload
edge AI payload
cloud AI result
WebSocket message
```

---

## Phase 3 — Cloud AI foundation

Create:

```text
ai/
```

with:

```text
preprocessing
sensor fusion
trend analysis
anomaly detection
risk
decision engine
```

---

## Phase 4 — Connect AI to FastAPI

FastAPI should call the AI layer.

Do not duplicate AI logic inside route files.

Preferred:

```text
route
  ↓
service
  ↓
AI service
  ↓
result
```

---

## Phase 5 — MongoDB

Store:

```text
raw telemetry
edge AI
cloud AI
events
incidents
alerts
```

---

## Phase 6 — WebSocket

Broadcast:

```text
edge AI result
cloud AI result
risk update
event
alert
node status
```

---

## Phase 7 — React AI UI

Add:

```text
AI Intelligence
Risk
Confidence
Evidence
Trend
Anomaly
```

---

## Phase 8 — End-to-end testing

Test:

```text
Mock Edge Data
      ↓
FastAPI
      ↓
Cloud AI
      ↓
MongoDB
      ↓
WebSocket
      ↓
React
```

---

# 35. DO NOT BREAK EXISTING FEATURES

The current frontend already has:

```text
Dashboard
Alerts
Events
Nodes
LiveMap
AlertPanel
WebSocket hook
API client
```

The current backend already has:

```text
alerts
events
nodes
sensors
risk service
node service
sensor service
WebSocket manager
```

Extend these.

Do not remove working functionality unless absolutely necessary.

If existing code conflicts with the new architecture:

1. understand the existing behavior
2. refactor carefully
3. preserve API compatibility where possible
4. test after changes

---

# 36. IMPORTANT: DO NOT OVERLOAD THE EDGE

Cloud AI should handle computationally expensive operations.

Do NOT attempt to move these into firmware:

```text
large ML models
historical analysis
multi-node fusion
database queries
global risk analysis
complex anomaly analysis
dashboard processing
```

These belong to the cloud.

---

# 37. IMPORTANT: DO NOT SEND EVERYTHING TO CLOUD

The edge should perform lightweight filtering/detection.

The conceptual goal is:

```text
Raw sensor stream
      ↓
Edge filtering
      ↓
Important information
      ↓
Cloud
```

This reduces:

- bandwidth
- latency
- storage
- unnecessary network traffic

Again, implementation of edge filtering is the friend's responsibility.

Your backend should simply be capable of receiving the resulting data.

---

# 38. EDGE-CLOUD COLLABORATION PRINCIPLE

The final architecture should demonstrate:

```text
EDGE:
Fast local perception

        ↓

CLOUD:
Global intelligence

        ↓

EDGE:
Optional adaptive response
```

This is much stronger than saying:

```text
ESP32 AI + Cloud AI
```

without interaction.

---

# 39. PRESENTATION STORY

The software should make it possible to explain:

> "Each edge node performs lightweight local intelligence for low-latency detection. Instead of sending all raw information to the cloud, the edge provides relevant telemetry and inference results. The cloud aggregates information from multiple nodes, combines edge confidence with sensor data and historical trends, detects anomalies, correlates events, and computes a global risk score. The result is streamed through WebSockets to the live dashboard. The cloud can also generate adaptive monitoring commands for edge nodes when required."

That should be the core technical explanation.

---

# 40. FINAL ARCHITECTURE

The final software architecture should look conceptually like:

```text
                   EDGE AI
                FRIEND'S SIDE
                     │
       ┌─────────────┼─────────────┐
       │             │             │
     Node 1        Node 2        Node 3
       │             │             │
       └─────────────┼─────────────┘
                     │
                    LoRa
                     │
                  Gateway
                     │
                  Internet
                     │
                     ▼
              ┌─────────────┐
              │   FastAPI   │
              │ Data Layer  │
              └──────┬──────┘
                     │
          ┌──────────┼───────────┐
          ▼          ▼           ▼
       MongoDB    Cloud AI    WebSocket
                     │           │
             ┌───────┼───────┐   │
             ▼       ▼       ▼   │
           Fusion  Anomaly  Trend │
             │       │       │   │
             └───────┼───────┘   │
                     ▼           │
                 Risk Engine     │
                     │           │
                 Decision        │
                     │           │
                     └─────┬─────┘
                           │
                           ▼
                     React Client
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
           Live Map      Alerts       Analytics
                           │
                     AI Intelligence
                           │
                Event Timeline / Replay
```

---

# 41. SUCCESS CRITERIA

The project should be considered successful when the following complete flow works without firmware modification:

```text
Test Edge Payload
       ↓
FastAPI receives it
       ↓
MongoDB stores telemetry
       ↓
Cloud AI processes it
       ↓
Sensor fusion occurs
       ↓
Historical trend is checked
       ↓
Anomaly detection runs
       ↓
Risk score is calculated
       ↓
Event is created
       ↓
Alert is generated when necessary
       ↓
WebSocket broadcasts result
       ↓
React receives result
       ↓
Dashboard updates immediately
```

The UI should show:

```text
EDGE AI
    ↓
89% confidence

CLOUD AI
    ↓
96% confidence

MULTI-NODE CONFIRMATION
    ↓
3 nodes

TREND
    ↓
Rapidly increasing

ANOMALY
    ↓
Detected

RISK
    ↓
94 / CRITICAL

INCIDENT
    ↓
Confirmed
```

---

# 42. FINAL NON-NEGOTIABLE RULES

1. NEVER touch `firmware/`.
2. The firmware belongs to another developer.
3. Do not fake firmware capabilities.
4. Do not assume unavailable sensor fields exist.
5. Treat firmware as an external Edge AI/data producer.
6. Cloud AI belongs inside `ai/`.
7. FastAPI orchestrates the cloud system.
8. MongoDB stores raw and derived information.
9. WebSockets provide real-time communication.
10. React visualizes the system.
11. Keep Edge AI and Cloud AI responsibilities clearly separated.
12. Edge AI performs fast local perception.
13. Cloud AI performs global reasoning.
14. Use multi-node fusion.
15. Use historical data.
16. Use anomaly detection.
17. Use explainable risk scoring.
18. Correlate events into incidents.
19. Make AI modular so real ML models can be introduced later.
20. Build and test using mock telemetry before depending on hardware.
21. Do not over-engineer.
22. Do not replace working code unnecessarily.
23. Keep the system presentation-ready.
24. Make the Edge → Cloud → Dashboard flow obvious.
25. If Cloud → Edge feedback is implemented, define it as an API/message contract only and do not modify firmware.

The final product should demonstrate genuine Edge–Cloud collaboration:

```text
EDGE = PERCEPTION
CLOUD = REASONING
DASHBOARD = VISUALIZATION
```

The cloud should not merely display sensor values. It should transform distributed edge intelligence into system-level intelligence.