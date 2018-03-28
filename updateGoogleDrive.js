var db = require('./database/index.js');
var googleDrive = require('./helpers/google-drive-helpers.js');
var writeCSV = require('./helpers/writeCSV.js');
var async = require('async');

module.exports = function updateDatabases() {

  db.Fleet.findAll().then(fleets => {

    var tasks = [];

    fleets.forEach(fleet => {

      let data = fleet.dataValues;

      tasks.push(function(callback) {

        updateGoogleDrive(data.user, data.password, data.name, data.file, (err, updated) => {
          if (err) throw err;
          callback();

        });
      });
    });

    async.series(tasks, (err) => {
      if (err) {
        throw err;
      }

      process.exit()

    });
    
  }).catch(err => {
    console.log(err);
  });
  
}

function updateGoogleDrive(user, password, database, fileId, callback) {

  writeCSV(user, password, database, (err) => {
    if (err) {
      console.log(err);
      callback(err, null);
    }

    googleDrive.updateDatabaseFile(fileId, database, (err, updated) => {
      if (err) {
        console.log(err);
        callback(err, null);
      }

      callback(null, updated);

    });
  });

}