var express = require('express');
var app = express();
let port = process.env.PORT || 3000;

var bodyParser = require('body-parser');
var db = require('./database/index.js');
var googleDrive = require('./helpers/google-drive-helpers.js');
var fs = require('fs');
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
  var database = req.body.database;
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

        //create local folder
        fs.mkdir(`./csv-files/${database}`, (err) => {
          if (err && err.code !== 'EEXIST') {
            throw err;
          } 

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

              })

            });

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

    console.log('Fleet: ', fleet);

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