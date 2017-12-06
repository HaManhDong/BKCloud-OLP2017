var sensors_chart = [];

$('#line-chart').on('click', function () {
    $('#content-header-text').text('Lines chart');
    $('#sensor-data-chart-container').css('display', '');
    $('.bkcloud-datatables-info-container').css('display', 'none');
    disableDashboardTab();

    let ctx = document.getElementById("realtime-line-chart").getContext("2d");

    let data = {
        labels: ["January", "February", "March", "April", "May", "June", "July"],
        datasets: [{
            label: "My First dataset",
            fillColor: "rgba(220,220,220,0.2)",
            strokeColor: "rgba(220,220,220,1)",
            pointColor: "rgba(220,220,220,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(220,220,220,1)",
            data: [65, 59, 80, 81, 56, 55, 40]
        }]
    };
    let options = {
        maintainAspectRatio: false,
        animation: false,
        //Boolean - If we want to override with a hard coded scale
        scaleOverride: true,
        //** Required if scaleOverride is true **
        //Number - The number of steps in a hard coded scale
        scaleSteps: 10,
        //Number - The value jump in the hard coded scale
        scaleStepWidth: 10,
        //Number - The scale starting value
        scaleStartValue: 0
    };


    if (realTimeCharts.length) {
        for (let i = 0; i < realTimeCharts.length; i++) {
            realTimeCharts[i].destroy();
        }
        $('#sensor-data-chart').empty();
        $('#sensor-legend-chart').empty();
    }
    if (devices.length) {
        $('#combobox-devices').css('display', "");
        $('#load-data-for-chart').css('display', "none");
        $('#chart-controller-device-input').select2({
            width: '100%',
            data: devices
        }).on("select2:select", function (e) {
            $(this).prop('disabled', true);
            let self = this;
            let macAddr = e.target.value;
            if (realTimeCharts.length) {
                for (let i = 0; i < realTimeCharts.length; i++) {
                    realTimeCharts[i].destroy();
                }
                $('#sensor-data-chart').empty();
                $('#sensor-legend-chart').empty();
            }
            ajaxQuery(SENSORS_OF_DEVICE + "?" + MAC_ADDR_PARAM + "=" + macAddr).then(
                function (data) {
                    if (data.length) {
                        sensors_chart = [];
                        $('#no-data-realtime').css("display", 'none');
                        for (let i = 0; i < data.length; i++) {
                            let sensor = data[i];
                            if (sensor.status === 'ONLINE' && sensor.unit) {
                                sensors_chart.push(
                                    {
                                        id: sensor.macAddr + "/" + sensor.name,
                                        text: sensor.name
                                    }
                                )
                            }
                        }
                        if (sensors_chart.length) {

                            $('#chart-controller-sensor-input').select2({
                                width: '100%',
                                data: sensors_chart
                            }).on("select2:select", function (e) {
                                $(this).prop('disabled', true);
                                let self = this;
                                let key = e.target.value;
                                let macAddr = key.split("/")[0];
                                let sensorName = key.split("/")[1];
                                ajaxQuery(SENSOR_INIT_DATA + "?" + MAC_ADDR_PARAM + "=" + macAddr +
                                    "&" + SENSOR_NAME_PARAM + "=" + sensorName).then(
                                    function (data) {
                                        console.log(data);
                                    },
                                    function (error) {
                                        alert('Can not get sensor data!');
                                        console.log(error);
                                    }
                                );
                                console.log(key);
                                setTimeout(function () {
                                    $(self).prop('disabled', false);
                                }, 1000);
                            });
                            $('#chart-controller-sensor-input').val(sensors_chart[0].id).trigger("select2:select");
                        } else {
                            $('#no-data-realtime').css("display", '');
                        }

                    } else {
                        $('#no-data-realtime').css("display", '');
                    }
                },
                function (error) {
                    alert('Can not get sensors of this device!');
                    console.log(error);
                }
            )
            setTimeout(function () {
                $(self).prop('disabled', false);
            }, 1000);
        })

        $('#chart-controller-device-input').val(devices[0].id).trigger("select2:select");


    } else {
        $('#combobox-devices').css('display', "none");
        $('#load-data-for-chart').css('display', "").text("Have no data!");
    }


    var myLineChart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });

    // setInterval(function () {
    //     setData(myLineChart);
    //     // setData(data.datasets[1].data);
    //     setLabels(myLineChart);
    //     myLineChart.update();
    // }, 2000);

    function setLabels(myLineChart) {
        let labels = myLineChart.data.labels;
        myLineChart.data.labels.push(nextMonthName);
        myLineChart.data.labels.shift();
    }

    function setData(myLineChart) {
        myLineChart.data.datasets[0].data.push(Math.floor(Math.random() * 100) + 1);
        myLineChart.data.datasets[0].data.shift();
    }


});