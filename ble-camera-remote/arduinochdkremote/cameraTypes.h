#ifndef cameraTypes_h
#define cameraTypes_h

enum cameraMode_t {
  zoomMode 
};

enum zoomCommand_t {
 zoomInOneStep, 
 zoomOutOneStep,
 shoot,
 zoomCompletelyIn,
 zoomCompletelyOut,
};

typedef struct {
 int pin;
 cameraMode_t mode; 
} camera_t;

#endif

