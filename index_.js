let express = require('express');
let app = express();
let bodyParser = require('body-parser');
let request = require('request');

let config = require('./config.js');
let logger = require('./app/utils/logger.js');
let Asana = require('./routes/asana.js');


app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded

// routes for api calls
app.post('/asana/receive-webhook', Asana.processWebHookNotification);


app.listen(config.server.port, config.server.hostname);
