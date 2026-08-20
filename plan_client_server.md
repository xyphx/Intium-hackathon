# XyphX — Full Server + Client Development Prompt

You are working on the XyphX project, a distributed intelligent monitoring system consisting of hardware nodes, a communication gateway, a FastAPI backend, MongoDB, and a React frontend.

Your task is to build and improve ONLY the software layers:

- `server/` → FastAPI + MongoDB + processing + WebSockets
- `client/` → React + TypeScript + dashboard + map + real-time UI

## ABSOLUTE PROJECT RULE — DO NOT TOUCH FIRMWARE

This is the most important rule.

The following directory belongs to another team member:

```text
firmware/
```

You MUST NOT:

- edit any firmware file
- create files inside firmware
- delete files inside firmware
- rename firmware files
- move firmware files
- reformat firmware files
- modify `platformio.ini`
- modify firmware configuration
- modify firmware source code
- install or change firmware dependencies
- refactor firmware
- "fix" firmware problems

Do not touch the firmware directory even if you think a firmware change would make the software easier.

The hardware/firmware developer is responsible for:

- ESP32 / ESP32-CAM
- sensors
- LoRa
- sensor reading
- camera processing on the node
- embedded logic
- firmware communication
- hardware power
- buzzer
- LEDs
- OLED
- gateway hardware

Treat firmware as an external data producer.

Your responsibility begins when telemetry/event data becomes available to the backend.

---

# 1. CURRENT PROJECT STRUCTURE

The current repository is:

```text
├── client
│   ├── public
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src
│   │   ├── assets
│   │   │   ├── hero.png
│   │   │   ├── react.svg
│   │   │   └── vite.svg
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── .gitignore
│   ├── README.md
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
│
├── firmware
│   └── node1
│       ├── include
│       │   └── README
│       ├── lib
│       │   └── README
│       ├── test
│       │   └── README
│       ├── .gitignore
│       └── platformio.ini
│
├── server
│   ├── app
│   │   ├── __init__.py
│   │   └── main.py
│   └── requirements.txt
│
└── README.md
```

Before making changes:

1. Inspect the existing `client/`.
2. Inspect the existing `server/`.
3. Preserve useful existing code.
4. Do not blindly replace everything.
5. Do not touch `firmware/`.

---

# 2. TECHNOLOGY STACK

Use:

## Backend

- Python
- FastAPI
- Pydantic
- MongoDB
- asynchronous MongoDB access
- WebSockets
- REST API
- environment variables
- CORS
- structured logging

## Frontend

- React
- TypeScript
- Vite
- CSS
- WebSocket client
- REST API client
- OpenStreetMap-based map

Do NOT connect React directly to MongoDB.

The architecture must always be:

```text
React
   ↓
FastAPI
   ↓
MongoDB
```

Never:

```text
React
   ↓
MongoDB
```

---

# 3. OVERALL SYSTEM ARCHITECTURE

The complete system should follow:

```text
                  HARDWARE SIDE
                       │
                       │
              ESP32 / ESP32-CAM
                       │
             Sensors / Camera
                       │
                      LoRa
                       │
                       ▼
                    Gateway
                       │
                       │ HTTP / network
                       ▼
              ┌─────────────────┐
              │     FastAPI     │
              │     Backend     │
              └────────┬────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
      MongoDB      Risk Engine   Event Engine
          │            │            │
          └────────────┼────────────┘
                       │
                    WebSocket
                       │
                       ▼
              ┌─────────────────┐
              │      React      │
              │    Dashboard    │
              └────────┬────────┘
                       │
          ┌────────────┼─────────────┐
          ▼            ▼             ▼
        Live Map      Alerts      Analytics
```

The firmware produces the raw data.

The backend:

- receives it
- validates it
- normalizes it
- stores it
- processes it
- calculates risk
- creates events
- creates alerts
- tracks node health
- broadcasts updates

The frontend:

- visualizes everything
- displays the map
- displays node health
- displays events
- displays alerts
- displays analytics
- receives real-time updates

---

# 4. IMPORTANT DATA PRINCIPLE

Do NOT assume that every node has every sensor.

Different nodes may have different capabilities.

For example:

```text
NODE-01
temperature
smoke
motion
battery

NODE-02
temperature
smoke
camera
battery

NODE-03
temperature
motion
distance
battery
```

Therefore sensor fields should be optional.

The backend must accept flexible telemetry while maintaining a consistent core structure.

---

# 5. RAW DATA FROM FIRMWARE

The backend should be prepared to receive data such as:

```text
node_id
timestamp

temperature
smoke
humidity
motion
distance
gas

battery

camera/vision result
AI confidence

RSSI
SNR
packet information

gateway_id

location if provided
```

Not every field is guaranteed.

If firmware does not currently provide a field:

- do not invent a value
- store it as unavailable/null
- do not break the API
- allow the field to be added later

The backend must be future-proof.

---

# 6. SERVER DIRECTORY STRUCTURE

Build a clean backend structure similar to:

```text
server/
└── app/
    ├── __init__.py
    ├── main.py
    ├── config.py
    ├── database.py
    │
    ├── models/
    │
    ├── schemas/
    │   ├── node.py
    │   ├── sensor.py
    │   ├── event.py
    │   ├── alert.py
    │   └── network.py
    │
    ├── routes/
    │   ├── health.py
    │   ├── nodes.py
    │   ├── sensors.py
    │   ├── events.py
    │   ├── alerts.py
    │   ├── statistics.py
    │   └── network.py
    │
    ├── services/
    │   ├── node_service.py
    │   ├── sensor_service.py
    │   ├── event_service.py
    │   ├── risk_service.py
    │   ├── alert_service.py
    │   └── network_service.py
    │
    └── websocket/
        ├── manager.py
        └── events.py
```

You may adjust this structure if necessary, but keep responsibilities separated.

Do not create an unnecessarily complicated enterprise architecture.

---

# 7. MONGODB

Use MongoDB as the primary database.

Configuration must come from environment variables.

Example:

```text
MONGODB_URI=
DATABASE_NAME=
```

Never hardcode credentials.

Create collections for at least:

```text
nodes
sensor_readings
events
alerts
network_logs
system_logs
```

Additional collections can be added if justified.

---

# 8. NODE COLLECTION

A node document should support:

```json
{
  "node_id": "NODE-01",
  "name": "North Gate",
  "status": "online",
  "battery": 87,
  "location": {
    "latitude": 8.5241,
    "longitude": 76.9366
  },
  "capabilities": [
    "temperature",
    "smoke",
    "motion"
  ],
  "last_seen": "2026-08-20T10:30:00Z",
  "created_at": "2026-08-20T09:00:00Z"
}
```

Support:

- node registration
- node status
- last seen
- battery
- location
- capabilities
- gateway association
- uptime if available
- health status

---

# 9. SENSOR READINGS

Store raw sensor information separately from events.

Example:

```json
{
  "node_id": "NODE-01",
  "timestamp": "2026-08-20T10:30:10Z",
  "temperature": 72,
  "smoke": 86,
  "motion": true,
  "distance": null,
  "humidity": null,
  "battery": 81
}
```

Do not require all fields.

The raw sensor record should preserve the information received from the hardware/gateway.

---

# 10. EVENTS

An event represents something meaningful detected by the system.

Examples:

```text
fire
smoke
high_temperature
motion
intrusion
sensor_anomaly
node_failure
network_degradation
```

An event may contain:

```json
{
  "event_id": "EVT-0001",
  "node_id": "NODE-01",
  "event_type": "fire",
  "confidence": 0.91,
  "risk_score": 88,
  "risk_level": "critical",
  "status": "detected",
  "confirmed": false,
  "timestamp": "2026-08-20T10:30:10Z"
}
```

---

# 11. RISK ENGINE

Create a dedicated risk-processing service.

Do NOT bury risk calculations inside route functions.

The risk engine should be independently testable.

It should consider available evidence such as:

- smoke level
- temperature
- motion
- AI/vision confidence
- repeated detections
- cross-node confirmation

Produce:

```text
risk_score
risk_level
```

Risk levels:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

The calculation should be:

- explainable
- deterministic
- configurable
- easy to replace later with a trained ML model

Do not pretend this is a trained AI model if it is only a rule-based scoring engine.

---

# 12. CROSS-NODE CONFIRMATION

Support collaborative event verification.

Example:

```text
NODE-01
Smoke detected
        ↓
Possible event
        ↓
NODE-02
Smoke also detected
        ↓
Event confirmed
        ↓
Risk increased
```

Store:

```text
event_id
confirming_node
confidence
timestamp
```

The backend should update the event when another node confirms it.

Broadcast this change through WebSocket.

---

# 13. EVENT LIFECYCLE

Events should support a lifecycle:

```text
DETECTED
   ↓
ANALYZING
   ↓
CONFIRMED
   ↓
ALERTED
   ↓
ACKNOWLEDGED
   ↓
RESOLVED
```

Do not force every event through every state.

For example, a harmless sensor reading may simply remain as a normal reading.

---

# 14. ALERT SYSTEM

Create an alert service.

Generate alerts for significant conditions.

Example:

```json
{
  "alert_id": "ALT-001",
  "event_id": "EVT-001",
  "node_id": "NODE-01",
  "severity": "critical",
  "title": "Possible Fire Detected",
  "message": "High smoke and temperature detected.",
  "acknowledged": false,
  "created_at": "..."
}
```

Support:

- create alert
- list alerts
- acknowledge alert
- resolve alert
- alert priority
- alert history

---

# 15. NODE HEALTH

The system should not only monitor environmental events.

It should monitor the health of the monitoring network itself.

Track:

```text
online/offline
last_seen
heartbeat
battery
uptime
RSSI if provided
SNR if provided
packet count if provided
packet loss if provided
gateway status
sensor availability
```

Calculate an overall node health state:

```text
HEALTHY
DEGRADED
CRITICAL
OFFLINE
```

If firmware does not provide a value, do not fabricate it.

---

# 16. HEARTBEATS

Support heartbeat messages.

Example:

```json
{
  "node_id": "NODE-01",
  "timestamp": "...",
  "battery": 82
}
```

Update:

```text
last_seen
status
battery
```

A node can become offline when its heartbeat/communication has not been received for a configurable period.

Do not modify firmware to implement this.

Only build the backend capability.

---

# 17. NETWORK MONITORING

If gateway/firmware provides network metadata, support:

```text
RSSI
SNR
packet count
packet loss
gateway ID
last packet
signal quality
```

Provide an API for network statistics.

Example:

```text
Total Nodes: 10
Online: 9
Offline: 1
Packets Received: 14,821
Packets Lost: 214
Network Health: 96.8%
```

If this information is not currently available from firmware, keep the backend fields optional.

---

# 18. SENSOR ANOMALY DETECTION

Add a software-level anomaly service.

Examples:

```text
Temperature:
32
33
34
35
36
92
```

Potential anomaly:

```text
Unexpected temperature spike
```

Other examples:

- impossible values
- sudden extreme changes
- sensor stuck at same value for too long
- missing readings
- abnormal reading frequency

Create an event such as:

```text
sensor_anomaly
```

Do not make this unnecessarily complicated.

Start with simple explainable rules.

---

# 19. WEBSOCKET ARCHITECTURE

Implement a proper WebSocket connection manager.

Endpoint:

```text
/ws/live
```

The backend should support multiple connected React clients.

Create a message structure such as:

```json
{
  "type": "NEW_ALERT",
  "timestamp": "...",
  "data": {}
}
```

Possible WebSocket message types:

```text
NODE_ONLINE
NODE_OFFLINE
NODE_STATUS_CHANGED

HEARTBEAT_RECEIVED

SENSOR_UPDATE

NEW_EVENT
EVENT_UPDATED
EVENT_CONFIRMED

RISK_UPDATED

NEW_ALERT
ALERT_ACKNOWLEDGED
ALERT_RESOLVED

NETWORK_UPDATE

SYSTEM_STATUS
```

Every message should have:

```text
type
timestamp
data
```

Keep the WebSocket protocol documented.

---

# 20. WEBSOCKET BEHAVIOR

When a new sensor reading arrives:

```text
Firmware
   ↓
FastAPI
   ↓
MongoDB
   ↓
Processing
   ↓
WebSocket
   ↓
React
```

React must update the dashboard immediately.

Do NOT require a page refresh.

Do NOT rely only on polling for live data.

REST APIs are for:

- initial data
- historical data
- CRUD operations

WebSocket is for:

- live updates
- alerts
- status changes
- real-time events

---

# 21. REST API

Implement at least:

```text
GET    /api/health

GET    /api/nodes
GET    /api/nodes/{node_id}
POST   /api/nodes/register
POST   /api/nodes/{node_id}/heartbeat

POST   /api/sensor-data
GET    /api/sensor-data
GET    /api/sensor-data/{node_id}

POST   /api/events
GET    /api/events
GET    /api/events/{event_id}
POST   /api/events/{event_id}/confirm

GET    /api/alerts
GET    /api/alerts/{alert_id}
PATCH  /api/alerts/{alert_id}/acknowledge
PATCH  /api/alerts/{alert_id}/resolve

GET    /api/statistics
GET    /api/network/statistics

WS     /ws/live
```

Use:

- proper validation
- proper HTTP status codes
- Pydantic schemas
- useful error messages

---

# 22. API RESPONSE FORMAT

Keep responses consistent.

For example:

```json
{
  "success": true,
  "data": {},
  "message": "..."
}
```

For errors:

```json
{
  "success": false,
  "message": "Node not found"
}
```

Do not make every endpoint return a completely different structure unless there is a good reason.

---

# 23. FASTAPI DOCUMENTATION

FastAPI's automatic documentation must work.

Ensure:

```text
/docs
/redoc
```

are useful.

Every important endpoint should have:

- description
- request schema
- response schema
- validation

---

# 24. CORS

Allow the React development server to communicate with FastAPI.

Use environment-based configuration.

Do not blindly use:

```text
allow_origins=["*"]
```

for production.

---

# 25. FRONTEND STRUCTURE

Build the React application with a clean structure:

```text
client/
└── src/
    ├── assets/
    │
    ├── components/
    │   ├── Header.tsx
    │   ├── StatCard.tsx
    │   ├── LiveMap.tsx
    │   ├── NodeList.tsx
    │   ├── NodeDetails.tsx
    │   ├── AlertPanel.tsx
    │   ├── EventList.tsx
    │   ├── RiskBadge.tsx
    │   ├── NetworkStatus.tsx
    │   └── ConnectionStatus.tsx
    │
    ├── pages/
    │   ├── Dashboard.tsx
    │   ├── Nodes.tsx
    │   ├── Events.tsx
    │   └── Alerts.tsx
    │
    ├── api/
    │   └── client.ts
    │
    ├── hooks/
    │   └── useWebSocket.ts
    │
    ├── types/
    │   └── index.ts
    │
    ├── utils/
    │
    ├── App.tsx
    ├── App.css
    ├── index.css
    └── main.tsx
```

Keep the architecture simple.

---

# 26. DASHBOARD

The main dashboard should immediately communicate system state.

Include:

```text
Total Nodes
Online Nodes
Offline Nodes
Active Alerts
Critical Events
Network Health
```

Example:

```text
┌─────────────────────────────────────────────┐
│ XyphX SENTINEL                    🟢 LIVE   │
├─────────────────────────────────────────────┤
│                                             │
│ 12 Nodes    11 Online    1 Offline          │
│                                             │
│ 3 Alerts    1 Critical    96.8% Network     │
│                                             │
├───────────────────────────┬─────────────────┤
│                           │ ACTIVE ALERTS    │
│         LIVE MAP          │                 │
│                           │ 🔴 Fire         │
│    🟢       🟡            │ 🟡 Heat         │
│          🔴               │                 │
│       🟢                  │                 │
├───────────────────────────┴─────────────────┤
│ LIVE EVENTS                                  │
└─────────────────────────────────────────────┘
```

---

# 27. LIVE MAP

Use OpenStreetMap.

The map should show:

- nodes
- node status
- event locations
- risk level
- gateway if location is available

Marker states:

```text
🟢 HEALTHY
🟡 WARNING
🔴 CRITICAL
⚫ OFFLINE
```

Clicking a node should open a node details panel.

Do not use Google Maps.

The map should be a reusable component.

---

# 28. NODE DETAILS

When a user clicks a node:

Show:

```text
NODE-01

Status:
ONLINE

Battery:
87%

Last Seen:
2 seconds ago

Temperature:
42°C

Smoke:
12%

Motion:
Detected

Risk:
LOW

Signal:
Good

Location:
Latitude / Longitude
```

Only display fields that exist.

Unavailable values should display:

```text
N/A
```

Do not fabricate sensor values.

---

# 29. SENSOR VISUALIZATION

Provide charts for historical data.

Examples:

- temperature over time
- smoke over time
- humidity over time
- motion events
- risk score over time
- battery over time

Charts should support selecting a node.

Use a clean and readable design.

Do not overload the dashboard with unnecessary charts.

---

# 30. EVENT TIMELINE

Create a clear event timeline.

Example:

```text
10:42:11
Smoke detected
NODE-04

10:42:13
Temperature increased
NODE-04

10:42:15
Event confirmed
NODE-03

10:42:17
Risk changed
HIGH → CRITICAL

10:42:18
Alert generated
```

This should help users understand exactly what happened.

---

# 31. INCIDENT REPLAY

Create an event detail view where a user can inspect the timeline of an incident.

Show:

```text
Detection
Confirmation
Risk changes
Alert creation
Acknowledgement
Resolution
```

This is a major presentation/demo feature.

---

# 32. ALERT PANEL

Create a real-time alert panel.

Each alert should display:

```text
Severity
Title
Node
Event
Risk Score
Confidence
Time
Status
```

Example:

```text
🔴 CRITICAL

Possible Fire Detected

Node: NODE-04
Confidence: 91%
Risk Score: 88

2 minutes ago

[ACKNOWLEDGE]
```

When an alert arrives over WebSocket, it should appear immediately.

---

# 33. RISK BADGES

Create reusable risk components.

```text
LOW       → green style
MEDIUM    → yellow style
HIGH      → orange style
CRITICAL  → red style
```

Do not hardcode risk styling separately in every component.

Create one reusable `RiskBadge`.

---

# 34. NETWORK STATUS UI

Add a network health panel.

Show:

```text
Nodes
Online
Offline
Gateway
Packets
Packet Loss
Signal Quality
```

Only show metrics actually available from the backend.

---

# 35. SYSTEM CONNECTION STATUS

The frontend must show its WebSocket status.

States:

```text
🟢 LIVE
🟡 CONNECTING
🔴 DISCONNECTED
```

Implement automatic reconnection.

Do not crash the UI if WebSocket disconnects.

---

# 36. API CLIENT

Create a centralized API layer.

For example:

```text
src/api/client.ts
```

Functions:

```text
getNodes()
getNode(id)
getSensorReadings()
getEvents()
getEvent(id)
confirmEvent(id)
getAlerts()
acknowledgeAlert(id)
resolveAlert(id)
getStatistics()
getNetworkStatistics()
```

Do not scatter `fetch()` calls across components.

---

# 37. TYPESCRIPT TYPES

Create proper types for:

```text
Node
NodeStatus
SensorReading
Event
EventStatus
Alert
RiskLevel
Statistics
NetworkStatistics
WebSocketMessage
```

Avoid:

```typescript
any
```

unless absolutely necessary.

---

# 38. WEBSOCKET HOOK

Create:

```text
useWebSocket()
```

It should:

- connect
- disconnect cleanly
- reconnect
- parse messages
- expose connection state
- expose latest messages

The rest of the application should not need to know low-level WebSocket implementation details.

---

# 39. MOCK DATA

The frontend may need to be developed before the hardware/backend is fully connected.

Create a controlled mock-data layer if necessary.

Example:

```text
src/mock/
```

But:

- keep mock data separate
- do not spread fake data across components
- make it easy to disable
- do not confuse mock data with real hardware data

The final system must consume FastAPI data.

---

# 40. ENVIRONMENT VARIABLES

Frontend should use something like:

```text
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws/live
```

Backend should use:

```text
MONGODB_URI=
DATABASE_NAME=
```

Never commit secrets.

---

# 41. REAL-TIME DATA FLOW

The final behavior should be:

```text
Sensor changes
      ↓
Firmware sends data
      ↓
Gateway receives data
      ↓
FastAPI receives telemetry
      ↓
Validate
      ↓
Store raw reading
      ↓
Run processing
      ↓
Calculate risk
      ↓
Create/update event
      ↓
Create alert if necessary
      ↓
Store alert
      ↓
Broadcast WebSocket message
      ↓
React receives message
      ↓
Dashboard updates instantly
      ↓
Map / alerts / statistics / node status update
```

This is the core architecture.

---

# 42. DATA SEPARATION

Keep these concepts separate:

## Raw telemetry

What hardware actually sent.

## Processed data

What backend calculated.

## Events

Meaningful occurrences.

## Alerts

User-facing notifications.

## Statistics

Aggregated information.

Do not mix all of these into one MongoDB document.

---

# 43. SECURITY AND VALIDATION

Implement basic backend protection:

- validate incoming payloads
- reject malformed data
- limit unreasonable values
- never trust node IDs blindly
- avoid exposing MongoDB credentials
- use environment variables
- configure CORS properly
- avoid logging secrets

Authentication can be added later if it is not part of the current prototype.

Do not spend most of the development time building authentication unless required.

---

# 44. LOGGING

Backend should log useful information:

```text
Node registered
Sensor data received
Event created
Risk changed
Alert generated
WebSocket client connected
WebSocket client disconnected
Database connection state
```

Avoid logging sensitive credentials.

---

# 45. ERROR HANDLING

The system should gracefully handle:

```text
MongoDB unavailable
Invalid sensor payload
Unknown node
WebSocket disconnect
Frontend API failure
Missing sensor fields
Duplicate events
Gateway unavailable
```

The UI should show meaningful error/loading states.

---

# 46. PERFORMANCE

Do not perform expensive processing directly inside every HTTP request if it can be separated cleanly.

Use asynchronous operations.

Do not send huge amounts of historical data to React at once.

Use:

- pagination
- time-range filters
- limited result sets
- aggregation where appropriate

---

# 47. DATABASE INDEXING

Create appropriate indexes for frequently queried fields such as:

```text
node_id
timestamp
event_type
risk_level
status
created_at
```

Do not create indexes blindly.

Index based on actual query patterns.

---

# 48. STATISTICS API

Create an endpoint that provides dashboard statistics.

For example:

```json
{
  "total_nodes": 12,
  "online_nodes": 11,
  "offline_nodes": 1,
  "active_alerts": 3,
  "critical_events": 1,
  "network_health": 96.8
}
```

The frontend should use this for dashboard cards.

---

# 49. HISTORICAL DATA

Provide APIs for querying historical data.

Support filters such as:

```text
node_id
start_time
end_time
event_type
risk_level
```

Example:

```text
GET /api/events?node_id=NODE-01
```

and time-based queries.

Do not return unlimited records.

---

# 50. FRONTEND PAGES

Create at least:

## Dashboard

Real-time overview.

## Nodes

All nodes and health information.

## Events

Historical events and filtering.

## Alerts

Active and historical alerts.

The main dashboard should remain the primary presentation screen.

---

# 51. UI DESIGN

The UI should look like a serious monitoring/control platform.

Avoid making it look like:

- a generic CRUD app
- a basic student admin panel
- a simple table-only project

Use:

- strong visual hierarchy
- cards
- status indicators
- risk badges
- live indicators
- charts
- map
- event timeline
- clean spacing
- responsive layout

Keep animations limited and purposeful.

---

# 52. RESPONSIVENESS

Support:

- desktop
- laptop
- tablet

Desktop is the priority because this is a monitoring dashboard.

---

# 53. ACCESSIBILITY

Use:

- readable text
- proper labels
- keyboard-friendly controls
- sufficient contrast
- meaningful status text

Do not rely only on color.

For example:

```text
🔴 CRITICAL
```

not just a red dot.

---

# 54. DEVELOPMENT ORDER

Do NOT try to build everything randomly.

Follow this order.

## Phase 1 — Backend foundation

Build:

```text
FastAPI
MongoDB
configuration
health endpoint
CORS
```

Confirm the server starts.

---

## Phase 2 — Node management

Build:

```text
nodes
registration
heartbeat
status
last_seen
location
battery
```

---

## Phase 3 — Sensor ingestion

Build:

```text
POST /api/sensor-data
MongoDB storage
validation
```

---

## Phase 4 — Events

Build:

```text
event creation
event storage
event retrieval
```

---

## Phase 5 — Risk engine

Build:

```text
risk score
risk level
event escalation
```

---

## Phase 6 — Alerts

Build:

```text
alert creation
acknowledgement
resolution
```

---

## Phase 7 — WebSockets

Build:

```text
connection manager
message protocol
broadcasting
```

---

## Phase 8 — React foundation

Build:

```text
API layer
types
layout
dashboard
```

---

## Phase 9 — Map

Build:

```text
OpenStreetMap
node markers
risk states
event locations
```

---

## Phase 10 — Real-time UI

Connect:

```text
WebSocket
alerts
events
node status
sensor updates
```

---

## Phase 11 — Analytics

Add:

```text
charts
history
event timeline
network statistics
node health
```

---

## Phase 12 — Polish

Add:

```text
loading states
error states
responsive design
empty states
reconnection
performance improvements
```

---

# 55. TESTING

Before considering the project complete, test the backend without firmware.

Create realistic test requests.

Example:

```json
{
  "node_id": "NODE-01",
  "temperature": 72,
  "smoke": 86,
  "motion": true,
  "battery": 82,
  "timestamp": "..."
}
```

Confirm:

```text
FastAPI receives it
       ↓
MongoDB stores it
       ↓
Risk engine processes it
       ↓
Event is created
       ↓
Alert is created if required
       ↓
WebSocket broadcasts it
       ↓
React updates
```

This allows the software team to develop independently from the hardware team.

---

# 56. HARDWARE INDEPENDENCE

The backend must NOT depend on firmware being available during development.

Create a development/test mechanism such as:

```text
test payloads
mock requests
API documentation
```

Do NOT put these inside `firmware/`.

The goal is:

```text
Firmware not ready
       ↓
Backend still works
       ↓
Frontend still works
       ↓
Mock/test telemetry
       ↓
Later replace with real gateway
```

---

# 57. DO NOT INVENT HARDWARE DATA

This rule is critical.

If the firmware currently sends:

```text
temperature
smoke
motion
```

do not pretend that it sends:

```text
GPS
RSSI
SNR
battery
camera confidence
```

unless those fields actually exist.

Instead, design the schema to support them optionally.

The backend should be extensible without claiming that unavailable hardware functionality already exists.

---

# 58. SOFTWARE-GENERATED DATA

The backend is allowed to generate derived information from available input.

Examples:

```text
risk_score
risk_level
node_health
event_status
alert_priority
event_confirmation
sensor_anomaly
statistics
network_health
```

Clearly distinguish these from raw hardware readings.

---

# 59. FINAL RESPONSIBILITY SPLIT

## Hardware/Firmware Developer

Responsible for:

```text
ESP32
ESP32-CAM
Sensors
LoRa
Firmware
Sensor acquisition
Camera acquisition
Embedded processing
Gateway hardware
Buzzer
LED
OLED
Battery/power
```

## Software Developer — YOU

Responsible for:

```text
FastAPI
MongoDB
REST API
WebSockets
Data validation
Data ingestion
Risk engine
Event engine
Alert engine
Node health
Network monitoring
Historical storage
Analytics
OpenStreetMap integration
React dashboard
Real-time UI
Charts
Event timeline
Incident replay
```

---

# 60. FINAL ACCEPTANCE CRITERIA

The implementation is considered successful only when:

### Backend

- FastAPI starts successfully.
- MongoDB connects successfully.
- `/api/health` works.
- Node APIs work.
- Sensor ingestion works.
- Event APIs work.
- Alert APIs work.
- Risk processing works.
- WebSocket works.
- API documentation works.
- Errors are handled properly.
- No firmware files were modified.

### Frontend

- React starts successfully.
- Dashboard loads.
- Backend data is displayed.
- Nodes are displayed.
- Map works.
- Alerts work.
- Events work.
- Risk levels are visible.
- Charts work.
- WebSocket updates work.
- Reconnection works.
- Loading/error states work.
- Production build succeeds.

### Integration

A test telemetry payload should produce:

```text
Telemetry
   ↓
FastAPI
   ↓
MongoDB
   ↓
Risk Engine
   ↓
Event
   ↓
Alert
   ↓
WebSocket
   ↓
React
   ↓
Live Dashboard Update
```

without requiring a page refresh.

---

# 61. MOST IMPORTANT RULES — FINAL REMINDER

1. NEVER touch `firmware/`.
2. Work only on `server/` and `client/`.
3. Do not modify firmware to make the backend work.
4. Treat firmware as an external data producer.
5. Do not connect React directly to MongoDB.
6. FastAPI is the only backend API layer.
7. MongoDB stores raw and processed application data.
8. WebSockets handle real-time updates.
9. REST APIs handle normal/historical operations.
10. Do not fabricate unavailable hardware data.
11. Make optional sensor fields truly optional.
12. Keep raw telemetry separate from derived intelligence.
13. Keep risk processing explainable.
14. Make the frontend professional and presentation-ready.
15. Make the system testable even before the hardware firmware is ready.
16. Preserve the existing project setup where possible.
17. Do not over-engineer.
18. Build incrementally and verify each phase before moving to the next.

The final product should feel like a real-time intelligent monitoring platform:

```text
          HARDWARE
             ↓
          TELEMETRY
             ↓
          FASTAPI
             ↓
        ┌────┴────┐
        ↓         ↓
     MongoDB   Intelligence
        │         │
        └────┬────┘
             ↓
         WebSocket
             ↓
           React
             ↓
   ┌─────────┼─────────┐
   ↓         ↓         ↓
  MAP      ALERTS   ANALYTICS
   │         │         │
   └─────────┼─────────┘
             ↓
       INCIDENT VIEW
```

Do not modify `firmware/`. It is strictly out of scope.