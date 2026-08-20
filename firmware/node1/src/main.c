#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "esp_log.h"
#include "driver/adc.h"
#include "subnet_a_model.h"

static const char *TAG = "SUBNET_A_NODE";

// --- Fallback ADC Pin Configuration ---
// Connect the potentiometer wiper to GPIO 34
#define POT_ADC_CHANNEL ADC1_CHANNEL_6 

// Data structure matching your original CAN payload
typedef struct {
    uint32_t can_id;
    struct {
        int32_t temperature;
        int32_t smoke;
        int32_t vibration;
        int32_t water;
    } sensors;
} CAN_Payload;

QueueHandle_t sensor_data_queue;

// Standard Arduino map() function implemented for C
long map(long x, long in_min, long in_max, long out_min, long out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

// Task 1: Read Potentiometer directly via ESP32 ADC (Fallback)
void sensor_read_task(void *pvParameters) {
    // Initialize ADC (12-bit width, 0-4095 range, 11dB attenuation for full 0-3.3V range)
    adc1_config_width(ADC_WIDTH_BIT_12);
    adc1_config_channel_atten(POT_ADC_CHANNEL, ADC_ATTEN_DB_11);

    CAN_Payload sim_packet;
    sim_packet.can_id = 0x100;

    ESP_LOGI(TAG, "Fallback ADC Sensor Task GO! Reading from GPIO 34...");

    while (1) {
        // 1. Read potentiometer (0 to 4095 on ESP32 instead of 0 to 1023)
        int potValue = adc1_get_raw(POT_ADC_CHANNEL);

        // 2. Map values matching your exact Arduino logic 
        sim_packet.sensors.temperature = map(potValue, 0, 4095, 2000, 15000);
        sim_packet.sensors.smoke = map(potValue, 0, 4095, 10, 900);
        sim_packet.sensors.vibration = 200; // Original Arduino sent 2, scaling by 100 for your AI logic
        sim_packet.sensors.water = 0;

        // 3. Send to AI queue
        xQueueSend(sensor_data_queue, &sim_packet, pdMS_TO_TICKS(10));

        // 4. Match the 200ms delay from your original Arduino code
        vTaskDelay(pdMS_TO_TICKS(200)); 
    }
}

// Task 2: Edge AI Inference Task
void ai_inference_task(void *pvParameters) {
    CAN_Payload raw_data;
    
    while (1) {
        if (xQueueReceive(sensor_data_queue, &raw_data, portMAX_DELAY) == pdPASS) {
            // Reconstruct features as integers (dividing out the 100 multiplier)
            int16_t features[4] = {
                raw_data.sensors.temperature / 100,
                raw_data.sensors.smoke / 100,
                raw_data.sensors.vibration / 100,
                raw_data.sensors.water / 100
            };
            
            // Predict using the emlearn generated decision tree 
            int32_t prediction = subnet_a_ai_predict(features, 4); 
            
            switch(prediction) { 
                case 0:
                    ESP_LOGI(TAG, "🟢 NORMAL | Temp: %d °C, Smoke: %d, Vib: %d", features[0], features[1], features[2]);
                    break;
                case 1:
                    ESP_LOGW(TAG, "🔥 FIRE HAZARD DETECTED! | Temp: %d °C, Smoke: %d", features[0], features[1]);
                    break;
                case 2:
                    ESP_LOGE(TAG, "💥 IMPACT DETECTED! | Vib: %d", features[2]);
                    break;
            }
        }
    }
}

void app_main(void) {
    ESP_LOGI(TAG, "Booting Subnet A Node with Direct ADC Fallback...");

    sensor_data_queue = xQueueCreate(10, sizeof(CAN_Payload));
    if (sensor_data_queue == NULL) {
        ESP_LOGE(TAG, "❌ Failed to create sensor queue");
        return;
    }

    // Create Tasks
    xTaskCreatePinnedToCore(sensor_read_task, "ADC_Read_Task", 4096, NULL, 5, NULL, 0);
    xTaskCreatePinnedToCore(ai_inference_task, "AI_Task", 4096, NULL, 5, NULL, 1);

    ESP_LOGI(TAG, "FreeRTOS Scheduler Running...");

    while (1) {
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}
