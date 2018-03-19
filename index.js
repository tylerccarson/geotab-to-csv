var express = require('express');
var app = express();
let port = process.env.PORT || 3000;

var bodyParser = require('body-parser');
var db = require('./database/index.js');
var googleDrive = require('./helpers/google-drive-helpers.js');
var fs = require('fs');
var path = require('path');
var writeCSV = require('./helpers/writeCSV.js');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/auth/myGeotab', (req, res) => {

  var geotabUser = req.body.user;
  var geotabPassword = req.body.password;
  var geotabDatabase = req.body.database;
  var myGeotab = require('mg-api-node')(geotabUser, geotabPassword, geotabDatabase);

  myGeotab.authenticate((err, user) => {

    if(err){
      console.log(err);
      res.sendStatus(403);

    } else {
      res.send('Success logging in!');
    }
  });
});

app.post('/feed/subscribe', (req, res) => {

  var email = req.body.email;
  var database = req.body.database.toLowerCase();
  var user = req.body.user;
  var password = req.body.password;
  var folderId, fileId;

  return db.Fleet.findOne({
    where: {name: database}

  }).then(data => {

    if (data === null) {

      googleDrive.createDatabaseFolder(database, (folder) => {

        //not receiving folder from callback here
        folderId = folder.id;

        //create first database file
        writeCSV(user, password, database, (err) => {
          if (err) {
            throw err;
          }

          //upload to Google Drive
          googleDrive.uploadDatabaseFile(folderId, database, (file) => {
            console.log(file);
            fileId = file.id;

            //register into DB
            return db.Fleet.create({
              name: database,
              user: user,
              password: password,
              folder: folderId,
              file: fileId

            }).then(fleet => { // this is currently redundant code, see comments below.

                googleDrive.shareFolder(folderId, email, (err, perm) => {
                  if (err) {
                    throw err;
                  }

                  res.send('Folder shared! Check your inbox and add to your Google Drive.');

                });
            })
          });
        });          
      });       

    } else {
      console.log('Database already registered');
      folderId = data.folder;
      fileId = data.file;
      return data;
    }

  }).then(fleet => {

    //this is a bug, won't evaluate when it's the first time first for a DB and thus doesn't get shared on first click. So, it responds with a 503 timeout unfortunately. Need to fix the bug to evaluate in the right order.
    console.log('Fleet: ', fleet.dataValues);

    googleDrive.shareFolder(folderId, email, (err, perm) => {
      if (err) {
        throw err;
      }

      res.send('Folder shared! Check your inbox and add to your Google Drive.');

    });

  }).catch(err => {
    console.log(err);
    res.send(err);
  });
   
});

app.listen(port, () => {
  console.log('Listening on port ' + port + '...');
});