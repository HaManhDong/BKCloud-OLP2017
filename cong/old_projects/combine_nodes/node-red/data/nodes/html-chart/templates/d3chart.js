vm_chart = {
    charts: [],
    setup_line_chart: function (selector) {
        var self = this;
        $(selector).each(function () {
            var chart = this;
            var new_chart = new LineChart(chart);
            new_chart.create_chart(vm_chart);
        });
    },
    clear_chart_list: function () {
        this.charts.forEach(function (chart) {
            chart.destroy();
        });
        this.charts = [];
    }
};
formatTime = d3.time.format("%H:%M:%S");

function ContainerLine(line, color, legend_index, data, name) {
    this.color = color;
    this.line = line;
    this.legend_index = legend_index;
    this.data = data;
    this.name = name;
}

function LineChart(selector) {
    this.chart_selector = selector;
    this.containers = [];
    this.lines = [];
    this.container_colors = ["#5942f4", "#f46b42", "#6b486b", "#a05d56",
        "#98abc5", "#d0743c", "#ff8c00"
    ];
    this.legend_indexs = [0, 1, 2, 3, 4, 5, 6, 7];

    this.set_chart_format = function () {
        this.chart_format = {};
        var self = this,
            format = this.chart_format;
        format.margin = {
            top: 30,
            right: 20,
            bottom: 30,
            left: 50,
            width: 1000 - format.margin.left - format.margin.right,
            height: 500 - format.margin.top - format.margin.bottom
        };
        // Set the ranges
        self.create_x_fn = d3.time.scale().range([0, format.width]);
        self.create_y_fn = d3.scale.linear().range([format.height, 0]);
        self.usage_create_line_fn = d3.svg.line()
            .interpolate("cardinal")
            .x(function (d) {
                //console.log(self.create_x_fn(d.x));
                return self.create_x_fn(d.x);
            })
            .y(function (d) {
                return self.create_y_fn(d.y);
            });
        // Define the axes create function
        self.create_xAxis_fn = d3.svg.axis().scale(self.create_x_fn)
            .orient("bottom").ticks(5).tickFormat(d3.time.format("%H:%M:%Ss"));
        self.create_yAxis_fn = d3.svg.axis().scale(self.create_y_fn)
            .orient("left").ticks(20);
    };


    this.get_container_list = function () {
        var self = this;
        container_url_list = $(this.chart_selector).attr('data-container-list-url');
        return $.getJSON(container_url_list);
    };


    this.create_chart = function (chart_group) {
        this.set_chart_format();
        var self = this;
        self.get_vm_data_and_render_chart(chart_group);
    };

    this.get_vm_data_list = function () {
        var self = this;
        container_url_list = $(this.chart_selector).attr('data-vm-detail-url');
        return $.getJSON(container_url_list);
    };

    this.get_vm_data_and_render_chart = function (chart_group) {
        var self = this;
        $.when(this.get_vm_data_list())
            .done(function (vm_data) {
                console.log('data');
                console.log(vm_data);
                // containers_data = self.process_received_containers_data(arguments);
                var cpu_data = self.process_received_data(vm_data.cpu_data);
                cpu_data.name = "CPU";
                cpu_data.color = "#5942f4";
                cpu_data.legend_index = 0;

                var ram_data = self.process_received_data(vm_data.ram_data);
                ram_data.name = "RAM";
                ram_data.color = "#f46b42";
                ram_data.legend_index = 1;

                var vm_line_data = [cpu_data, ram_data];
                // console.log(vm_line_data);

                self.scale_domain_range(vm_line_data);

                //create chart_container (svg),x Axis, and y Axis
                // Adds the svg elements
                self.svg_element = d3.select($(self.chart_selector).get(0))
                    .append("svg")
                    .attr("width", self.chart_format.width + self.chart_format.margin.left +
                        self.chart_format.margin.right)
                    .attr("height", self.chart_format.height + self.chart_format.margin.top +
                        self.chart_format.margin.bottom);
                self.container_element = self.svg_element.append("g")
                    .attr("transform",
                        "translate(" + self.chart_format.margin.left + "," +
                        self.chart_format.margin.top + ")");
                // Add the X Axis
                self.xAxis = self.container_element.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + self.chart_format.height + ")")
                    .call(self.create_xAxis_fn);

                // Add the Y Axis
                self.yAxis = self.container_element.append("g")
                    .attr("class", "y axis")
                    .call(self.create_yAxis_fn);
                //Add yAxis unit
                self.yAxis
                    .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", ".71em")
                    .style("text-anchor", "end")
                    .text("%");


                //create legend_container
                var legend_elements = $(self.chart_selector).parent().find('.legend');
                self.svg_legend_element = d3.select(legend_elements.get(0))
                    .append("svg")
                    .attr("width", self.chart_format.width + self.chart_format.margin.left +
                        self.chart_format.margin.right)
                    .attr("height", 60);
                self.legend_container_element = self.svg_legend_element.append("g")
                    .attr("transform",
                        "translate(5,5)");

                //create container line and container legend 
                //and put them to legend_container and 
                //chart_container
                vm_line_data.forEach(function (data) {
                    self.create_resource_line(data);
                });

                //add chart to chart group and set timer for this chart
                chart_group.charts.push(self);
                // self.timer = setInterval(function () {
                //     self.update_charts();
                // }, 1000);
            })
            .fail(function (jqXHR, error, errorThrown) {
                horizon.alert('error', gettext('Can not receive container data !. Reason : ' +
                    jqXHR.responseJSON.reason));
            });
    };


    //process received data, extract content from server response, formating container data
    this.process_received_data = function (results) {
        results.value.forEach(function (d) {
            d.x = new Date(d.x);
            d.y = d.y;
        });
        return results;
    };

    // Scale the range of the vm_data with the dimension of chart
    this.scale_domain_range = function (vm_line_data) {
        var combine_vm_line_data = [];
        for (var i = 0; i < vm_line_data.length; i++) {
            combine_vm_line_data = combine_vm_line_data.concat(vm_line_data[i].value);
        }
        this.create_x_fn.domain([d3.min(combine_vm_line_data, function (d) {
            return d.x;
        }), d3.max(combine_vm_line_data, function (d) {
            return d.x;
        })]);
        this.create_y_fn.domain([0, d3.max(combine_vm_line_data, function (d) {
            return d.y;
        }) * 1.25]);
    };



    this.update_charts = function () {
        var self = this;
        $.when(this.get_vm_data_list())
            .done(function (vm_data) {
                var cpu_data = self.process_received_data(vm_data.cpu_data);
                cpu_data.name = "CPU";
                cpu_data.color = "#5942f4";
                cpu_data.legend_index = 0;

                var ram_data = self.process_received_data(vm_data.ram_data);
                ram_data.name = "RAM";
                ram_data.color = "#f46b42";
                ram_data.legend_index = 1;

                var vm_line_data = [cpu_data, ram_data];

                self.scale_domain_range(vm_line_data);

                //update xAxis and yAxis
                self.xAxis.call(self.create_xAxis_fn);
                self.yAxis.call(self.create_yAxis_fn);


                //update data for exist containers
                for (var i = 0; i < self.lines.length; i++) {
                    var resource_line = self.lines[i];
                    var new_vm_line_data = $.grep(vm_line_data, function (e) {
                        return e.name == resource_line.name;
                    })[0];
                    resource_line.line.attr('d', self.usage_create_line_fn(new_vm_line_data.value));
                    resource_line.data = new_vm_line_data.value;
                }

            })
            .fail(function (jqXHR, error, errorThrown) {
                horizon.alert('error', gettext('Can not receive container list !. Reason : ' +
                    jqXHR.responseJSON.reason));
                clearInterval(self.timer);
            });
    };


    this.create_resource_line = function (resource_data) {
        var self = this;
        var container_line = self.container_element.append("path")
            .attr("class", "line")
            .attr('stroke', resource_data.color)
            .attr("d", self.usage_create_line_fn(resource_data.value));
        var container_legend = self.legend_container_element.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(" +
                resource_data.legend_index * 150 + ",0)");

        container_line.legend = container_legend;
        container_legend.append("rect")
            .attr("x", 100 - 18)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", resource_data.color);
        var container_name = function () {
            d_names = resource_data.name;
            return d_names;
        };
        container_legend.append("text")
            .attr("x", 100 - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(container_name());
        self.lines.push(new ContainerLine(container_line,
            resource_data.color, resource_data.legend_index, resource_data.value, container_name()));
    };
    this.destroy = function () {
        clearInterval(this.timer);
        this.svg_legend_element.remove();
        this.svg_element.remove();
    };
}
// vm_chart.setup_line_chart('div[data-chart-type="vm_chart"]');