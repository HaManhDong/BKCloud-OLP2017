module.exports = function (RED) {
    "use strict";
    var fs = require('fs');
    var staticServer = require( "./server" );    
    function HtmlChartNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;
        staticServer.init( RED,'/realtime-chart/static/' );
        
        this.on("input", function (msg) {
            console.log(__dirname);
            console.log(__dirname);
            console.log(__dirname);
            console.log(__dirname);            
            console.log(__dirname);
            fs.readFile(__dirname + '/templates/chart-index.html',"utf8", function (err, data) {
                // console.log(data);
                msg.payload = data;
                node.send(msg);
            });
        });
    }
    RED.nodes.registerType("chart-template", HtmlChartNode);

};