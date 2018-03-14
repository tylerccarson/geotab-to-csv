var express = require('express');
var app = express();
let port = process.env.PORT || 3000;

app.use(express.static('public'));

app.listen(port, () => {
  console.log('Listening on port ' + port + '...');
});