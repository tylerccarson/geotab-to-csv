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

var googleClientID, googleClientSecret, redirect_uri, geotabUserName, geotabPassword, geotabDatabase, refresh_token;

if (process.env.NODE_ENV === 'production') {

  googleClientID = process.env.GOOGLE_CLIENT_ID;
  googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  redirect_uri = process.env.REDIRECT_URI;
  refresh_token = process.env.REFRESH_TOKEN;

} else {

  var credentials = require('../credentials.js');

  googleClientID = credentials.google.client_id;
  googleClientSecret = credentials.google.client_secret;
  redirect_uri = credentials.google.redirect_uri;
  refresh_token = credentials.google.refresh_token;

}

var {google} = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var oauth2Client = new OAuth2(
  googleClientID,
  googleClientSecret,
  redirect_uri
);

oauth2Client.setCredentials({ refresh_token: refresh_token });

var drive = google.drive({
  version: 'v3',
  auth: oauth2Client
});

var fs = require('fs');
var path = require('path');

module.exports.createDatabaseFolder = function(database, callback) {

  oauth2Client.refreshAccessToken(function(err, tokens) {

    var rootFolderId = '1qccbM8sK-m06yBYY0wU9I_MJrjYGVNLJ';

    var fileMetadata = {
      'name': `${database}`,
      parents: [rootFolderId],
      'mimeType': 'application/vnd.google-apps.folder'
    };

    drive.files.create({
      resource: fileMetadata,
      fields: 'id'

    }, (err, file) => {
      if (err) {
        console.error(err);
      } else {
        console.log('Database folder created: ', file.data);
        callback(file.data);
      }
    });
  });
}

module.exports.uploadDatabaseFile = function(folderId, database, callback) {

  oauth2Client.refreshAccessToken(function(err, tokens) {

    var fileMetadata = {
      'name': `${database}.csv`,
      parents: [folderId]
    };

    var media = {
      mimeType: 'text/csv',
      body: fs.createReadStream(path.join(__dirname, `../csv-files/${database}.csv`))
    };

    drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'

    }, function (err, file) {
      if (err) {
        console.error(err);
      } else {
        console.log('File uploaded to Google Drive: ', file.data);
        callback(file.data);
      }
    });
  });
}

module.exports.updateDatabaseFile = function(fileId, database, callback) {

  oauth2Client.refreshAccessToken(function(err, tokens) {

    var media = {
      mimeType: 'text/csv',
      body: fs.createReadStream(path.join(__dirname, `../csv-files/${database}.csv`))
    };

    drive.files.update({
      fileId: fileId,
      media: media

    }, function (err, file) {
      if (err) {
        console.error(err, null);
      } else {
        console.log('File uploaded to Google Drive: ', file.data);
        callback(null, file.data);
      }
    });
  });
}

module.exports.shareFolder = function(folderId, email, callback) {

  oauth2Client.refreshAccessToken(function(err, tokens) {

    var body = {
      'type': 'user',
      'role': 'reader',
      'emailAddress': email
    };

    drive.permissions.create({
      resource: body, 
      fileId: folderId,
      fields: 'id'

    }, function(err, perm) {
      if (err) { 
        callback(err, null);
        console.error(err);
      } else {
        console.log('File shared with: ', perm.data)
        callback(null, perm.data);
      }
    });
  });
}