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
    try:
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
        is_connected = esp_simulator.connect(host='127.0.0.1', port=1801)
        if is_connected is True:
            is_authenticated = esp_simulator.authenticate_with_server()

        if is_authenticated is True:
            print(is_authenticated)
            pass

            # publish message to MQTT broker
            base_temperature = 0
            # temperature mid range: 30, range 5-40
            base_humidity = 0
            # humidity mid range: 50, range 20 -100
            base_light = 0
            # light mid range: 500, range 0 -1000

            for i in range(1, 20000):
                publish_data = [
                    # {  # light data
                    #     'sensorID': 1,
                    #     'value': base_light + randint(0, 100000),
                    #     'unit': 'lux'
                    # },
                    # {  # sensor data
                    #     'sensorID': 2,
                    #     'value': base_humidity + randint(0, 200),
                    #     'unit': '%'
                    # },
                    # {  # humidity data
                    #     'sensorID': 3,
                    #     'value': base_temperature + randint(0, 300),
                    #     'unit': 'C'
                    # },

                    {  # light data
                        'sensor_id': 'light_1',
                        'value': 245,
                    },
                    {  # humidity data
                        'sensor_id': 'temperature_3',
                        'value': 30,
                    },
                    {  # temperature data
                        'sensor_id': 'light_2',
                        'value': 11233,
                    },
                    # {  # temperature data
                    #     'sensor_id': 'humidity_1',
                    #     'value': 43,
                    # },
                ]
                for sensor_data in publish_data:
                    sensor_data['mac_addr'] = esp_simulator.mac_address
                    sensor_data['timestamp'] = int(time.mktime(datetime.now().timetuple())) * pow(10, 3)
                    esp_simulator.publish_data("iot/data", sensor_data)

                time.sleep(1)
            esp_simulator.mqtt_client.loop_stop()
            esp_simulator.mqtt_client.disconnect()
        else:
            pass
    except Exception as e:
        print(e)
