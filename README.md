important resources:

  -https://martinfowler.com/articles/command-line-google.html: this has a guide on how to get a new refresh token when necessary, since this script doesn't need a browser and Google Sheets API uses OAuth2

design thoughts:

  -how to make this more flexible for when we pass this off to a customer? They won't want to share their Geotab or Google credentials, so I need to build it with their perspective in mind. Would this work, though, for a refresh token? I think not, needs to be done by my account. So maybe not.

To-dos:

  -make sure to filter out inactive devices -- for example: TRUCK-SY (32000 miles), Durango, Paul's Test Unit
  -refactor to decouple the functions
  -build with other users in mind... how to make the accounts involved more flexible? May need to build the logic to capture the refresh token automatically to manage the stream. This is a bigger task. However! Not necessary if we're cutting Google Sheets out of the picture. Then, they only need to log in with their myGeotab credentials, save those in the database (encrypted) so we can continually make those API calls on their behalf. If we stay delivering via .csv to GoogleDrive however, than we do need to handle the user accounts correctly.