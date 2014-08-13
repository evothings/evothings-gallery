// Arduino code for example Arduino BLE Remote Shutter.
// Evothings AB, 2014, Andreas Lundquist

#include <SPI.h>
#include <boards.h>
#include <RBL_nRF8001.h>
#include <services.h> 
#include "cameraTypes.h"

camera_t camera;

void setup() {

  // Setup Camera
  initCamera(&camera, 3, zoomMode);

  // Setup serial  
  Serial.begin(9600);

  // Setup BLE Sheild
  ble_set_name("RemoteShut");
  ble_begin();

  Serial.println("Setup completed");
}

void loop() {

  // Empty RX buffer. 
  while(ble_available())
  {
    byte commandReceived = ble_read();
    
    // Print commandReceived to serial port. 
    Serial.print("Received command: ");
    Serial.println(commandReceived);
    
    switch(camera.mode) {
    case zoomMode:
      performZoomCommand((enum zoomCommand_t) commandReceived, &camera);
      break;
    }
  }
  // Allow BLE Shield to send/receive data
  ble_do_events();
}


// This function initiates a given camera_t struct and corresponding pins. 
void initCamera(camera_t *camera, int pin, cameraMode_t mode) {

  camera->pin = pin;
  camera->mode = mode; 

  // Configure Arduino board
  pinMode(camera->pin, OUTPUT);
}

void performZoomCommand(enum zoomCommand_t command, camera_t *camera) {

  const int addToDelayMs = 20;

  // Output according to http://chdk.wikia.com/wiki/USB_Remote#Zoom. 

  for (int i = 1; i <= command; i++) {
    digitalWrite(camera->pin, HIGH);
    delay(100 + addToDelayMs);
    digitalWrite(camera->pin, LOW);
    delay(50 + addToDelayMs);
  }
  
  delay(500 + addToDelayMs);
}







