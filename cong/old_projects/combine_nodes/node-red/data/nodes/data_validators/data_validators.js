module.exports = function (RED) {
    function DataValidators(config) {
        RED.nodes.createNode(this, config);
        this.dataInput = config.dataInput;
        this.lightValidator = config.lightValidator;
        var node = this;
        // Retrieve the config node
        this.on("input", function (msg) {
            console.log(node.lightValidator);
        });
    }
    RED.nodes.registerType("data-validators", DataValidators);
};