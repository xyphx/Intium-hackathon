#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "esp_log.h"
#include "driver/adc.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "nvs_flash.h"
#include "esp_http_client.h"
#include "subnet_a_model.h"

static const char *TAG = "SUBNET_A_NODE";

// ⚠️ UPDATE THESE WITH YOUR WI-FI CREDENTIALS
#define WIFI_SSID      "Memslab_mesh"
#define WIFI_PASS      "Cet@695016"
// Laptop IP address verified via 'ip a'
#define GATEWAY_URL    "http://192.168.68.176:5000/edge-data" 

#define POT_ADC_CHANNEL ADC1_CHANNEL_6 // GPIO 34

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

// --- Standard map function ---
long map(long x, long in_min, long in_max, long out_min, long out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

// --- Wi-Fi Initialization ---
static void wifi_event_handler(void* arg, esp_event_base_t event_base, int32_t event_id, void* event_data) {
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        ESP_LOGW(TAG, "Wi-Fi disconnected. Reconnecting...");
        esp_wifi_connect();
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t* event = (ip_event_got_ip_t*) event_data;
        ESP_LOGI(TAG, "✅ Connected! ESP32 IP Address: " IPSTR, IP2STR(&event->ip_info.ip));
    }
}

void wifi_init_sta(void) {
    esp_netif_init();
    esp_event_loop_create_default();
    esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    esp_wifi_init(&cfg);

    esp_event_handler_instance_register(WIFI_EVENT, ESP_EVENT_ANY_ID, &wifi_event_handler, NULL, NULL);
    esp_event_handler_instance_register(IP_EVENT, IP_EVENT_STA_GOT_IP, &wifi_event_handler, NULL, NULL);

    wifi_config_t wifi_config = {
        .sta = {
            .ssid = WIFI_SSID,
            .password = WIFI_PASS,
        },
    };
    esp_wifi_set_mode(WIFI_MODE_STA);
    esp_wifi_set_config(WIFI_IF_STA, &wifi_config);
    esp_wifi_start();
}

// --- Task 1: Read Potentiometer ---
void sensor_read_task(void *pvParameters) {
    adc1_config_width(ADC_WIDTH_BIT_12);
    // FIX: Updated to DB_12 to resolve deprecation warning
    adc1_config_channel_atten(POT_ADC_CHANNEL, ADC_ATTEN_DB_12);

    CAN_Payload sim_packet;
    sim_packet.can_id = 0x100;

    vTaskDelay(pdMS_TO_TICKS(3000)); // Wait for Wi-Fi to connect
    ESP_LOGI(TAG, "ADC Sensor Task GO! Reading GPIO 34...");

    while (1) {
        int potValue = adc1_get_raw(POT_ADC_CHANNEL);
        
        sim_packet.sensors.temperature = map(potValue, 0, 4095, 2000, 15000);
        sim_packet.sensors.smoke = map(potValue, 0, 4095, 10, 900);
        sim_packet.sensors.vibration = 200; 
        sim_packet.sensors.water = 0;

        xQueueSend(sensor_data_queue, &sim_packet, pdMS_TO_TICKS(10));
        vTaskDelay(pdMS_TO_TICKS(1000)); // Send every 1 second to avoid flooding network
    }
}

// --- Task 2: AI Inference & HTTP Push ---
void ai_inference_task(void *pvParameters) {
    CAN_Payload raw_data;
    
    while (1) {
        if (xQueueReceive(sensor_data_queue, &raw_data, portMAX_DELAY) == pdPASS) {
            int16_t features[4] = {
                raw_data.sensors.temperature / 100,
                raw_data.sensors.smoke / 100,
                raw_data.sensors.vibration / 100,
                raw_data.sensors.water / 100
            };
            
            int32_t prediction = subnet_a_ai_predict(features, 4); 
            
            if(prediction == 0) ESP_LOGI(TAG, "🟢 NORMAL");
            else if(prediction == 1) ESP_LOGW(TAG, "🔥 FIRE DETECTED");
            else ESP_LOGE(TAG, "💥 IMPACT DETECTED");

            // FIX: Changed %d to %ld and cast parameters to (long)
            char post_data[256];
            snprintf(post_data, sizeof(post_data),
                     "{\"temperature\": %ld, \"smoke\": %ld, \"vibration\": %ld, \"prediction\": %ld}",
                     (long)raw_data.sensors.temperature, 
                     (long)raw_data.sensors.smoke, 
                     (long)raw_data.sensors.vibration, 
                     (long)prediction);

            esp_http_client_config_t config = {
                .url = GATEWAY_URL,
                .method = HTTP_METHOD_POST,
            };
            
            esp_http_client_handle_t client = esp_http_client_init(&config);
            esp_http_client_set_header(client, "Content-Type", "application/json");
            esp_http_client_set_post_field(client, post_data, strlen(post_data));
            
            esp_err_t err = esp_http_client_perform(client);
            if (err != ESP_OK) {
                ESP_LOGE(TAG, "HTTP POST failed: %s", esp_err_to_name(err));
            }
            
            esp_http_client_cleanup(client);
        }
    }
}

void app_main(void) {
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
      ESP_ERROR_CHECK(nvs_flash_erase());
      ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    ESP_LOGI(TAG, "Booting Subnet A Node with Wireless Gateway Link...");

    wifi_init_sta();

    sensor_data_queue = xQueueCreate(10, sizeof(CAN_Payload));

    xTaskCreatePinnedToCore(sensor_read_task, "ADC_Task", 4096, NULL, 5, NULL, 0);
    xTaskCreatePinnedToCore(ai_inference_task, "AI_HTTP_Task", 8192, NULL, 5, NULL, 1);

    while (1) {
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}
