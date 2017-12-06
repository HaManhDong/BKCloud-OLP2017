import paho.mqtt.client as mqtt  # import the client1
import time
import json
import time
from datetime import datetime
from random import randint
import uuid

QOS1 = 1
QOS2 = 1
CLEAN_SESSION = True
broker = "127.0.0.1"
MQTT_CREDENTIALS = {"user_name": "admin",
                    "password": "bkcloud"}


class BoardSimulator:
    CONNECT_TIMEOUT = 1
    AUTHENTICATION_TIMEOUT = 1
    ARDUINO = 'ARDUINO'
    NODE_MCU = 'NODE_MCU'

    def __init__(self, name, mac_address, board_type, clean_session):
        # client connection to mqtt broker
        self.name = name
        self.mqtt_client = mqtt.Client(mac_address,
                                       clean_session=clean_session)
        # identifier of this board is it's MAC Address
        # self.mac_address = '00:A0:C9:14:C8:29'
        # # board_type: ESP, NODE_MCU
        # self.board_type = 'ESP'
        self.mac_address = mac_address
        self.board_type = board_type
        # register topic
        self.send_authenticate_topic = '/icse/authenticate_board'
        self.receive_authenticate_topic = \
            self.mac_address + '/icse/authenticate_board'
        self.data_topic = 'icse/data'
        self.username_pw_set(username=MQTT_CREDENTIALS['user_name'],
                             password=MQTT_CREDENTIALS['password'])
        # register handler
        self.mqtt_client.message_callback_add(self.receive_authenticate_topic,
                                              self.on_authenticate_msg)
        self.mqtt_client.on_message = self.on_message_handler
        self.mqtt_client.on_connect = self.on_connect_handler
        self.mqtt_client.on_publish = self.on_publish_handler
        self.mqtt_client.on_disconnect = self.on_disconnect_handler
        # state properties
        self.is_connected = False
        self.is_authenticated = False

    def connect(self, host, port=1883):
        print("connecting to ", host)
        self.mqtt_client.connect(host, port=port)
        self.mqtt_client.loop_start()
        time.sleep(BoardSimulator.CONNECT_TIMEOUT)
        if self.is_connected is False:
            print("Failed to connect to broker " + host)
            return False
        else:
            print("Successful to connect to broker " + host)
            # after connected with broker, authenticate with server by message
            # is_authenticated = self.authenticate_with_server()
            # return is_authenticated
            return True

    def on_connect_handler(self, client, user_data, flags, rc):
        if rc == 0:
            self.is_connected = True
        print("Connected flags ", str(flags), "result code ", str(rc))

    def authenticate_with_server(self):
        self.mqtt_client.subscribe(self.receive_authenticate_topic)
        authentication_info = {
            'mac_address': self.mac_address,
            'board_type': self.board_type
        }
        # retry authenticate 3 times
        for k in range(0, 3):
            client.publish(
                self.send_authenticate_topic,
                json.dumps({authentication_info}))
            time.sleep(BoardSimulator.AUTHENTICATION_TIMEOUT)
            if self.is_authenticated is True:
                break
        self.mqtt_client.unsubscribe(self.receive_authenticate_topic)
        return self.is_authenticated

    def on_authenticate_msg(self, client, user_data, message):
        self.is_authenticated = True
        print('Current client is authenticated with server!')

    @staticmethod
    def on_message_handler(client, user_data, message):
        print("message received  ", str(message.payload.decode("utf-8")))

    @staticmethod
    def on_publish_handler(client, user_data, mid):
        pass

    @staticmethod
    def on_disconnect_handler(client, user_data, flags, rc=0):
        m = "DisConnected flags" + "result code " + str(rc)
        print(m)

    def publish_data(self, topic, message):
        self.mqtt_client.publish(topic,
                                 json.dumps(message))


if __name__ == "__main__":
    try:
        arduino_simulator = BoardSimulator(name="board_4",
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
