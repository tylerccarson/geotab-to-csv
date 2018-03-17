var express = require('express');
var app = express();
let port = process.env.PORT || 3000;

var bodyParser = require('body-parser');
var db = require('./database/index.js');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/auth/myGeotab', (req, res) => {
  
  var geotabUserName = req.body.email;
  var geotabPassword = req.body.password;
  var geotabDatabase = req.body.database;
  var myGeotab = require('mg-api-node')(geotabUserName, geotabPassword, geotabDatabase);

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
  console.log(email);

  //if database is already registered
    //retrieve file or folder Id and share
  //else
    //register
    //share

  //should also consider a redirect to the googleDrive page.
  res.send('Folder shared! Check your inbox and add to your Google Drive.');
  
      
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