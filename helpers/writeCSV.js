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
      var fromDate = new Date();
      var calls = [];

      //iterate devices and assemble a multicall to retrieve odometer values
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

      myGeotab.multicall(calls, (err, statusData) => {
        if(err){
          console.log('Error', err);
          return;
        }

        //build a hashtable with a id => milage key value pair
        var odmTable = {};

        for (var i = 0; i < statusData.length; i++) {

          let deviceId = statusData[i][0].device.id;
          let miles = getMiles(statusData[i][0].data);
          odmTable[deviceId] = miles;

        }

        //populateOdmAndParseFields
        devices = devices.map((device) => {

          let vehicleMilage = odmTable[device.id];
          let localDate = fromDate.toLocaleString();

          // OBJECT VERSION FOR .CSV
          return {
            AssetName: device.name,
            AssetNo: device.engineVehicleIdentificationNumber,
            DateRead: localDate,
            MeterTitleNo: device.id,
            ValueRead: vehicleMilage
          }

        });

        //parse JSON into a csv file with json2csv
        const csv = json2csv({data: devices});

        // write to csv
        fs.writeFile(path.join(__dirname, `../csv-files/${database}/${database}.csv`), csv, (err) => {
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