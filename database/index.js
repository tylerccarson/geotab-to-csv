const Sequelize = require('sequelize');
let seq;

if (process.env.NODE_ENV === 'production') {

  seq = new Sequelize({
    host: process.env.RDS_HOSTNAME,
    port: process.env.RDS_PORT,
    username: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DB_NAME,
    dialect: 'mysql',
    logging: false
  });

} else {
  let credentials = require('../credentials.js');
  let user = credentials.database.user;
  let password = credentials.database.password;

  seq = new Sequelize('myGeotabDatafeed', user, password, {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
  });
}

const Fleet = seq.define('fleet', {
  name: Sequelize.STRING,
  user: Sequelize.STRING,
  password: Sequelize.STRING,
  folder: Sequelize.STRING,
  file: Sequelize.STRING
});

Fleet.sync({force: false}).then(() => {
  console.log('Synced to Fleets table');
});

seq
  .authenticate()
  .then(() => {
    console.log('Sequelize connection granted');
  })
  .catch(err => {
    console.log('Error connecting to DB: ', err);
  });

module.exports = {
  Fleet
};