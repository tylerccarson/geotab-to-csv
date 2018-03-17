const Sequelize = require('sequelize');
let seq;

if (process.env.NODE_ENV === 'production') {
  seq = new Sequelize(process.env.CLEARDB_DATABASE_URL);

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
  console.log('Created Fleets table');
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