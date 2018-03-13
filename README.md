important resources:

  -https://martinfowler.com/articles/command-line-google.html: this has a guide on how to get a new refresh token when necessary, since this script doesn't need a browser and Google Sheets API uses OAuth2

design thoughts:

  -how to make this more flexible for when we pass this off to a customer? They won't want to share their Geotab or Google credentials, so I need to build it with their perspective in mind. Would this work, though, for a refresh token? I think not, needs to be done by my account. So maybe not.

To-dos:

  -make sure to filter out inactive devices -- for example: TRUCK-SY (32000 miles), Durango, Paul's Test Unit
  -refactor to decouple the functions
  -improve error handling (retry on fail)