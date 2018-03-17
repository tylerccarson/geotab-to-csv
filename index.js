var express = require('express');
var app = express();
let port = process.env.PORT || 3000;

var bodyParser = require('body-parser');
var db = require('./database/index.js');

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

      // possibly add database and user info to DB at this point

      res.send('Success logging in!');
    }
  });
});

app.post('/feed/subscribe', (req, res) => {

  var email = req.body.email;
  var database = req.body.database;
  var user = req.body.user;
  var password = req.body.password;

  //if database is already registered
  db.Fleet.findOne({
    where: {name: database}

  }).then(database => {
    //retrieve file or folder Id
    if (database === null) {
      console.log('database not registered yet');

      //create folder in google drive
      //create first database file
      //register into DB

    } else {
      console.log('database already registered');
      var folder = database.folder;
      
    }

    //share via google
    console.log('Sharing ' + database + ' folder with ' + email);

    //should also consider a redirect to the googleDrive page.
    res.send('Folder shared! Check your inbox and add to your Google Drive.');

  }).catch(err => {
    console.log(err);
    res.send(err);
  });
   
});

//possibly unnecessary
app.get('/feed/status', (req, res) => {
  //check if current user's database is registered
    //return status to the user (won't display unsubscribe if there aren't registered)
});

//is this route uncessary? Can just delete the folder from their own Google Drive if they really don't want it
app.post('/feed/unsubscribe', (req, res) => {
  //remove user database from registry queue
});

app.listen(port, () => {
  console.log('Listening on port ' + port + '...');
});