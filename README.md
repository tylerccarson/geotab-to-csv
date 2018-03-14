important resources:

  -https://martinfowler.com/articles/command-line-google.html: this has a guide on how to get a new refresh token when necessary, since this script doesn't need a browser and Google Sheets API uses OAuth2

To-dos:

  -make sure to filter out inactive devices -- for example: TRUCK-SY (32000 miles), Durango, Paul's Test Unit
  -refactor to decouple the functions
  -improve error handling (retry on fail)

Walk through of the customer experience:
  1) Enter Geotab credentials
  2) Receive a folder share that contains a constantly updating .csv file
  3) Sync this folder with their local machine via Google Drive Backup and Sync
  4) Ability to switch this on and off

Mirror in terms of engineering:
  1) Build an HTML form to capture user credentials, set desired interval (based on Heroku options), and submit to web server via POST request
  2) Take this information and formulate into job, then add to the database
  3) Register this job in Heroku
  4) Dashboard also contains option to switch off or even delete a job