let googleClientID, googleClientSecret, redirect_uri, geotabUserName, geotabPassword, geotabDatabase;

if (process.env.NODE_ENV === 'production') {

  googleClientID = process.env.GOOGLE_CLIENT_ID;
  googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  redirect_uri = process.env.REDIRECT_URI;
  geotabUserName = process.env.GEOTAB_USERNAME;
  geotabPassword = process.env.GEOTAB_PASSWORD;
  geotabDatabase = process.env.GEOTAB_DATABASE;

} else {

  var credentials = require('./credentials.js');

  googleClientID = credentials.google.client_id;
  googleClientSecret = credentials.google.client_secret;
  redirect_uri = credentials.google.redirect_uri;
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

/**** for use when generating a new code: *********************************************************/

// var scope = 'https://www.googleapis.com/auth/spreadsheets';
// var url = oauth2Client.generateAuthUrl({
//   access_type: 'offline',
//   scope: scope
// });
// console.log('URL HERE -----------> ', url);
// var code = '4/AAAMy6zqEgb9Y-wUEOEMO3K4gKHJQ6DeFt7hs36gVqg7GVyBaCxA8diLJKEvpgS-Va7u6iqmm4LA-4PAmWwUfxU#';

/**************************************************************************************************/

/* for use when generating a new access_token from code(and refresh token if first authorization) */

// oauth2Client.getToken(code, function (err, tokens) {
//   console.log('function called');
//   // Now tokens contains an access_token and an optional refresh_token. Save them.
//   if (err) {
//     console.log(err);
//     return;
//   }
//  
//   console.log('tokens: ', tokens);
//   oauth2Client.setCredentials(tokens);
// });

/***************************************************************************************************/

// Set refresh token and use to retrieve temporary access token:
var refresh_token = process.env.NODE_ENV === 'production' ? process.env.REFRESH_TOKEN : credentials.refresh_token;
oauth2Client.setCredentials({ refresh_token: refresh_token });
oauth2Client.refreshAccessToken(function(err, tokens) {
  // your access_token is now refreshed and stored in oauth2Client
  // store these new tokens in a safe place (e.g. database)

/** EXECUTABLE CODE  *******/
writeCSV();

//start interval to create a new .csv every 2 minutes
setInterval(writeCSV, 120000);

/***************************/

});



function writeCSV() {

  //if difference between expiry and current time is < 300000
  if (oauth2Client.credentials.expiry_date - Date.now() < 300000) {
    //refresh access token
    oauth2Client.refreshAccessToken(function(err, tokens) {
      //do something
      console.log('refereshing access token');
    });
  }


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
        devices = devices.map((device) => {

          let vehicleMilage = odmTable[device.id];
          let localDate = fromDate.toLocaleString();

          // OBJECT VERSION FOR .CSV
          // return {
          //   AssetName: device.name,
          //   AssetNo: device.engineVehicleIdentificationNumber,
          //   DateRead: fromDate,
          //   //MeterTitleName: ,
          //   // is this supposed to be device id? Or something else?
          //   MeterTitleNo: device.id,
          //   ValueRead: vehicleMilage
          // }

          // ARRAY VERSION FOR GOOGLE SHEETS
          return [
            device.name,
            device.engineVehicleIdentificationNumber,
            /*** do we want to reformat date to something more readable? Also, currently returns UTC zone ***/
            localDate,
            device.id,
            /**** Do we want to convert to miles, or leave in meters? Also,
                  Do we have any kind of confirmation these readings are changing? ***/
            vehicleMilage
          ]

        });

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

            // add in logic to refresh token if error has to do with expiration OR do so with every function call..

            console.error(err);
            return;
          }

          console.log('spreadsheet updated');

        });

        /*** KEEP IF WE SWITCH BACK TO .csv CONVERSION

        //parse JSON into a csv file with json2csv
        const csv = json2csv({data: devices});

        // write to csv
        fs.writeFile('geotabresults.csv', csv, (res, err) => {
        if (err) {
          console.log(err); 
          return;
        }

        });

        *****************/

      });//outside multicall scope

    });//outside initial device call scope

  });//outside current auth scope

}

function getMiles(meters) {
  return meters * 0.000621371192;
}