var credentials = require('./credentials.js');
var myGeotab = require('mg-api-node')(credentials.myGeotab.userName, credentials.myGeotab.password, credentials.myGeotab.database);

populateDevices();

function populateDevices() {
    api.call("Get", {
        typeName: "Device"
    }, function (devices) {
        console.log(devices);                

        //for today
        var fromDate = new Date();

        var calls = [];

        //robust request for all possible ports
        calls.push(["Get", {
            typeName: "StatusData",
            search: {
                deviceSearch: {
                    id: deviceId
                },
                diagnosticSearch: {
                    id: "DiagnosticOdometerId"
                },
                fromDate: fromDate
            }
        }]);

        calls.push(["Get", {
            typeName: "StatusData",
            search: {
                deviceSearch: {
                    id: deviceId
                },
                diagnosticSearch: {
                    id: "DiagnosticOBDOdometerReaderId"
                },
                fromDate: fromDate
            }
        }]);

        calls.push(["Get", {
            typeName: "StatusData",
            search: {
                deviceSearch: {
                    id: deviceId
                },
                diagnosticSearch: {
                    id: "DiagnosticJ1939TotalVehicleDistanceId"
                },
                fromDate: fromDate
            }
        }]);

        calls.push(["Get", {
            typeName: "StatusData",
            search: {
                deviceSearch: {
                    id: deviceId
                },
                diagnosticSearch: {
                    id: "DiagnosticJ1708TotalVehicleDistanceId"
                },
                fromDate: fromDate
            }
        }]);

        calls.push(["Get", {
            typeName: "StatusData",
            search: {
                deviceSearch: {
                    id: deviceId
                },
                diagnosticSearch: {
                    id: "DiagnosticOdometerAdjustmentId"
                },
                fromDate: fromDate
            }
        }]);

        // 
        api.multiCall(calls, function(result) {

            //group by deviceId, and choose the most recent reading
            console.log('result: ', result);

            if (result && result.length == 5) {

                var merged = result[0].concat(result[1]).concat(result[2]).concat(result[3]).concat(result[4]);
                var sorted = merged.sort(function (a, b) {
                    return new Date(a.dateTime) - new Date(b.dateTime);
                });
      if (sorted && sorted.length > 0) {
        var currentOdometer = sorted[0].data;
                    //append to object, returned as meters and needs to be converted to miles
      }
            } else {
                alert("Could not retrieve the current odometer value");
            }
        }, function(error) {
            alert(error);
        });
    }, function (error) {
        alert(error);
    });
}

Date.prototype.mmddyyyy = function() {
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth()+1).toString();
    var dd  = this.getDate().toString();
    return (mm[1]?mm:"0"+mm[0]) + "/" + (dd[1]?dd:"0"+dd[0]) + "/" + yyyy;
}