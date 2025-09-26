/*
 * --------------------------------------------------------------------------------------------------------------------
 * Example sketch/program showing how to read data from a MFRC522 NFC/RFID reader
 * and send it to a web server via a POST request.
 * --------------------------------------------------------------------------------------------------------------------
 * This is a MFRC522 library example; for further details and other examples visit https://github.com/miguelbalboa/rfid
 * 
 * Hardware Connections:
 * -----------------------------------------------------------------------------
 *             MFRC522      ESP8266 (NodeMCU)
 *             Reader/PCD   https://www.amazon.com/HiLetgo-NodeMCU-Internet-Development-ESP8266/dp/B010O1G1ES
 * Signal      Pin          Pin
 * -----------------------------------------------------------------------------
 * RST/Reset   RST          D3
 * SPI SS      SDA(SS)      D4
 * SPI MOSI    MOSI         D7
 * SPI MISO    MISO         D6
 * SPI SCK     SCK          D5
 *
 * Wifi and server settings need to be configured below.
 */

#include <SPI.h>
#include <MFRC522.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

#define RST_PIN   D3
#define SS_PIN    D4

// ------------------- WiFi Settings -------------------
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
// -----------------------------------------------------

// ------------------- Server Settings -----------------
// Your web server's URL. If running locally, you might use your computer's IP address.
const char* serverUrl = "http://YOUR_SERVER_ADDRESS/api/check-in"; 
// A secret key to authenticate with your API. Make sure this matches the key in your .env.local file.
const char* apiKey = "YOUR_SECRET_API_KEY";
// -----------------------------------------------------

MFRC522 mfrc522(SS_PIN, RST_PIN);  // Create MFRC522 instance
unsigned long lastScanTime = 0;
const unsigned long scanCooldown = 5000; // 5 seconds cooldown

void setup() {
  Serial.begin(115200);
  while (!Serial);
  
  SPI.begin();
  mfrc522.PCD_Init();
  
  Serial.println("Scan RFID Tag...");

  // --- WiFi Connection ---
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  // ---------------------
}

void loop() {
  // Check if it's time to scan again
  if (millis() - lastScanTime < scanCooldown) {
    return;
  }
  
  // Look for new cards
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
    return;
  }
  
  lastScanTime = millis(); // Update the last scan time

  // Get the UID of the card
  String rfid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    rfid += (mfrc522.uid.uidByte[i] < 0x10 ? "0" : "") + String(mfrc522.uid.uidByte[i], HEX);
  }
  rfid.toUpperCase();
  Serial.print("Card UID: ");
  Serial.println(rfid);

  // Send the UID to the server
  sendRfidToServer(rfid);
  
  // Halt PICC
  mfrc522.PICC_HaltA();
  // Stop encryption on PCD
  mfrc522.PCD_StopCrypto1();
}

void sendRfidToServer(String rfid) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;

    http.begin(client, serverUrl);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{\"rfid\":\"" + rfid + "\", \"apiKey\":\"" + apiKey + "\"}";

    Serial.print("Sending POST request with payload: ");
    Serial.println(jsonPayload);

    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("HTTP Response code: " + String(httpResponseCode));
      Serial.println("Response: " + response);
    } else {
      Serial.println("Error on sending POST: " + String(httpResponseCode));
    }

    http.end();
  } else {
    Serial.println("WiFi Disconnected. Cannot send data.");
  }
}
