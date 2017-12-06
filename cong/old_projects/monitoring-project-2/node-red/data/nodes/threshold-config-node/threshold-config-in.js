module.exports = function (RED) {
    "use strict";
    var nodemailer = require('nodemailer');

    function ThresholdConfigIn(config) {
        RED.nodes.createNode(this, config);
        this.topic = config.topic;
        this.qos = 2;
        this.mqttBroker = config.mqttBroker;
        this.brokerConn = RED.nodes.getNode(this.mqttBroker);
        this.temperatureLimit = config.temperatureLimit;
        this.humidityLimit = config.humidityLimit;
        this.enableNotifyEmail = config.enableNotifyEmail;
        this.emailAddr = config.emailAddr;

        var node = this;
        node.agentEmailUsername = 'hmcsensor@gmail.com';
        node.agentEmailPassword = 'bkcloud@123';
        node.transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: node.agentEmailUsername, // Your email id
                pass: node.agentEmailPassword // Your password
            }
        });

        if (this.brokerConn) {
            this.status({
                fill: "red",
                shape: "ring",
                text: "disconnected"
            });
            node.brokerConn.register(this);
            this.brokerConn.subscribe(this.topic, this.qos, function (topic, payload, packet) {
                var controlData = {
                    led1: "OFF",
                    led2: "OFF"
                };
                var isSendEmail = false;
                var sendEmailData = [];
                var sensorData = JSON.parse(payload.toString());
                if (sensorData.tem > node.temperatureLimit) {
                    controlData.led1 = "ON";
                    if (node.enableNotifyEmail) {
                        isSendEmail = true;
                        sendEmailData.push({
                            sensorType: "temperature",
                            currentValue: sensorData.tem,
                            threshold: node.temperatureLimit
                        });
                    }
                }
                if (sensorData.humi > node.humidityLimit) {
                    controlData.led2 = "ON";
                    if (node.enableNotifyEmail) {
                        isSendEmail = true;
                        sendEmailData.push({
                            sensorType: "humidity",
                            currentValue: sensorData.humi,
                            threshold: node.humidityLimit
                        });
                    }
                }
                if (isSendEmail) {
                    var emailAddr = node.emailAddr;
                    var sendEmailContent = {
                        currentTime: new Date().toLocaleString(),
                        sensorData: sendEmailData
                    };
                    var mailOptions = {
                        from: node.agentEmailUsername, // sender address
                        to: node.emailAddr, // list of receivers
                        subject: 'sensor data warning', // Subject line
                        text: JSON.stringify(sendEmailContent)
                    };
                    node.transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            node.error(error);
                        } else {
                            node.log('Warning email sent to: ' + node.emailAddr + info.response);
                        }
                    });
                }
                var msgSensorData = {
                    payload: sensorData
                };

                var msgControlData = {
                    payload: JSON.stringify(controlData)
                };
                node.send([msgControlData, msgSensorData]);
            }, this.id);
            if (this.brokerConn.connected) {
                node.status({
                    fill: "green",
                    shape: "dot",
                    text: "node-red:common.status.connected"
                });
            }
            this.on('close', function (done) {
                if (node.brokerConn) {
                    node.brokerConn.unsubscribe(node.topic, node.id);
                    node.brokerConn.deregister(node, done);
                    node.log("Input node is closed!");
                }
            });
        } else {
            this.error(RED._("mqtt.errors.missing-config"));
        }
    }
    RED.nodes.registerType("threshold-config-in", ThresholdConfigIn);
};