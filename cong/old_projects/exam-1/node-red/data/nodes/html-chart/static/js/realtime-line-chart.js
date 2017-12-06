// import d3.js before import this file.
// Chart Object used for draw realtime Chart

var RealtimeLine = function (id, color, timeSerieData) {
    this.id = id;
    this.color = color;
    this.timeSerieData = timeSerieData;
    this.svgElement = null;
    this.chartTimeRange = 60;
    this.selected = true;
};

var RealtimeLineChart = function (selector) {
    this.selector = selector;
    this.unit = '';
    this.lines = [];
    this.setFormat();
    this.updateTimeInterval = 1000;

};

var genRandomColor = function () {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

var color_diff_percent = function (cwith, ccolor) {

    if (!cwith && !ccolor) return;

    var _cwith = (cwith.charAt(0) == "#") ? cwith.substring(1, 7) : cwith;
    var _ccolor = (ccolor.charAt(0) == "#") ? ccolor.substring(1, 7) : ccolor;

    var _r = parseInt(_cwith.substring(0, 2), 16);
    var _g = parseInt(_cwith.substring(2, 4), 16);
    var _b = parseInt(_cwith.substring(4, 6), 16);

    var __r = parseInt(_ccolor.substring(0, 2), 16);
    var __g = parseInt(_ccolor.substring(2, 4), 16);
    var __b = parseInt(_ccolor.substring(4, 6), 16);

    var p1 = (_r / 255) * 100;
    var p2 = (_g / 255) * 100;
    var p3 = (_b / 255) * 100;

    var perc1 = Math.round((p1 + p2 + p3) / 3);

    p1 = (__r / 255) * 100;
    p2 = (__g / 255) * 100;
    p3 = (__b / 255) * 100;

    var perc2 = Math.round((p1 + p2 + p3) / 3);

    return Math.abs(perc1 - perc2);
};

RealtimeLineChart.prototype.genLineColor = function () {
    let duplicateLineColor = true;
    let newLineColor = '';
    while (duplicateLineColor == true) {
        newLineColor = genRandomColor();
        duplicateLineColor = false;
        for (let i = 0; i < this.lines.length; i++) {
            // if (this.lines[i].color == newLineColor) {
            //     duplicateLineColor = true;
            // }
            if (color_diff_percent(this.lines[i].color, newLineColor) < 5) {
                duplicateLineColor = true;
            }
            if (color_diff_percent("#ECF0F5", newLineColor) < 25) {
                duplicateLineColor = true;
            }

        }
    }
    return newLineColor;
};

RealtimeLineChart.prototype.initChart = function () {
    var self = this;
    return new Promise((resolve, reject) => {
        this.getInitChartData().then(function (initData) {
            self.unit = initData.dataUnit;
            var parseTimestamp = d3.time.format("%Y-%m-%dT%H:%M:%S.%LZ").parse;
            for (let i = 0; i < initData.linesInitData.length; i++) {
                let lineInitData = initData.linesInitData[i];
                let newLineColor = self.genLineColor();
                for (let i = 0; i < lineInitData.timeSerieData.length; i++) {
                    timeSerieData = lineInitData.timeSerieData[i];
                    // timeSerieData.timestampObj = parseTimestamp(timeSerieData.timestamp);
                    timeSerieData.timestampObj = new Date(timeSerieData.timestamp);
                    // console.log(timeSerieData);
                }
                let newLine = new RealtimeLine(lineInitData.id, newLineColor, lineInitData.timeSerieData);
                self.lines.push(newLine);
            }
            // console.log(self.lines);
            self.drawChart();
            self.updator = setInterval(function () {
                self.updateChart();
            }, self.updateTimeInterval);
        });
        resolve("done");
    });
};

RealtimeLineChart.prototype.setFormat = function () {
    this.chart_format = {};
    var self = this,
        format = this.chart_format;
    format.margin = {
        top: 30,
        right: 20,
        bottom: 30,
        left: 50,

    };
    format.width = 900 - format.margin.left - format.margin.right;
    format.height = 400 - format.margin.top - format.margin.bottom;
    // Set the ranges
    self.create_x_fn = d3.time.scale().range([0, format.width]);
    self.create_y_fn = d3.scale.linear().range([format.height, 0]);
    self.drawSvgLineFn = d3.svg.line()
        .interpolate("cardinal-open")
        // .interpolate("linear")                 
        // .interpolate("cardinal")
        .x(function (d) {
            return self.create_x_fn(d.timestampObj);
        })
        .y(function (d) {
            return self.create_y_fn(d.value);
        });
    // Define the axes create function
    self.create_xAxis_fn = d3.svg.axis().scale(self.create_x_fn)
        .orient("bottom").ticks(d3.time.seconds, 10).tickFormat(d3.time.format("%H:%M:%S"));
    self.create_yAxis_fn = d3.svg.axis().scale(self.create_y_fn)
        .orient("left").ticks(15);
};


RealtimeLineChart.prototype.updateChart = function () {
    var self = this;
    $.when(this.getLastestData())
        .done(function (lastestData) {
            let changeLines = self.updateLine(lastestData);
            //remove old lines
            self.removeOldLines(changeLines.removeLineIds);
            // re-scale domain and re-draw Axis
            self.scale_domain_range();
            self.xAxis.call(self.create_xAxis_fn);
            self.yAxis.call(self.create_yAxis_fn);
            // update non-changed lines svg
            let changeLineIds = [];
            for (let i = 0; i < changeLines.removeLineIds.length; i++) {
                changeLineIds.push(changeLines.removeLineIds[i]);
            }
            for (let i = 0; i < changeLines.newLineIds.length; i++) {
                changeLineIds.push(changeLines.newLineIds[i]);
            }
            for (let i = 0; i < self.lines.length; i++) {
                let isChanged = false;
                for (let j = 0; j < changeLineIds.length; j++) {
                    if (self.lines[i].id == changeLineIds[j]) {
                        isChanged = true;
                    }
                }
                if (isChanged == false) {
                    // update non-changed line svg
                    self.lines[i].svgElement.attr('d', self.drawSvgLineFn(self.lines[i].timeSerieData));

                }
            }
            // draw new Lines
            self.drawNewLines(changeLines.newLineIds);
            // if line list has been changed, redraw legend container
            if (changeLineIds.length > 0) {
                self.reDrawLineLegends();
            }

        })
        .fail(function (jqXHR, error, errorThrown) {
            horizon.alert('error', gettext('Can not receive container list !. Reason : ' +
                jqXHR.responseJSON.reason));
            clearInterval(self.timer);
        });
};
RealtimeLineChart.prototype.updateLine = function (lastestData) {
    let self = this;
    let lineListChange = false;
    let newLineIds = [];
    let removeLineIds = [];
    let lastestDataList = lastestData.lastestDataList;
    // console.log(new Date());
    // console.log(lastestData);
    for (let i = 0; i < lastestDataList.length; i++) {
        let lineData = lastestDataList[i];
        let isExist = false;
        for (let j = 0; j < self.lines.length; j++) {
            // console.log(lineData.id + " : " + self.lines[j].id);
            if (lineData.id == self.lines[j].id) {
                // console.log("hit: " + lineData.id + " : " + self.lines[j].id);
                isExist = true;
                let lineTimeSerieData = self.lines[j].timeSerieData;
                let lastOldTimeSeriesElement =
                    lineTimeSerieData[lineTimeSerieData.length - 1];
                for (let k = 0; k < lineData.timeSerieData.length; k++) {
                    lineData.timeSerieData[k].timestampObj = new Date(lineData.timeSerieData[k].timestamp);
                    // console.log(lineData.id + " - " + lineData.timeSerieData[k].timestampObj + " - " + lastOldTimeSeriesElement.timestampObj);
                    if (lineData.timeSerieData[k].timestampObj > lastOldTimeSeriesElement.timestampObj) {
                        // console.log(lineData.id + " push new time: " + lineData.timeSerieData[k].timestampObj);
                        lineTimeSerieData.push(lineData.timeSerieData[k]);
                    }
                }
            }
        }
        if (isExist == false) {
            // we have new line
            lineListChange = true;
            // console.log(lineData);
            let newLineColor = self.genLineColor();
            for (let i = 0; i < lineData.timeSerieData.length; i++) {
                timeSerieData = lineData.timeSerieData[i];
                timeSerieData.timestampObj = new Date(timeSerieData.timestamp);
            }
            let newLine = new RealtimeLine(lineData.id, newLineColor, lineData.timeSerieData);
            self.lines.push(newLine);
            newLineIds.push(newLine.id);
        }
    }
    for (let i = 0; i < self.lines.length; i++) {
        let lineTimeSerieData = self.lines[i].timeSerieData;
        let currentTime = new Date();
        let limitEndTime = new Date(currentTime.getTime() - 60000);
        // console.log("limit time: " + limitEndTime);
        // remove old data
        for (let k = 0; k < lineTimeSerieData.length; k++) {
            let timeSerieSlice = lineTimeSerieData[k];
            if (timeSerieSlice.timestampObj < limitEndTime) {
                lineTimeSerieData.splice(k, 1);
                k = k - 1;
            }
        }
    }

    for (let i = 0; i < self.lines.length; i++) {
        // console.log(self.lines[i].id + ": " + self.lines[i].timeSerieData.length);
        if (self.lines[i].timeSerieData.length == 0) {
            removeLineIds.push(self.lines[i].id);
        } else {
            let lineTimeSerieData = self.lines[i].timeSerieData;
            lineTimeSerieData.sort(function (a, b) {
                return a.timestampObj > b.timestampObj;
            });
        }
    }
    return {
        removeLineIds: removeLineIds,
        newLineIds: newLineIds,
    };
};
RealtimeLineChart.prototype.drawChart = function () {
    var self = this;
    self.scale_domain_range();
    self.drawBodyAndAxis();
    self.drawLines();
    self.drawLineLegends();
};

RealtimeLineChart.prototype.drawBodyAndAxis = function () {
    var self = this;
    self.svg_element = d3.select($(self.selector).get(0))
        .append("svg")
        .attr("width", self.chart_format.width + self.chart_format.margin.left +
            self.chart_format.margin.right)
        .attr("height", self.chart_format.height + self.chart_format.margin.top +
            self.chart_format.margin.bottom);
    self.containerElement = self.svg_element.append("g")
        .attr("transform",
            "translate(" + self.chart_format.margin.left + "," +
            self.chart_format.margin.top + ")");
    // Add the X Axis
    self.xAxis = self.containerElement.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + self.chart_format.height + ")")
        .call(self.create_xAxis_fn);

    // Add the Y Axis
    self.yAxis = self.containerElement.append("g")
        .attr("class", "y axis")
        .call(self.create_yAxis_fn);
    //Add yAxis unit
    self.yAxis
        .append("text")
        // .attr("transform", "rotate(-90)")
        .attr("transform", "rotate(0)")
        .attr("x", 25)
        .attr("y", -8)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(self.unit);
};

RealtimeLineChart.prototype.drawLines = function () {
    var self = this;
    for (let i = 0; i < self.lines.length; i++) {
        var line = self.lines[i];
        self.drawLine(line);
    }
};
RealtimeLineChart.prototype.drawLine = function (line) {
    var self = this;
    var newSvgLine = self.containerElement.append("path")
        .attr("class", "line")
        .attr('stroke', line.color)
        .attr("d", self.drawSvgLineFn(line.timeSerieData));
    // console.log(newSvgLine);
    line.svgElement = newSvgLine;
};

RealtimeLineChart.prototype.drawNewLines = function (newLineIds) {
    let self = this;
    for (let i = 0; i < newLineIds.length; i++) {
        let newLineId = newLineIds[i];
        for (let j = 0; j < self.lines.length; j++) {
            if (self.lines[j].id == newLineId) {
                self.drawLine(self.lines[j]);
                break;
            }
        }
    }
};

RealtimeLineChart.prototype.reDrawLineLegends = function () {
    var self = this;
    self.legends.legendContainerElement.remove();
    self.legends.svgElement.remove();
    self.drawLineLegends();
};

RealtimeLineChart.prototype.drawLineLegends = function () {
    let self = this;
    //create legend_container
    let legendElement = $(self.selector).parent().find('.chart-legend');
    // let legendElement = $(self.selector);    
    // console.log(legendElement);
    let svgLegendElement = d3.select(legendElement.get(0))
        .append("svg")
        .attr("width", 150)
        .attr("height", self.chart_format.height + self.chart_format.margin.top +
            self.chart_format.margin.bottom);
    let legendContainerElement = svgLegendElement.append("g")
        .attr("transform",
            "translate(5,5)");
    // console.log(legendContainerElement);
    self.legends = {
        svgElement: svgLegendElement,
        legendContainerElement: legendContainerElement,
    };

    // create line legends
    for (let i = 0; i < self.lines.length; i++) {
        var line = self.lines[i];
        // find best legend index for this line;
        let newSvgLineLegend = self.legends.legendContainerElement.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(0, " + (i + 1) * 50 + ")");
        newSvgLineLegend.append("rect")
            .attr("x", 0)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", line.color);
        // console.log(line.color);
        newSvgLineLegend.append("text")
            .attr("x", 23)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .text(line.id);
        newSvgLineLegend.hoverRect = newSvgLineLegend.append("rect")
            .attr("y", -9)
            .attr("x", -5)
            .attr("width", 150)
            .attr("height", 36)
            .style("fill", "none");
        $(newSvgLineLegend[0][0])
            .attr('data-id', line.id)
            .on('mouseover', function () {
                newSvgLineLegend.hoverRect
                    .style("fill", "gray")
                    .style("opacity", 0.4); // set the element opacity;
                console.log($(this).data('id'));
                for (let i = 0; i < self.lines.length; i++) {
                    if (self.lines[i].id !== $(this).data("id")) {
                        self.lines[i].svgElement.attr("opacity", "0.05");
                    }
                }
            })
            .on("mouseout", function () {
                newSvgLineLegend.hoverRect.style("fill", "none");
                for (let i = 0; i < self.lines.length; i++) {
                    if (self.lines[i].id !== $(this).data("id")) {
                        self.lines[i].svgElement.attr("opacity", "1");
                    }
                }
            });
    }
};

RealtimeLineChart.prototype.scale_domain_range = function () {
    var self = this;
    let scaleData = self.data;
    var combineData = [];
    for (let i = 0; i < self.lines.length; i++) {
        let line = self.lines[i];
        for (let j = 0; j < line.timeSerieData.length; j++) {
            combineData.push(line.timeSerieData[j]);
        }
    }
    this.create_x_fn.domain([
        d3.min(combineData, function (d) {
            return d.timestampObj;
        }),
        d3.max(combineData, function (d) {
            return d.timestampObj;
        })
    ]);
    this.create_y_fn.domain([
        0,
        d3.max(combineData, function (d) {
            return d.value;
        }) * 1.25
    ]);
};

RealtimeLineChart.prototype.removeOldLines = function (oldLineIds) {
    let self = this;
    for (let i = 0; i < oldLineIds.length; i++) {
        let oldLineId = oldLineIds[i];
        for (let j = 0; j < self.lines.length; j++) {
            if (self.lines[j].id == oldLineId) {
                self.lines[j].svgElement.remove();
                self.lines.splice(j, 1);
                break;
            }
        }
    }
};

RealtimeLineChart.prototype.getInitChartData = function () {
    var self = this;
    let initDataUrl = $(self.selector).data('init-data-url');
    let initDataOpt = $(self.selector).data('init-data-option');
    initDataUrl = initDataUrl + "?" + initDataOpt;
    return new Promise((resolve, reject) => {
        $.ajax({
                url: initDataUrl,
            })
            .done(function (data) {
                resolve(data);
            });
    });

};

RealtimeLineChart.prototype.getLastestData = function () {
    var self = this;
    let lastestDataUrl = $(self.selector).data('lastest-data-url');
    let lastestDataOpt = $(self.selector).data('lastest-data-option');
    lastestDataUrl = lastestDataUrl + "?" + lastestDataOpt;
    // console.log(lastestDataUrl);
    return new Promise((resolve, reject) => {
        $.ajax({
                url: lastestDataUrl,
            })
            .done(function (data) {
                resolve(data);
            });
    });

};

RealtimeLineChart.prototype.destroy = function () {
    var self = this;
    self.svg_element.remove();
    self.legends.legendContainerElement.remove();
    self.legends.svgElement.remove();
    clearInterval(self.updator);
};