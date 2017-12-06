import paho.mqtt.client as mqtt  # import the client1
import time
import json
import time
from datetime import datetime
from random import randint

QOS1 = 1
QOS2 = 1
CLEAN_SESSION = True
broker = "127.0.0.1"
MQTT_CREDENTIALS = {"user_name": "admin",
                    "password": "bkcloud"}
CONNECT_TIMEOUT = 1


class MqttSyncClient(mqtt.Client):
    def __init__(self, name, clean_session):
        mqtt.Client.__init__(self, name, clean_session=clean_session)
        self.username_pw_set(username=MQTT_CREDENTIALS['user_name'],
                             password=MQTT_CREDENTIALS['password'])
        self.on_message = self.on_message_handler
        self.on_connect = self.on_connect_handler
        self.on_publish = self.on_publish_handler
        self.on_disconnect = self.on_disconnect_handler
        self.is_connected = False

    def connect(self, host, port=1883, keepalive=60, bind_address=""):
        print("connecting to ", host)
        super(MqttSyncClient, self).connect(host)
        client.loop_start()
        time.sleep(CONNECT_TIMEOUT)
        if self.is_connected:
            print("Successful to connect to server " + host)
            return True
        else:
            print("Failed to connect to server " + host)
            return False

    def on_connect_handler(self, client, userdata, flags, rc):
        if rc == 0:
            self.is_connected = True
        print("Connected flags ", str(flags), "result code ", str(rc))

    @staticmethod
    def on_message_handler(client, userdata, message):
        print("message received  ", str(message.payload.decode("utf-8")))

    @staticmethod
    def on_publish_handler(client, userdata, mid):
        pass
        # print("message published ", str(message.payload.decode("utf-8")))

    @staticmethod
    def on_disconnect_handler(client, userdata, flags, rc=0):
        m = "DisConnected flags" + "result code " + str(rc)
        print(m)


# for i in range(1, 6):
#     print(time.time())
#     print(int(round(time.time() * 1000)))
#     print(time.mktime(datetime.now().timetuple()))
#     print('---')
#     time.sleep(1)

if __name__ == "__main__":
    try:
        client = MqttSyncClient("iot_device_simulator",
                                clean_session=CLEAN_SESSION)
        connect_rs = client.connect(host='127.0.0.1', port=1883)
        if connect_rs is True:
            # publish message to MQTT broker
            base_temperature = 5
            # temperature mid range: 30, range 5-40
            base_humidity = 20
            # humidity mid range: 50, range 20 -100
            base_light = 0
            # light mid range: 500, range 0 -1000

            for i in range(1, 20000):

                sensor1_publish_data = {
                    'data': {
                        'temperature': base_temperature + randint(0, 35),
                        'humidity': base_humidity + randint(0, 80),
                        'light': base_light + randint(100, 300),
                    },
                    'time_stamp': int(round(time.time() * 1000)),
                    'time_precision': 'millisecond',
                    'sender_sensor': 'sensor1',
                    'author':"HMC"
                }

                ret = client.publish("iot/sensor", json.dumps(sensor1_publish_data))

                sensor2_publish_data = {
                    'data': {
                        'temperature': base_temperature + randint(0, 35),
                        'humidity': base_humidity + randint(0, 80),
                        'light': base_light + randint(300, 600),
                    },
                    'time_stamp': int(round(time.time() * 1000)),
                    'time_precision': 'millisecond',
                    'sender_sensor': 'sensor2',
                    'author':"HMC"
                }
                ret = client.publish("iot/sensor", json.dumps(sensor2_publish_data))

                sensor3_publish_data = {
                    'data': {
                        'temperature': base_temperature + randint(0, 35),
                        'humidity': base_humidity + randint(0, 80),
                        'light': base_light + randint(600, 1000),
                    },
                    'time_stamp': int(round(time.time() * 1000)),
                    'time_precision': 'millisecond',
                    'sender_sensor': 'sensor3',
                    'author':"HMC"
                }
                ret = client.publish("iot/sensor", json.dumps(sensor3_publish_data))

                time.sleep(0.5)
            client.loop_stop()
            client.disconnect()
        else:
            pass
            # client1.on_disconnect=on_disconnect
    except Exception as e:
        print(e)