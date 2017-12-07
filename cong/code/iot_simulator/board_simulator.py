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
MQTT_CREDENTIALS = {"user_name": "admin",
                    "password": "bkcloud"}


class BoardSimulator:
    CONNECT_TIMEOUT = 1
    AUTHENTICATION_TIMEOUT = 0.5
    ARDUINO = 'ARDUINO'
    NODE_MCU = 'NODE_MCU'
    ESP = 'ESP'

    def __init__(self, name, mac_address, board_type, sensors=None):
        # client connection to mqtt broker
        self.name = name
        self.mqtt_client = mqtt.Client(
            mac_address,
            clean_session=True)
        # identifier of this board is it's MAC Address
        # self.mac_address = '00:A0:C9:14:C8:29'
        # # board_type: ESP, NODE_MCU
        # self.board_type = 'ESP'
        self.mac_address = mac_address
        self.board_type = board_type
        self.sensors = sensors
        # register topic
        self.send_authenticate_topic = 'bkcloud/newDevice'
        self.subcribe_topic = 'esp/' + "HN" + '/action'
        self.data_topic = 'esp/data'
        self.mqtt_client.username_pw_set(
            username=MQTT_CREDENTIALS['user_name'],
            password=MQTT_CREDENTIALS['password'])
        # register handler
        # self.mqtt_client.message_callback_add(self.subcribe_topic,
        #                                       self.handle_msg)
        self.mqtt_client.on_connect = self.on_connect_handler
        self.mqtt_client.on_publish = self.on_publish_handler
        self.mqtt_client.on_message = self.handle_msg
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
            self.mqtt_client.subscribe(self.subcribe_topic)
            # after connected with broker, authenticate with server by message
            # is_authenticated = self.authenticate_with_server()
            # return is_authenticated
            return True

    def on_connect_handler(self, client, user_data, flags, rc):
        if rc == 0:
            self.is_connected = True
        print("Connected flags ", str(flags), "result code ", str(rc))

    def authenticate_with_server(self):
        auth_info = {
            'location_id': "HN",
            'location_name': "Ha Noi",
            'type': "ESP8266",
            'deviceID': "team01",
            'sensors': [
                {'name': "DHT11-t", 'unit': "C"},
                {'name': "BH1750", 'unit': "%"},
            ]
        }
        # retry authenticate 3 times
        for k in range(0, 3):
            self.mqtt_client.publish('esp/newDevice', json.dumps(auth_info))
            time.sleep(BoardSimulator.AUTHENTICATION_TIMEOUT)
            if self.is_authenticated is True:
                break
        return self.is_authenticated

    def handle_msg(self, client, user_data, message):
        msg_data = json.loads(message.payload)
        if msg_data['type'] == 'register':
            authentication_result = msg_data['status']
            if authentication_result == 'OK':
                self.is_authenticated = True
        else:
            print("message received  ", str(message.payload))

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
