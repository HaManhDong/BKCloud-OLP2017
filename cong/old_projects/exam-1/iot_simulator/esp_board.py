import paho.mqtt.client as mqtt  # import the client1
import time
import json
import uuid
from datetime import datetime
from random import randint
from board_simulator import BoardSimulator

QOS1 = 1
QOS2 = 1
CLEAN_SESSION = True
MQTT_CREDENTIALS = {"user_name": "admin",
                    "password": "bkcloud"}

if __name__ == "__main__":
    esp_simulator = BoardSimulator(name="board_4",
                                   mac_address='00:A0:C9:14:C8:29',
                                   board_type=BoardSimulator.ESP)
    esp_simulator.sensors = [
        {'id': 'light_1', 'type': 'LIGHT'},
        {'id': 'light_2', 'type': 'LIGHT'},
        {'id': 'humidity_1', 'type': 'HUMIDITY'},
        {'id': 'temperature_3', 'type': 'TEMPERATURE'},
        {'id': 'led_1', 'type': 'LED'},
        {'id': 'led_2', 'type': 'LED'},
        {'id': 'led_3', 'type': 'LED'},

    ]
    is_connected = esp_simulator.connect(host='127.0.0.1', port=1883)
    if is_connected is True:
        is_authenticated = esp_simulator.authenticate_with_server()

    if is_authenticated is True:
        print(is_authenticated)
        pass
        for i in range(1,50):
            # publish message to MQTT broker
            base_temperature = 0
            # temperature mid range: 30, range 5-40
            base_humidity = 0
            # humidity mid range: 50, range 20 -100
            base_light = 0
            # light mid range: 500, range 0 -1000

            sensor_data = [
                {  # temp data
                    'name': 'DHT11-t',
                    'value': 5,
                },
                {  # humidity data
                    'name': 'DHT11-h',
                    'value': 30,
                },
                {  # light data
                    'name': 'BH1750',
                    'value': 600,
                },
                {  # temperature data
                    'name': 'HC-SR501',
                    'value': True,
                },
            ]
            publish_data = {
                'macAddr': "5C:3B:1A:16:2A",
                'sensorsData': sensor_data
            }
            # for sensor_data in publish_data:
            #     sensor_data['mac_addr'] = esp_simulator.mac_address
            #     sensor_data['timestamp'] = int(time.mktime(datetime.now().timetuple())) * pow(10, 3)
            esp_simulator.publish_data("icse/data", publish_data)
            time.sleep(3)
        esp_simulator.mqtt_client.loop_stop()
        esp_simulator.mqtt_client.disconnect()
    else:
        pass



# CREATE TABLE IF NOT EXISTS device (
#     macAddr varchar(30) NOT NULL,
#     type varchar(10) NOT NULL,
#     status varchar(50) NOT NULL,
#     created_at varchar(50) NOT NULL,
#     PRIMARY KEY (macAddr)
# );
#
# CREATE TABLE IF NOT EXISTS sensor (
#     name varchar(30) NOT NULL,
#     macAddr varchar(30) NOT NULL,
#     unit varchar(10),
#     status varchar(50) NOT NULL,
#     created_at varchar(50) NOT NULL,
#     PRIMARY KEY (name,macAddr),
#     FOREIGN KEY (macAddr) REFERENCES device(macAddr) ON DELETE CASCADE
# );
