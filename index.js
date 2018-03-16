var express = require('express');
var app = express();
let port = process.env.PORT || 3000;

var bodyParser = require('body-parser');

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
      res.send('Success logging in!');
      
    }
  });
});

app.get('/feed/status', (req, res) => {

});

app.post('/feed/subscribe')

app.post('/feed/unsubscribe')

app.listen(port, () => {
  console.log('Listening on port ' + port + '...');
});