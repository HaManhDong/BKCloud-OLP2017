module.exports = function (RED) {
    "use strict";
    var http = require("follow-redirects").http;
    var urllib = require("url");
    var requestPromise = require('request-promise');
    var Buffer = require('buffer').Buffer;
    function InputRealTimeDataNode(config) {
        RED.nodes.createNode(this, config);
        this.triggerMode = config.triggerMode;
        this.delaySecond = config.delaySecond;
        this.intervalSecond = config.intervalSecond;
        this.method = "GET";
        this.apiUrl = config.apiUrl;
        this.returnType = config.returnType;
        this.reqTimeout = 10000;
        this.enableAuth = config.enableAuth;
        this.authMode = config.authMode;
        this.basicAuthUserName = config.basicAuthUserName;
        this.basicAuthPassword = config.basicAuthPassword;
        this.tokenAuthLoginUrl = config.tokenAuthLoginUrl;
        this.tokenAuthUserName = config.tokenAuthUserName;
        this.tokenAuthPassword = config.tokenAuthPassword;
        this.token = { valid: false, data: null };
        var node = this;
        // use to trigger an message to container console log and debug log
        // node.error("Test Error");
        if (this.triggerMode == 'none') {
            this.delaySecond = this.delaySecond * 1000;
            setTimeout(function () { node.emit("input", {}); }, this.delaySecond);
        } else if (this.triggerMode == 'interval') {
            this.intervalSecond = this.intervalSecond * 1000;
            console.log(this.intervalSecond);
            if (RED.settings.verbose) { this.log("interval = " + this.intervalSecond.toString()); }
            this.interval_id = setInterval(function () { node.emit("input", {}); }, this.intervalSecond);
        }

        //input payload - a Javascript Object
        function sendMessage(payload) {
            if (node.returnType == "string") {
                payload = JSON.stringify(payload);
            } else if (node.returnType == "json") {
            }
            var msg = { payload: payload };
            node.send(msg);
        }
        function returnRequestError(errorMessage, statusCode) {
            node.error(errorMessage);
            if (statusCode) {
                node.error('return status code:' + statusCode);
            }
        }
        function makeNoAuthApiRequest(noAuthApiUrl) {
            var reqOptions = {
                method: 'GET',
                uri: noAuthApiUrl,
                json: true,
                resolveWithFullResponse: true
            };
            return requestPromise(reqOptions);
        }

        function getNoAuthApiData(noAuthApiUrl) {
            makeNoAuthApiRequest(noAuthApiUrl)
                .then(function (response) {
                    sendMessage(response.body);
                })
                .catch(function (errorResponse) {
                    node.error('Failed to get data from API. ');
                    returnRequestError(errorResponse.message, errorResponse.statusCode);
                });
        }

        function makeBasicAuthAPIRequest(basicAuthAPIUrl, username, password) {
            var auth_data = new Buffer(username + ":" + password).toString('base64');
            var reqOptions = {
                method: 'GET',
                uri: basicAuthAPIUrl,
                headers: { 'Authorization': 'Basic ' + auth_data },
                json: true,
                resolveWithFullResponse: true
            };
            return requestPromise(reqOptions);
        }
        function getBasicAuthApiData(basicAuthAPIUrl, username, password) {
            makeBasicAuthAPIRequest(basicAuthAPIUrl, username, password)
                .then(function (response) {
                    sendMessage(response.body);
                })
                .catch(function (errorResponse) {
                    node.error('Failed to get data from API. ');
                    returnRequestError(errorResponse.message, errorResponse.statusCode);
                });
        }

        function getTokenRequest(loginUrl, username, password) {
            var reqOptions = {
                method: 'POST',
                uri: loginUrl,
                // headers: {'Authorization': 'Basic ' + auth_data},
                form: { 'username': username, 'password': password },
                json: true,
                resolveWithFullResponse: true
            };
            return requestPromise(reqOptions);
        }

        function processGetTokenResp(response, token) {
            if (response.statusCode == 200 && response.body.status == 'success') {
                token.valid = true;
                token.data = response.body.token;
            }
        }

        function getApiDataRequest(apiUrl, token) {
            var reqOptions = {
                method: 'GET',
                uri: apiUrl,
                headers: { 'token': token.data },
                json: true,
                resolveWithFullResponse: true
            };
            return requestPromise(reqOptions);
        }

        function getTokenAuthAPIData(loginUrl, apiUrl, username, password, token) {
            // console.log(token);
            getApiDataRequest(apiUrl, token)
                .then(function (response) {
                    sendMessage(response.body);
                })
                .catch(function (errorResponse) {
                    if (errorResponse.statusCode && errorResponse.statusCode == 401) {
                        console.log('Token is expired. Renew token.');
                        getTokenRequest(loginUrl, username, password)
                            .then(function (response) {
                                processGetTokenResp(response, token);
                                getTokenAuthAPIData(loginUrl, apiUrl, username, password, token);
                            })
                            .catch(function (errorResponse) {
                                node.error('Failed to get token from API Server');
                                returnRequestError(errorResponse.message, errorResponse.statusCode);
                            });
                    } else {
                        node.error('Failed to get data from API Server');
                        returnRequestError(errorResponse.message, errorResponse.statusCode);
                    }
                });
        }
        node.on('input', function (msg) {
            var apiUrl = node.apiUrl;
            if ((apiUrl.indexOf("http://") != 0)) {
                apiUrl = "http://" + apiUrl;
            }
            var tokenAuthLoginUrl = node.tokenAuthLoginUrl;
            if ((tokenAuthLoginUrl.indexOf("http://") != 0)) {
                tokenAuthLoginUrl = "http://" + tokenAuthLoginUrl;
            }
            // 172.17.0.1:8050/weather/temperature - api if use docker container
            if (node.enableAuth == "true") {
                if (node.authMode == "basic") {
                    getBasicAuthApiData(apiUrl, node.basicAuthUserName, node.basicAuthPassword);
                } else if (node.authMode == "token") {
                    getTokenAuthAPIData(tokenAuthLoginUrl, apiUrl,
                        node.tokenAuthUserName, node.tokenAuthPassword, node.token);
                }
            } else if (node.enableAuth == "false") {
                getNoAuthApiData(apiUrl);
            }
        });
    }
    RED.nodes.registerType("real-time-data", InputRealTimeDataNode);

    InputRealTimeDataNode.prototype.close = function () {
        if (this.interval_id != null) {
            clearInterval(this.interval_id);
        }
    };

    RED.httpAdmin.post("/real-time-data/:id", function (req, res) {
        var node = RED.nodes.getNode(req.params.id);
        if (node != null) {
            try {
                node.receive();
                res.sendStatus(200);
            } catch (err) {
                res.sendStatus(500);
                node.error("Cannot process request for node " + node.toString());
            }
        } else {
            res.sendStatus(404);
        }
    });

};
