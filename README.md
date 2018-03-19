important resources:
  -https://martinfowler.com/articles/command-line-google.html: this has a guide on how to get a new refresh token when necessary, since this script doesn't need a browser and Google Sheets API uses OAuth2

To-dos:
  -make sure to filter out inactive devices -- for example: TRUCK-SY (32000 miles), Durango, Paul's Test Unit
  -improve error handling
  -promises bug on first-time request for any DB
  -testing, CI