var json2csv = require('json2csv');
var fs = require('fs');
var path = require('path');

module.exports = function writeCSV(user, password, database, callback) {

  console.log('Running write .csv function for ', database);

  var myGeotab = require('mg-api-node')(user, password, database);

  myGeotab.authenticate((err, user) => {

    if(err){
      console.log('Error', err);
      return;
    }

    //getDevices
    myGeotab.call('Get', {
      typeName: 'Device'

    }, (err, devices) => {

      if(err){
        console.log('Error', err);
        return;
      }

      if (devices.length === 0) {
        console.log('Empty database');
        return;
      }
      
      //getDeviceOdms
      let fromDate = new Date();
      let calls = [];

      //GET OD
      for (var i = 0; i < devices.length; i++) {
        calls.push(['Get', {
          typeName: 'StatusData',
          search: {
            deviceSearch: {
              id: devices[i].id
            },
            diagnosticSearch: {
              id: 'DiagnosticOdometerAdjustmentId'
            },
            fromDate: fromDate
          }
        }]);      
      }

      //ENGINE HOURS
      for (var i = 0; i < devices.length; i++) {
        calls.push(['Get', {
          typeName: 'StatusData',
          search: {
            deviceSearch: {
              id: devices[i].id
            },
            diagnosticSearch: {
              id: 'DiagnosticEngineHoursAdjustmentId'
            },
            fromDate: fromDate
          }
        }]);      
      }

      myGeotab.multicall(calls, (err, statusData) => {
        if(err){
          console.log('Error', err);
          return;
        }

        //build a hashtable with a id => milage key value pair
        var odmTable = {};
        var engineHoursTable = {};

        for (var i = 0; i < statusData.length; i++) {

          let status = statusData[i][0];
          let deviceId = status.device.id;

          if (status.diagnostic.id === 'DiagnosticEngineHoursAdjustmentId' || status.diagnostic.id === 'DiagnosticEngineHoursId') {
            let engineHours = status.data;
            engineHoursTable[deviceId] = engineHours;

          } else if (status.diagnostic.id === 'DiagnosticOdometerAdjustmentId' || status.diagnostic.id === 'DiagnosticOdometerId') {
            let miles = getMiles(status.data);
            odmTable[deviceId] = miles;
          }
        }

        //populateOdmAndParseFields
        devices = devices.map((device, i) => {
          //console.log(i, device);
          let vehicleMilage = odmTable[device.id];
          let engineHours = engineHoursTable[device.id];
          let date = new Date();
          date = date.toLocaleDateString();
          let VIN = device.vehicleIdentificationNumber;

          let isSpecialQspaceValue = database === 'qspace' && (device.id === 'b5' || device.id === 'b7');
          let valueRead = isSpecialQspaceValue ? engineHours : vehicleMilage;
          let source = isSpecialQspaceValue ? 'Engine Hours' : 'Odometer';

          // OBJECT VERSION FOR .CSV
          return {
            AssetNo: device.name,
            AssetName: device.comment,
            CF_VIN: VIN,
            DateOnly: date,
            MeterTitleName: 'Odometer',
            MeterTitleNo: device.id,
            ValueRead: valueRead,
            Source: source
          }

        });

        //parse JSON into a csv file with json2csv
        const csv = json2csv({data: devices});

        // write to csv
        fs.writeFile(path.join(__dirname, `../csv-files/${database}.csv`), csv, (err) => {
          if (err) {
            console.log(err); 
            callback(err);
          }
          console.log('.csv file created for ', database);
          callback();

        });//outside fs.writefile callback scope

      });//outside multicall scope

    });//outside initial device call scope

  });//outside current auth scope

}

function getMiles(meters) {
  return meters * 0.000621371192;
}