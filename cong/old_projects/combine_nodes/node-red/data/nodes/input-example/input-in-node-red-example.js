module.exports = function (RED) {
    function InputExampleNode(config) {
        RED.nodes.createNode(this, config);
        this.hostAddress = RED.nodes.getNode(config.hostAddress);
        this.triggerMode = config.triggerMode;
        this.triggerDelay = config.triggerDelay;
        this.triggerInterval = config.triggerDelay;
        var node = this;
        node.on('input', function (msg) {
            // console.log('triggered!');
            // console.log(node.hostAddress);
            var sendMsg = {
                payload: {
                    triggerMode: node.triggerMode,
                    delaySecond: node.triggerDelay,
                    intervalSecond: node.triggerInterval,
                    hostIP: node.hostAddress.hostIP,
                    hostPort:node.hostAddress.hostPort
                }
            };
            node.send(sendMsg);
        });
        this.close = function () {
            console.log('Node closed!');
        };
    }
    RED.nodes.registerType("input-example", InputExampleNode);

    // InputExample.prototype.close = function () {
    //     console.log('closed!');
    // };
    function ExampleConfigNode(config){
        RED.nodes.createNode(this, config);
        this.hostIP = config.hostIP;
        this.hostPort = config.hostPort;
    }
    RED.nodes.registerType("example-config", ExampleConfigNode);

    RED.httpAdmin.post("/input-example/:id", function (req, res) {
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
