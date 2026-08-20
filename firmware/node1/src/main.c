#include <stdio.h>
#include <stdint.h>
#include <math.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "freertos/semphr.h"
#include "driver/spi_master.h"
#include "driver/gpio.h"
#include "esp_log.h"

static const char *TAG = "XYPHX_NODE_1";

// --- Hardware Pins ---
#define PIN_NUM_MISO 19
#define PIN_NUM_MOSI 23
#define PIN_NUM_CLK  18
#define PIN_NUM_CS   5
#define PIN_NUM_INT  4 

// --- FreeRTOS Primitives ---
SemaphoreHandle_t can_rx_semaphore = NULL;
QueueHandle_t sensor_data_queue = NULL;

// --- Data Structures ---
typedef struct {
    float temperature;
    float smoke_level;
} SensorPayload;

// --- Mock Pure C Neural Network (Multi-Layer Perceptron) ---
// Extracted from Python training scripts prior to the hackathon
float run_tinyml_inference(float temp, float smoke) {
    // Hidden Layer 1 Weights & Biases
    float w11 = 0.45, w12 = 0.89, b1 = -0.5;
    float w21 = 0.33, w22 = 0.76, b2 = -0.2;
    
    // Output Layer Weights
    float out_w1 = 0.88, out_w2 = 0.91, out_b = -0.1;

    // Forward Pass with ReLU activation
    float h1 = (temp * w11) + (smoke * w12) + b1;
    h1 = (h1 > 0) ? h1 : 0; // ReLU
    
    float h2 = (temp * w21) + (smoke * w22) + b2;
    h2 = (h2 > 0) ? h2 : 0; // ReLU

    // Output node (Sigmoid for percentage)
    float raw_out = (h1 * out_w1) + (h2 * out_w2) + out_b;
    float confidence = 1.0 / (1.0 + exp(-raw_out)); 

    return confidence;
}

// --- Interrupt Service Routine (ISR) ---
// Triggers when MCP2515 pulls INT pin low
static void IRAM_ATTR mcp2515_isr_handler(void* arg) {
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;
    xSemaphoreGiveFromISR(can_rx_semaphore, &xHigherPriorityTaskWoken);
    if (xHigherPriorityTaskWoken == pdTRUE) {
        portYIELD_FROM_ISR();
    }
}

// --- Task 1: CAN Bus Handler (Core 1) ---
void can_rx_task(void *pvParameters) {
    SensorPayload incoming_data;
    
    while (1) {
        // Wait indefinitely until the ISR gives the semaphore
        if (xSemaphoreTake(can_rx_semaphore, portMAX_DELAY) == pdTRUE) {
            ESP_LOGI(TAG, "CAN Interrupt Received! Reading MCP2515 via SPI...");
            
            // [Insert MCP2515 SPI Read Register Logic Here]
            // For simulation, we parse the fake Arduino payload:
            incoming_data.temperature = 72.4; 
            incoming_data.smoke_level = 89.0;
            
            // Send to AI Task via Queue
            xQueueSend(sensor_data_queue, &incoming_data, portMAX_DELAY);
        }
    }
}

// --- Task 2: AI Inference Engine (Core 0) ---
void ai_inference_task(void *pvParameters) {
    SensorPayload data_to_process;
    
    while (1) {
        // Wait for data from the CAN task
        if (xQueueReceive(sensor_data_queue, &data_to_process, portMAX_DELAY) == pdPASS) {
            ESP_LOGI(TAG, "Running Edge AI Inference...");
            
            float fire_confidence = run_tinyml_inference(
                data_to_process.temperature, 
                data_to_process.smoke_level
            );
            
            ESP_LOGI(TAG, "AI RESULT: FIRE PROBABILITY = %.2f%%", fire_confidence * 100);
            
            // [Insert MQTT publishing logic here to send result to the FastAPI backend]
        }
    }
}

// --- Main Application Entry ---
void app_main(void) {
    ESP_LOGI(TAG, "Initializing XyphX Sentinel Node...");

    // 1. Create FreeRTOS Primitives
    can_rx_semaphore = xSemaphoreCreateBinary();
    sensor_data_queue = xQueueCreate(10, sizeof(SensorPayload));

    // 2. Configure SPI Bus for MCP2515
    spi_bus_config_t buscfg = {
        .miso_io_num = PIN_NUM_MISO,
        .mosi_io_num = PIN_NUM_MOSI,
        .sclk_io_num = PIN_NUM_CLK,
        .quadwp_io_num = -1,
        .quadhd_io_num = -1,
        .max_transfer_sz = 32
    };
    spi_bus_initialize(VSPI_HOST, &buscfg, 1);

    // 3. Configure Hardware Interrupt for MCP2515
    gpio_config_t io_conf = {
        .intr_type = GPIO_INTR_NEGEDGE,
        .pin_bit_mask = (1ULL << PIN_NUM_INT),
        .mode = GPIO_MODE_INPUT,
        .pull_up_en = 1
    };
    gpio_config(&io_conf);
    gpio_install_isr_service(0);
    gpio_isr_handler_add(PIN_NUM_INT, mcp2515_isr_handler, NULL);

    // 4. Pin Tasks to Specific Cores
    // Pin AI math to Core 0, leaving Core 1 for WiFi/MQTT and CAN SPI handling
    xTaskCreatePinnedToCore(ai_inference_task, "AI_Task", 4096, NULL, 5, NULL, 0);
    xTaskCreatePinnedToCore(can_rx_task, "CAN_Task", 4096, NULL, 10, NULL, 1);
}
