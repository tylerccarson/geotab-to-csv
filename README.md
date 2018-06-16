1) Download Node https://nodejs.org/en/download/
2) Download the project folder from Github: https://github.com/tylerccarson/geotab-to-csv
  - either git repo or just the .zip should be just fine
3) Open up your terminal and navigate to the root of the project
4) Run `npm install` to get all dependencies
5) Add your credentials do the `credentials_example.js` file and then rename to `credentials.js` so the script can find it
6) Run `npm start`. The script runs every ten minutes and writes into the `csv-files/` folder with your database as the name