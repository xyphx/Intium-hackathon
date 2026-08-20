#include <SPI.h>
#include <mcp2515.h>

// --- Configuration ---
#define CS_PIN 10
MCP2515 mcp2515(CS_PIN);

// --- Data Structure ---
// A union maps the 8 bytes of the floats directly to a byte array
union CAN_Payload {
  struct {
    float temperature;
    float smoke_level;
  } sensors;
  uint8_t bytes[8];
};

struct can_frame canMsg;
CAN_Payload payload;

// --- State Machine for Simulation ---
enum SystemState { NORMAL, SMOKE_DETECTED, FIRE_DETECTED };
SystemState currentState = NORMAL;
unsigned long lastStateChange = 0;

void setup() {
  Serial.begin(115200);
  SPI.begin();
  
  Serial.println("Starting XyphX Sentinel Node Simulator...");

  mcp2515.reset();
  
  // IMPORTANT: Match this to the crystal on your MCP2515 module!
  // Most cheap red modules use an 8MHz crystal, not 16MHz.
  mcp2515.setBitrate(CAN_500KBPS, MCP_8MHZ); 
  
  mcp2515.setNormalMode();
  
  // Configure the CAN frame header
  canMsg.can_id  = 0x036; // Node 2 ID
  canMsg.can_dlc = 8;     // 8 bytes of data
}

void loop() {
  unsigned long currentMillis = millis();

  // Cycle through simulation states every 10 seconds to test your UI
  if (currentMillis - lastStateChange > 10000) {
    lastStateChange = currentMillis;
    currentState = (SystemState)((currentState + 1) % 3);
  }

  // Generate fake data based on the current state
  switch (currentState) {
    case NORMAL:
      payload.sensors.temperature = 24.5 + random(-10, 10) / 10.0;
      payload.sensors.smoke_level = 5.0 + random(-2, 2);
      Serial.println("State: NORMAL - Transmitting baseline data...");
      break;
      
    case SMOKE_DETECTED:
      payload.sensors.temperature = 30.2 + random(-10, 10) / 10.0;
      payload.sensors.smoke_level = 65.5 + random(-5, 5);
      Serial.println("State: SMOKE - Transmitting elevated smoke data...");
      break;
      
    case FIRE_DETECTED:
      payload.sensors.temperature = 72.4 + random(-20, 20) / 10.0;
      payload.sensors.smoke_level = 92.1 + random(-2, 2);
      Serial.println("State: FIRE - Transmitting critical data...");
      break;
  }

  // Copy the union bytes into the CAN frame
  for (int i = 0; i < 8; i++) {
    canMsg.data[i] = payload.bytes[i];
  }

  // Send the message over the CAN bus
  MCP2515::ERROR status = mcp2515.sendMessage(&canMsg);
  
  if (status == MCP2515::ERROR_OK) {
    Serial.print("Sent -> Temp: ");
    Serial.print(payload.sensors.temperature);
    Serial.print("C | Smoke: ");
    Serial.println(payload.sensors.smoke_level);
  } else {
    Serial.println("CAN Transmission Failed! Check wiring and termination resistors.");
  }

  // Wait 1 second before sending the next reading
  delay(1000); 
}
