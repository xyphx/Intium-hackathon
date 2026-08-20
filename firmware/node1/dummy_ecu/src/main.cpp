#include <SPI.h>
#include <mcp2515.h>

// Define the analog pin for the potentiometer
const int POT_PIN = A0; 

struct CAN_Payload {
    int32_t temperature;
    int32_t smoke;
    int32_t vibration;
    int32_t water;
};

MCP2515 mcp2515(10); // CS pin for MCP2515 on Arduino (Pin 10)

void setup() {
    Serial.begin(115200);

    mcp2515.reset();
    mcp2515.setBitrate(CAN_500KBPS, MCP_8MHZ);
    mcp2515.setNormalMode();

    Serial.println("Dummy ECU with Potentiometer Initialized.");
}

void loop() {
    // Read the potentiometer value (0 to 1023)
    int potValue = analogRead(POT_PIN);

    CAN_Payload packet;

    // Map potentiometer to temperature and smoke
    packet.temperature = map(potValue, 0, 1023, 2000, 15000);
    packet.smoke = map(potValue, 0, 1023, 10, 900);
    packet.vibration = 2;
    packet.water = 0;

    // Print BOTH values to the Serial Monitor
    Serial.print("Pot: ");
    Serial.print(potValue);
    Serial.print(" | Temp: ");
    Serial.print((float)packet.temperature / 100.0);
    Serial.print(" °C | Smoke: ");
    Serial.println(packet.smoke);

    // Pack into a standard CAN message frame
    struct can_frame msg;
    msg.can_id = 0x100;
    msg.can_dlc = 8;
    
    memcpy(msg.data, &packet.temperature, 4);
    memcpy(msg.data + 4, &packet.smoke, 4);

    // Send over CAN bus
    mcp2515.sendMessage(&msg);

    delay(200);
}
