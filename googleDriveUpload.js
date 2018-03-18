var googleClientID, googleClientSecret, redirect_uri, geotabUserName, geotabPassword, geotabDatabase, refresh_token;

if (process.env.NODE_ENV === 'production') {

  googleClientID = process.env.GOOGLE_CLIENT_ID;
  googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  redirect_uri = process.env.REDIRECT_URI;
  refresh_token = process.env.REFRESH_TOKEN;

  geotabUserName = process.env.GEOTAB_USERNAME;
  geotabPassword = process.env.GEOTAB_PASSWORD;
  geotabDatabase = process.env.GEOTAB_DATABASE;

} else {

  var credentials = require('./credentials.js');

  googleClientID = credentials.google.client_id;
  googleClientSecret = credentials.google.client_secret;
  redirect_uri = credentials.google.redirect_uri;
  refresh_token = credentials.google.refresh_token;

  geotabUserName = credentials.myGeotab.userName;
  geotabPassword = credentials.myGeotab.password;
  geotabDatabase = credentials.myGeotab.database;

}

var myGeotab = require('mg-api-node')(geotabUserName, geotabPassword, geotabDatabase);
var json2csv = require('json2csv');
var fs = require('fs');

var {google} = require('googleapis');

var OAuth2 = google.auth.OAuth2;
var oauth2Client = new OAuth2(
  googleClientID,
  googleClientSecret,
  redirect_uri
);
oauth2Client.setCredentials({ refresh_token: refresh_token });

/**** for use when generating a new code: *********************************************************/

// var scopes = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'];
// var url = oauth2Client.generateAuthUrl({
//   access_type: 'offline',
//   scope: scopes
// });
// console.log('URL HERE -----------> ', url);

/**************************************************************************************************/

/* for use when generating a new refresh token from code(only works if it is a first authorization) */

// var code = '4/AAAVt7iLZ7xNNW7gPgN80vqLrfChvX8HC0ygCrWMlLM9BZxCE7-TTgJpS1HDmRdDVGuXwhXtzIRwAgyixcfacjg#';
// oauth2Client.getToken(code, function (err, tokens) {
//   // Now tokens contains an access_token and an optional refresh_token. Save them.
//   if (err) {
//     console.log(err);
//     return;
//   }
//   console.log('tokens: ', tokens);
// });

/***************************************************************************************************/

/** EXECUTABLE CODE  *******/

updateGoogleDrive();

/***************************/

function updateGoogleDrive() {

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
            DateRead: localDate,
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

          oauth2Client.refreshAccessToken(function(err, tokens) {
            // your access_token is now refreshed and stored in oauth2Client
            // store these new tokens in a safe place (e.g. database)

            var drive = google.drive({
              version: 'v3',
              auth: oauth2Client
            });

            var folderId = '1qccbM8sK-m06yBYY0wU9I_MJrjYGVNLJ';
            var fileId = '1f0E0C6dJfgY-LTqsPI7_rBhLanSpHdnX';

            var fileMetadata = {
              'name': 'geotabresult.csv',
              parents: [folderId]
            };

            var media = {
              mimeType: 'text/csv',
              body: fs.createReadStream('geotabresult.csv')
            };

            drive.files.update({
              fileId: fileId,
              media: media

            }, (err, file) => {
              if (err) {
                console.error(err);
              } else {
                console.log('File updated: ', file.data);
              }
            });

          });//refreshAccessToken

        });//outside fs.writefile callback scope

      });//outside multicall scope

    });//outside initial device call scope

  });//outside current auth scope

}

function getMiles(meters) {
  return meters * 0.000621371192;
}