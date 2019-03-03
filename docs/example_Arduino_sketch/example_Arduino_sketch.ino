// MMM-Serial-Navigator Arduino example sketch
// Author: lucullusTheOnly
// Date:   04th March 2019

// Wiring:
//    Rotary Encoder:
//      A --> Pin 2
//      B --> Pin 5
//      SW --> Pin 3
//    Button 1 --> 4
//      (other pin to ground)
//    Button 2 --> 6
//      (other pin to ground)

#include <Bounce2.h>

volatile boolean fired;
volatile boolean up;
volatile boolean sw_pressed;

volatile boolean sw_disabled=false;

#define LED 11

#define ROT_PINA 2
#define ROT_PINB 5
#define SW    3
#define INTERRUPT 0  // that is, pin 2
#define SW_INTERRUPT 1

#define BTN1 4
#define BTN2 6

#define REPEAT_INTERVAL 500

Bounce debouncer1 = Bounce();
unsigned long btn1_timestamp;

Bounce debouncer2 = Bounce();
unsigned long btn2_timestamp;

Bounce debouncer_sw = Bounce();
volatile unsigned long sw_timestamp;

// Interrupt Service Routine for a change to encoder pin A
void isr ()
{
 if (digitalRead (ROT_PINA))
   up = digitalRead (ROT_PINB);
 else
   up = !digitalRead (ROT_PINB);
 fired = true;
}  // end of isr

void sw_isr()
{
  sw_pressed = true;
  detachInterrupt(SW_INTERRUPT);
  sw_disabled = true;
  sw_timestamp = millis();
}

String inputString = "";         // a String to hold incoming data

void setup ()
{
  pinMode(BTN1, INPUT_PULLUP);
  debouncer1.attach(BTN1);
  debouncer1.interval(5);
  pinMode(BTN2, INPUT_PULLUP);
  debouncer2.attach(BTN2);
  debouncer2.interval(5);
  
  pinMode(ROT_PINA, INPUT_PULLUP);
  pinMode(ROT_PINB, INPUT_PULLUP);
  pinMode(SW, INPUT_PULLUP);
  debouncer_sw.attach(SW);
  debouncer_sw.interval(5);
  attachInterrupt (INTERRUPT, isr, CHANGE);
   
  Serial.begin (9600);
}  // end of setup

void loop ()
{
  // Update the Bounce instances :
  debouncer1.update();
  debouncer2.update();
  debouncer_sw.update();

  if( !debouncer1.read() && millis() - btn1_timestamp > REPEAT_INTERVAL ) {
    Serial.print("BTN1\n");
    btn1_timestamp = millis();
  }
  if( !debouncer2.read() && millis() - btn2_timestamp > REPEAT_INTERVAL ) {
    Serial.print("BTN2\n");
    btn2_timestamp = millis();
  }
  if( !debouncer_sw.read() && millis() - sw_timestamp > REPEAT_INTERVAL ) {
    Serial.print("SW\n");
    sw_timestamp = millis();
  }
  
  static long rotaryCount = 0;

  if (fired){
    if (up){
      rotaryCount++;
      if(rotaryCount%2 == 0) Serial.print("CW\n");
    } else {
      rotaryCount--;
      if(rotaryCount%2 == 0) Serial.print("CCW\n");
    }
    fired = false;
  }

}  // end of loop

void serialEvent() {
  while (Serial.available()) {
    // get the new byte:
    char inChar = (char)Serial.read();
    // add it to the inputString:
    if(inChar == '\r') continue;
    inputString += inChar;
    // if the incoming character is a newline, set a flag so the main loop can
    // do something about it:
    if (inChar == '\n') {
      inputString.trim();
      // Put your receiving code here
      /*if(inputString == "TOGGLE_LED"){
        digitalWrite(LED, !digitalRead(LED));
      }*/
      inputString = "";
    }
  }
}
