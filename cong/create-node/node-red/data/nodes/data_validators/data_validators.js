module.exports = function (RED) {
    function DataValidators(config) {
        RED.nodes.createNode(this, config);
        this.dataInput = config.dataInput;
        this.lightValidator = config.lightValidator;
        this.enableTempValidator = config.enableTempValidator;
        this.tempValidator = config.tempValidator;
        this.enableHumidityValidator = config.enableHumidityValidator;
        this.humidityValidator = config.humidityValidator;
        var node = this;
        // Retrieve the config node
        this.on("input", function (msg) {
            console.log(node.lightValidator);
            console.log(node.enableTempValidator);
            console.log(node.tempValidator);
            console.log(node.enableHumidityValidator);
            console.log(node.humidityValidator);
        });
    }
    RED.nodes.registerType("data-validators", DataValidators);
};