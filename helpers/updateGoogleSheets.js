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
var {google} = require('googleapis');
var sheets = google.sheets('v4');
var OAuth2 = google.auth.OAuth2;
var oauth2Client = new OAuth2(
  googleClientID,
  googleClientSecret,
  redirect_uri
);
oauth2Client.setCredentials({ refresh_token: refresh_token });

/**** for use when generating a new code: *********************************************************/

// var scope = 'https://www.googleapis.com/auth/spreadsheets';
// var url = oauth2Client.generateAuthUrl({
//   access_type: 'offline',
//   scope: scope
// });
// console.log('URL HERE -----------> ', url);
// var code = '4/AAAMy6zqEgb9Y-wUEOEMO3K4gKHJQ6DeFt7hs36gVqg7GVyBaCxA8diLJKEvpgS-Va7u6iqmm4LA-4PAmWwUfxU#';

/**************************************************************************************************/

/* for use when generating a new refresh token from code(only works if it is a first authorization) */

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

updateGoogleSheets();

/***************************/

function updateGoogleSheets() {

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

          // ARRAY VERSION FOR GOOGLE SHEETS
          return [
            device.name,
            device.engineVehicleIdentificationNumber,
            localDate,
            device.id,
            vehicleMilage
          ]

        });

        //updateGoogleSheetsData
        oauth2Client.refreshAccessToken(function(err, tokens) {
          // your access_token is now refreshed and stored in oauth2Client
          // store these new tokens in a safe place (e.g. database)

          var number = devices.length + 1;
          var spreadsheetId = '1n2YPWcJNnLnEGw09SVY73vZj3fH8EbZuVhGaPRl0I8k';
          var range = `Sheet1!A2:E${number}`;
          var ValueRange = {
            range: range,
            majorDimension: 'ROWS',
            values: devices
          };

          //for this version, I'll actually make an array of arrays instead to pass as values to Google
          sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: range,
            valueInputOption: 'USER_ENTERED',
            resource: ValueRange,
            auth: oauth2Client

          }, (err, response) => {
            if (err) {
              console.error(err);
              return;
            }

            console.log('google spreadsheet updated');

          }); //close sheets API update scope

        }); //outside token refresh scope

      });//outside multicall scope

    });//outside initial device call scope

  });//outside current auth scope

}

function getMiles(meters) {
  return meters * 0.000621371192;
}