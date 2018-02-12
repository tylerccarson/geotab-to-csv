const axios = require('axios');
const json2csv = require('json2csv');
const fs = require('fs');
const credentials = require('./credentials.js');
const myGeotab = require('mg-api-node')(credentials.userName, credentials.password, credentials.database);

myGeotab.authenticate((err, user) => {

  if(err){
    console.log('Error', err);
    return;
  }

  //get all device data
  myGeotab.call('Get', {
    typeName: 'Device'

  }, (err, devices) => {

    if(err){
      console.log('Error', err);
      return;
    }
    
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

    //execute multicall for status data
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

      //iterate devices again to reformate with requested fields
      console.log('# of devices: ', devices.length);
      devices = devices.map((device) => {

        let vehicleMilage = odmTable[device.id];

        //fields requested: 
        //'name' -> 'AssetName' (available from first request)
        //'VIN#' -> 'AssetNo' (available from first request)
        //timestamp -> 'DateRead'
        //deviceID-> 'MeterTitleName' or 'MeterTileNo'
        //odometer total milage -> 'ValueRead'

        return {
          AssetName: device.name,
          AssetNo: device.engineVehicleIdentificationNumber,
          DateRead: fromDate,
          //MeterTitleName: ,
          // is this supposed to be device id? Or something else?
          MeterTitleNo: device.id,
          ValueRead: vehicleMilage
        }
      });

      console.log('parsed devices: ', devices);      

      //parse JSON into a csv file with json2csv
      const csv = json2csv({data: devices});

      // write to csv
      fs.writeFile('geotabresults.csv', csv, (res, err) => {
        if (err) throw Error;

        // ******* here would plug in to google API to update a Google Sheet ****************************


      });

    });//outside multicall scope

  });//outside initial device call scope

});//outside current auth scope




function getMiles(meters) {
  return meters * 0.000621371192;
}