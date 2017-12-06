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
broker = "127.0.0.1"
MQTT_CREDENTIALS = {"user_name": "admin",
                    "password": "bkcloud"}

if __name__ == "__main__":
    try:
        esp_simulator = BoardSimulator(name="board_4",
                                       mac_address='00:A0:C9:14:C8:27',
                                       board_type=BoardSimulator.ESP,
                                       clean_session=CLEAN_SESSION)
        is_connected = esp_simulator.connect(host='127.0.0.1', port=1883)
        if is_connected is True:
            is_authenticated = esp_simulator.authenticate_with_server()

        if is_authenticated is True:
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
                        'sensorID': '4',
                        'value': 1324323,
                        'unit': 'lux'
                    },
                    {  # humidity data
                        'sensorID': 2,
                        'value': 14,
                        'unit': '%'
                    },
                    {  # temperature data
                        'sensorID': '3',
                        'value': 13,
                        'unit': 'C'
                    },
                ]
                # for sensor_data in publish_data:
                #     sensor_data['macAddr'] = esp_simulator.mac_address
                #     esp_simulator.publish_data("icse/data", sensor_data)
                offline_msg = {
                    'macAddr':esp_simulator.mac_address,
                    'status':'OFFLINE'
                }
                esp_simulator.publish_data("icse/deviceStatus", offline_msg)
                time.sleep(1)
            esp_simulator.mqtt_client.loop_stop()
            esp_simulator.mqtt_client.disconnect()
        else:
            pass
    except Exception as e:
        print(e)
