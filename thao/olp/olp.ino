//#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <WiFiManager.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <Servo.h>
#include <DallasTemperature.h>
#include <Wire.h>
#include <BH1750.h>
#include <Arduino.h>
#include "RTClib.h"
#include "SH1106.h"

#if defined(ARDUINO_ARCH_SAMD)
// for Zero, output on USB Serial console, remove line below if using programming port to program the Zero!
   #define Serial SerialUSB
#endif
RTC_Millis rtc;

SH1106  display(0x3c, 4, 5);

OneWire ds(2);
DallasTemperature DS18B20(&ds);

BH1750 lightMeter;
const char* default_mqtt_server = "192.168.7.108";
const char* default_mqtt_port = "1883";

char mqtt_server[255];
char mqtt_port[6];

const char* topic_pub="bkcloud/data";
const char* topic_status="bkcloud/sensorState";
const char* topic_sub="";
const char* topic_new="bkcloud/newDevice";
const char* macAdd="";
unsigned long previousMillis1 = 0;
unsigned long previousMillis2 = 0;
unsigned long previousMillis3 = 0;

const long intervalSendData = 5000;
long intervalsendMove = 4000;
const long intervalDisplayData = 10000;
uint16_t light;
boolean isRegister=false;
boolean flagMove=true;
WiFiClient espClient;

PubSubClient client(espClient);

char dataMessage[500];
int movePin = 10;   //using digital pin10 as input
int ledPin = 12;

#define SERVO_PIN 0
Servo myservo1;


bool Pin_Status = LOW;
bool PIR_State = LOW; //LOW = no motion, HIGH = motion

void callback(char* topic, byte* payload, unsigned int length) {
  // handle message arrived
  Serial.println(topic_sub);
  Serial.println(topic_sub);
  Serial.println("Message coming");

  if(strcmp(topic,topic_sub)==0){

      payload[length] = '\0';
      char payload_string[200];
      strncpy(payload_string, (char*)payload,sizeof(payload_string));
      Serial.println(payload_string);
      StaticJsonBuffer<200> jsonBuffer;

      JsonObject& root = jsonBuffer.parseObject(payload_string);
      Serial.println(payload_string);
      const char* type = root["type"];

      const char* action = root["action"];

      if(strcmp(type,"register")==0){
        Serial.println("Register");
        const char* status1 = root["status"];
        if(strcmp(status1,"OK")==0){
          isRegister=true;
          Serial.println("Register Success");
        }
      }

      if(strcmp(type,"servoAction")==0){
        Serial.println(type);
        if(strcmp(action,"ON")==0){
          Serial.println(action);
          servoRun();

        }
      }

      if(strcmp(type,"ledAction")==0){
        Serial.println("led");
        Serial.println(action);
        if(strcmp(action,"ON")==0){
          digitalWrite(ledPin,HIGH);
        }else{
          digitalWrite(ledPin,LOW);
        }
      }
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP8266Client-";
    clientId += String(random(0xffff), HEX);
    // Attempt to connect
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
      char* message = "Retained";
      int length = strlen(message);
      boolean retained = true;
      client.publish(topic_pub,"1");
      Serial.println(WiFi.macAddress());
//      String mac=WiFi.macAddress();
//      String topic_sub_string="bkcloud/"+mac+"/action";
//      topic_sub=topic_sub_string.c_str();
      client.subscribe(topic_sub);
      Serial.println(topic_sub);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void servoRun(){
  Serial.println("runServo");
  int pos=0;
  for ( pos = 90; pos <= 180; pos += 5) {
    myservo1.write(pos);uint32_t unixxtime;
    myservo1.write(0);
    delay(100);
  }
  for ( pos = 180; pos >= 90; pos -= 5) {
    myservo1.write(pos);
    delay(100);
  }
//   myservo1.write(90);
}

void setup() {
    Serial.begin(115200);
    display.init();
    rtc.begin(DateTime(F(__DATE__), F(__TIME__)));
    display.flipScreenVertically();
    display.setFont(ArialMT_Plain_24);
    DS18B20.begin();
    pinMode(2, INPUT_PULLUP);
    WiFiManager wifiManager;
    WiFiManagerParameter custom_mqtt_server("server", "mqtt server", default_mqtt_server, 40);
    WiFiManagerParameter custom_mqtt_port("port", "mqtt port", default_mqtt_port, 6);
    wifiManager.addParameter(&custom_mqtt_server);
    wifiManager.addParameter(&custom_mqtt_port);

    pinMode(movePin, INPUT);  //input declaration
    pinMode(ledPin, OUTPUT);
    myservo1.attach(SERVO_PIN);
//    wifiManager.resetSettings();//  xóa cmt
    if (!wifiManager.autoConnect("THAO_ESP")) {
      Serial.println("failed to connect, we should reset as see if it connects");
      delay(3000);
      ESP.reset();
      delay(5000);
    }
    lightMeter.begin();

    Serial.println("connected...yeey :)");
    strcpy(mqtt_server, custom_mqtt_server.getValue());
    strcpy(mqtt_port, custom_mqtt_port.getValue());
    Serial.println(mqtt_server);
    Serial.println(mqtt_port);

      Serial.println(topic_sub);
    client.setServer(mqtt_server, atoi(mqtt_port));
//    client.setServer(default_mqtt_server, 1883);
    client.setCallback(callback);
}


void loop() {

  String mac=WiFi.macAddress();
  String topic_sub_string="bkcloud/"+mac+"/action";
  topic_sub=topic_sub_string.c_str();
   if (!client.connected()) {
      reconnect();
    }

  client.loop();
  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis1 >= intervalSendData) {
    previousMillis1 = currentMillis;
    if(isRegister==true){
      sendData();
    }

  }
  if (currentMillis - previousMillis2 >= intervalDisplayData) {
    previousMillis2 = currentMillis;
    if(isRegister==false){
      Serial.println("sendRegister");
      sendRegister();
    }
    displayData();
    sendStateSensor();
  }
  int isMove = digitalRead(movePin);

  if(isMove==1 && isRegister==true && flagMove==true){
    sendMove();
    flagMove=false;
    previousMillis3 = currentMillis;
  }
  if (currentMillis - previousMillis3 >= intervalsendMove) {
      previousMillis3 = currentMillis;
      flagMove=true;
   }

}

void sendRegister(){
  StaticJsonBuffer<300> jsonBuffer;
  JsonObject& root = jsonBuffer.createObject();
  root["macAddr"] = WiFi.macAddress();
  root["type"] = "ESP8266";

  JsonArray& sensors = root.createNestedArray("sensors");

  StaticJsonBuffer<100> jsonBuffer1;
  JsonObject& temperature = jsonBuffer1.createObject();
  temperature["name"] = "DHT11-t";
  temperature["unit"] = "C";

  StaticJsonBuffer<100> jsonBuffer2;
  JsonObject& chuyendong = jsonBuffer2.createObject();
  chuyendong["name"] = "HC-SR501";
  chuyendong["unit"] = "";

  StaticJsonBuffer<100> jsonBuffer3;
  JsonObject& light = jsonBuffer2.createObject();
  light["name"] = "BH1750";
  light["unit"] = "Lux";

  sensors.add(temperature);
  sensors.add(chuyendong);
  sensors.add(light);

  char newMessage[200];
  root.printTo(newMessage, sizeof(newMessage));// Chuyen tu json sang String de pub
  Serial.println(newMessage);
  client.publish(topic_new,newMessage);
}

void displayData(){
    Serial.println(digitalRead(ledPin));
    display.clear();
    float temperature = getTemperature();
    display.drawString(0, 0, (String)temperature);
    display.display();
}

void sendStateSensor(){
  Serial.println("sendStateSendor");
  StaticJsonBuffer<200> jsonBuffer;
  JsonObject& root = jsonBuffer.createObject();
  root["macAddr"] = WiFi.macAddress();
  JsonArray& sensorsState = root.createNestedArray("sensorsState");

  StaticJsonBuffer<100> jsonBuffer1;
  JsonObject& servo = jsonBuffer1.createObject();
  servo["name"] = "Servo";
  servo["state"] = digitalRead(SERVO_PIN);

  StaticJsonBuffer<100> jsonBuffer2;
  JsonObject& led = jsonBuffer2.createObject();
  led["name"] = "Led";
  led["state"] = digitalRead(ledPin);

  sensorsState.add(servo);
  sensorsState.add(led);

  char dataMessage[300];
  root.printTo(dataMessage, sizeof(dataMessage));// Chuyen tu json sang String de pub
  client.publish(topic_status,dataMessage);
}

void sendMove(){
  Serial.println("sendMove");
  StaticJsonBuffer<200> jsonBuffer;
  JsonObject& root = jsonBuffer.createObject();
  root["macAddr"] = WiFi.macAddress();
  root["type"] = "motion";
  root["name"] = "HC-SR501";
  char dataMessage[200];
  root.printTo(dataMessage, sizeof(dataMessage));// Chuyen tu json sang String de pub
  client.publish(topic_pub,dataMessage);
}

void sendData(){
  DateTime now = rtc.now();
  Serial.println(now.unixtime());
  StaticJsonBuffer<500> jsonBuffer;
  JsonObject& root = jsonBuffer.createObject();
  root["macAddr"] = WiFi.macAddress();
  root["type"] = "data";
  root["time"] = now.unixtime();
  JsonArray& sensorsData = root.createNestedArray("sensorsData");

  StaticJsonBuffer<100> jsonBuffer1;
  JsonObject& temperature = jsonBuffer1.createObject();
  temperature["name"] = "DHT11-t";
  if(isnan(getTemperature())){
    temperature["value"]="nan";
  }else{
    temperature["value"] = getTemperature();
  }
//  temperature["value"] = random(200, 500) / 10.0;
  temperature["unit"] = "C";


  StaticJsonBuffer<100> jsonBuffer3;
  JsonObject& light = jsonBuffer3.createObject();
  light["name"] = "BH1750";
  light["value"] = random(200, 5000) / 10.0;

  light["unit"] = "Lux";

  sensorsData.add(temperature);
  sensorsData.add(light);

  char dataMessage[300];
  root.printTo(dataMessage, sizeof(dataMessage));// Chuyen tu json sang String de pub
  client.publish(topic_pub,dataMessage);
}

float getLight(){
  return lightMeter.readLightLevel() ;
}


//Hàm đọc nhiệt độ  ds18b20
float getTemperature(){
  float temperature;
  do{
    DS18B20.requestTemperatures();
    temperature = DS18B20.getTempCByIndex(0);
    delay(200);
    return temperature;
  }while(temperature == 85.0);
}
