const axios = require('axios');
const json2csv = require('json2csv');
const fs = require('fs');
const credentials = require('./credentials.js');
const api = require('./api.js');

//issue request for data
axios.get('https://my198.geotab.com/apiv1/GetFeed', {
  params: {
    typeName: 'StatusData',
    credentials: {
      database: credentials.database,
      userName: credentials.userName,
      password: credentials.password
    }
  }
})
  .then((res) => {
    //manipulate JSON to access just the results w/ map function, possibly for the fields wanted (need to add date, some other things)
    var results = res.data.result;

    //collect device ID

    //fields needed: 
    //'name' -> 'AssetName' (available from first request)
    //'VIN#' -> 'AssetNo' (available from first request)
    //timestamp -> 'DateRead'
    //deviceID-> 'MeterTitleName' or 'MeterTileNo'
    //odometer total milage -> 'ValueRead'

    console.log(results);
    //parse JSON into a csv file with json2csv
    const csv = json2csv({data: results});
    console.log(csv);
    //write as csv
    // fs.writeFile('geotabresults.csv', csv, (res, err) => {
    //   if (err) throw Error;
    // });

    //send this to a Google Drive??

    //write as JSON, then use the CLI to convert to .csv
    // fs.writeFile('geotabresults.json', results, (res, err) => {
    //   if (err) throw Error;
    // });

  })
  .catch((err) => {
    console.log(err);
  });