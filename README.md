### Configure Asana Webhook
To setup webhook for Asana, follow the steps below:

1. Setup a server and enable ssl(https).
2. Create a webhook by running the command as described in the doc: https://asana.com/developers/api-reference/webhooks#create

curl -H "Authorization: Bearer <personal_access_token>" \
-X POST https://app.asana.com/api/1.0/webhooks \
-d "resource=8675309" \
-d "target=https://example.com/receive-webhook/7654"


POST /receive-webhook/7654
X-Hook-Secret: b537207f20cbfa02357cf448134da559e8bd39d61597dcd5631b8012eae53e8

Once the validation is done, the events are sent to the specified url by asana.

3. For personal access token generation, go to "My Profile Setting" ->Apps -> Manage Developers App -> Create new personal access token

### Configure Slack Interactive Messages and Bot

1. Create a new slack app and enable 'bot' and 'interactive messages' feature for the app. To create a new slack app, go to https://api.slack.com/apps -> 'your apps' and create a new app.

2. After the app is created, install it to the workspace. Whenever you make any new changes please reinstall the app.

3. Inorder to send messages to slack users, use the token "Bot User OAuth Access Token". To find access token go to
"your apps". Click on the app name -> install app.

### Configure Airtable API

To get API Key of Airtable go to Airtable->account.


### Setup
1. config.js contains all the access tokens and configuration params.
2. run npm install
3. install pm2 (node process manager)
4. leaderboard.js is the main file
5. To start the node server run
pm2 start leaderboard.js

### Dependencies
1. airtable
2. body-parser
3. express
4. node-datetime
5. request
6. winston

