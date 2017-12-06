            if (node.enableHumidityValidator == true) {
                $("#humidity-validator-min").val(node.humidityValidator.min);
                $("#humidity-validator-max").val(node.humidityValidator.max);
                $("#humidity-validator-unit").val(node.humidityValidator.unit);
                $("#humidity-validator-row").show();
            } else {
                $("#humidity-validator-row").hide();
            }

            $("#node-input-enableHumidityValidator").change(function () {
                let isEnable = $("#node-input-enableHumidityValidator").is(":checked");
                if (isEnable) {
                    $("#humidity-validator-row").show();
                } else {
                    $("#humidity-validator-min").val(0);
                    $("#humidity-validator-max").val(0);
                    $("#humidity-validator-unit").val("C");
                    $("#humidity-validator-row").hide();
                }
            });