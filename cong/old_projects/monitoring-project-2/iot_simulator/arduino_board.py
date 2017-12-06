import paho.mqtt.client as mqtt  # import the client1
import time
import json
import time
import uuid
from datetime import datetime
from random import randint
from .board_simulator import BoardSimulator
if __name__ == "__main__":
    try:
        arduino_simulator = BoardSimulator(name="arduino_board",
                                           mac_address='00:A0:C9:14:C8:29',
                                           board_type=BoardSimulator.ARDUINO,
                                           clean_session=CLEAN_SESSION)
        is_connected = arduino_simulator.connect(host='127.0.0.1', port=1883)
        if is_connected is True:
            is_authenticated = arduino_simulator.authenticate_with_server()
        if is_authenticated is True:
            # publish message to MQTT broker
            base_temperature = 5
            # temperature mid range: 30, range 5-40
            base_humidity = 20
            # humidity mid range: 50, range 20 -100
            base_light = 0
            # light mid range: 500, range 0 -1000

            for i in range(1, 20000):
                sensor_data = {
                    'light_data': {
                        'value': base_light + randint(600, 1000),
                        'unit': 'lux'
                    },
                    'humidity_data': {
                        'value': base_humidity + randint(0, 80),
                        'unit': 'percent'
                    },
                    'temperature_data': {
                        'value': base_temperature + randint(0, 35),
                        'unit': 'celsius'
                    },
                }
                board_data = {
                    'mac_address': arduino_simulator.mac_address,
                    'time_stamp': int(round(time.time() * 1000)),
                    'time_precision': 'millisecond',
                    'author': "HMC"
                }
                publish_data = {
                    'board_data': board_data,
                    'sensor_data': sensor_data
                }
                arduino_simulator.publish_data("icse/data", publish_data)
                time.sleep(0.5)
                arduino_simulator.loop_stop()
                arduino_simulator.disconnect()
        else:
            pass
    except Exception as e:
        print(e)
