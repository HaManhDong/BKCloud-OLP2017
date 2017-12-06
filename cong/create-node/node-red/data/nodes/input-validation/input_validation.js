module.exports = function (RED) {
    function InputValidation(config) {
        RED.nodes.createNode(this, config);
        this.dataInput = config.dataInput;
        this.dataValidators = config.dataValidators;
        var node = this;
        // Retrieve the config node
        this.on("input", function (msg) {

        });
    }
    RED.nodes.registerType("input-validation", InputValidation);
};