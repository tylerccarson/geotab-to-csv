var geotabUserName, geotabPassword, geotabDatabase, access_token;

if (process.env.NODE_ENV === 'production') {

  geotabUserName = process.env.GEOTAB_USERNAME;
  geotabPassword = process.env.GEOTAB_PASSWORD;
  geotabDatabase = process.env.GEOTAB_DATABASE;
  access_token = process.env.DROPBOX_ACCESS_TOKEN;

} else {

  var credentials = require('./credentials.js');

  geotabUserName = credentials.myGeotab.userName;
  geotabPassword = credentials.myGeotab.password;
  geotabDatabase = credentials.myGeotab.database;
  access_token = credentials.dropbox.access_token;

}

var myGeotab = require('mg-api-node')(geotabUserName, geotabPassword, geotabDatabase);
var json2csv = require('json2csv');
var fs = require('fs');

require('isomorphic-fetch');
var Dropbox = require('dropbox').Dropbox;
var dbx = new Dropbox({ accessToken: access_token });

/** EXECUTABLE CODE  *******/

writeCSV();

/***************************/

function writeCSV() {

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
            DateRead: fromDate,
            MeterTitleNo: device.id,
            ValueRead: vehicleMilage
          }

        });

        //parse JSON into a csv file with json2csv
        const csv = json2csv({data: devices});


        // write to csv
        fs.writeFile('geotabresult.csv', csv, (err) => {
          if (err) {
            console.log(err); 
            return;
          }

          fs.readFile('geotabresult.csv', (err, file) => {

            dbx.filesUpload({ path: '/geotabresult.csv', contents: file, mode: 'overwrite' })
              .then(res => {
                console.log(res);
              })
              .catch(err => {
                console.log(err);
              });

          });//outside fs.readFile callback scope

        });//outside fs.writefile callback scope

      });//outside multicall scope

    });//outside initial device call scope

  });//outside current auth scope

}

function getMiles(meters) {
  return meters * 0.000621371192;
}