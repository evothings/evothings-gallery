//
// Copyright 2014, Aaron Ardiri
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #define DEBUG 1

// arduino - car control (BLE)

// library: ble 
#include <SPI.h>
#include <boards.h>
#include <ble_shield.h>
#include <services.h>

// library: scheduler (multi-tasking)
#include <SchedulerARMAVR.h>

#define STEER_PIN 2           // digital out for steer servo
#define DRIVE_PIN 3           // digital out for drive servo

// #define DELAY_THRESHOLD 12 // exactly 20ms
   #define DELAY_THRESHOLD 15 // can be some delay between thread switches

// normal: 1000 - 1500 - 2000
#define STEER_MIN       1200  // right
#define STEER_CENTER    1500  // center
#define STEER_MAX       1800  // left
#define STEER_DELAY     (20-DELAY_THRESHOLD)

#define DRIVE_MIN       1000  // forward
#define DRIVE_CENTER    1500  // still
#define DRIVE_MAX       2000  // reverse
#define DRIVE_DELAY     (20-DELAY_THRESHOLD)

int val_steer;                // steer servo value
int val_drive;                // drive servo value
int idx_buffer;               // index of received data from BLE
signed char buffer[2];        // command buffer from BLE

void setup()
{  
#ifdef DEBUG
  Serial.begin(9600);
#endif

  // initialize our parameters  
  val_steer  = STEER_CENTER;
  val_drive  = DRIVE_CENTER;
  idx_buffer = 0;
  
  // initialize ble
  ble_begin();
  ble_set_name("carcontrol");
  
  // configure our output pins
  pinMode(STEER_PIN, OUTPUT);
  pinMode(DRIVE_PIN, OUTPUT);
  
  // configure the steering and driving threads
  Scheduler.startLoop(loopSteer);
  Scheduler.startLoop(loopDrive);
}

void loop()
{
  // receive input from BLE (we expect three bytes: -128, x, y values)
  if (ble_available()) 
  {
    signed char c = (signed char)ble_read();
    
    // when we find out sentinal; reset the index
    if (c == -128) idx_buffer = 0;
    else           buffer[idx_buffer++] = c;
  }
  
  // have we received enough data?
  if (idx_buffer == 2)
  {
#ifdef DEBUG
    Serial.println();
#endif

    // read input for steer (-127 .. 127)
    signed char cs = buffer[0];
    if (cs < 0) 
      val_steer = STEER_CENTER + (int)(cs * ((float)(STEER_CENTER - STEER_MIN) / 127));
    else
      val_steer = STEER_CENTER + (int)(cs * ((float)(STEER_MAX - STEER_CENTER) / 127));

    // read input for drive (-127 .. 127)
    signed char cd = buffer[1];
    if (cd < 0) 
      val_drive = DRIVE_CENTER + (int)(cd * ((float)(DRIVE_CENTER - DRIVE_MIN) / 127));
    else        
      val_drive = DRIVE_CENTER + (int)(cd * ((float)(DRIVE_MAX - DRIVE_CENTER) / 127));

    // reset our index
    idx_buffer = 0;

#ifdef DEBUG
    // some debugging information on what was received    
    Serial.print("ble data received: ");
    Serial.print(cs); Serial.print(" "); Serial.print(cd); 
#endif
  } 
    
  // process BLE events
  ble_do_events();
  
  // let other threads have time to do something
  yield();
}

void loopSteer()
{
  // set the pin HIGH for duration required; then LOW and wait 20ms
  digitalWrite(STEER_PIN, HIGH);
  delayMicroseconds(val_steer);
  digitalWrite(STEER_PIN, LOW);
  delay(STEER_DELAY);
  
  // let other threads have time to do something
  yield();
}

void loopDrive()
{
  // set the pin HIGH for duration required; then LOW and wait 20ms
  digitalWrite(DRIVE_PIN, HIGH);
  delayMicroseconds(val_drive);
  digitalWrite(DRIVE_PIN, LOW);
  delay(DRIVE_DELAY);

  // let other threads have time to do something
  yield();
}


