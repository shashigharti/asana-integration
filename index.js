let express = require('express');
let app = express();
let bodyParser = require('body-parser');
let request = require('request');

let config = require('./config.js');
/*const hostname = '127.0.0.1';
const port = 3000;*/

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded

const {createLogger, format, transports} = require('winston');
const fs = require('fs');
const path = require('path');

const env = process.env.NODE_ENV || 'development';
const logDir = 'log';

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const filename = path.join(logDir, 'results.log');

const logger = createLogger({
    // change level if in dev environment versus production
    level: env === 'development' ? 'debug' : 'info',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
        new transports.Console({
            level: 'info',
            format: format.combine(
                format.colorize(),
                format.printf(
                    info => `${info.timestamp} ${info.level}: ${info.message}`
                )
            )
        }),
        new transports.File({filename})
    ]
});

app.post('/asana/receive-webhook', function (req, res) {

    //For webhook handshake with the server for the very first time while registering webhook
    let secret = req.header('X-Hook-Secret');
    if (secret !== undefined) {
        res.header('X-Hook-Secret', secret);
        res.send('');
    }

    let task_id = req.body.events[0].resource;
    logger.info(task_id);

    // Configure the request
    let options = {
        url: "https://app.asana.com/api/1.0/tasks/" + task_id,
        method: 'GET',
        headers: {
            'Authorization': 'Bearer 0/67d62f34ae5cc2ceb2c8a5216d4409d6'
        }
    };

    // Get followers of the task
    request(options, function (error, response, body) {
        let followers = [];
        let selected_pm_for_the_task = [];

        if (!error && response.statusCode === 200) {

            let task_details = JSON.parse(body);
            task_details.data.followers.forEach(function (follower) {
                followers.push(follower.name);
            });

            followers.push('Elad Hefetz');   // For testing
            logger.info(followers);
            //let followers = ['Elad Hefetz', 'Shashi Gharti'];

            // Configure the request
            let options = {
                url: "https://api.airtable.com/v0/appohapUWdo5okapf/PM%20IDs",
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer keycEZ9iQvYuZDyMH'
                }
            };

            // Start the request
            request(options, function (error, response, body) {
                let pms = {};
                //logger.info(JSON.stringify(body));


                if (!error && response.statusCode === 200) {
                    let pm_data = JSON.parse(body);
                    let selected_pms_for_the_task = [];

                    //map pms name with slack ids
                    pm_data.records.forEach(function (pm) {
                        pms[pm.fields["Name"]] = pm.fields["Slack ID"];
                    });
                    logger.info(JSON.stringify(pms));
                    logger.info(followers);

                    followers.forEach(function (follower) {
                        logger.info(follower);
                        if (pms[follower] !== undefined) {
                            selected_pms_for_the_task.push(pms[follower]); //get the slack id of the PM
                        }
                    });

                    //log slack ids of PM
                    logger.info(selected_pms_for_the_task);

                    selected_pms_for_the_task = ['UEHMS7PNX']; //for testing
                    logger.info(selected_pms_for_the_task);

                    let endPoint = 'https://slack.com/api/chat.postMessage';
                    let attachments = [
                        {
                            "text": "Choose active programmer",
                            "color": "#3AA3E3",
                            "attachment_type": "default",
                            "callback_id": "active_programmer_selection",
                            "actions": [
                                {
                                    "name": "programmers_list",
                                    "text": "Pick a programmer...",
                                    "type": "select",
                                    "options": [
                                        {
                                            "text": "Developer 1",
                                            "value": "developer1"
                                        },
                                        {
                                            "text": "Developer 2",
                                            "value": "developer2"
                                        }
                                    ]
                                }
                            ]
                        }
                    ];
                    let message = '';
                    selected_pms_for_the_task.forEach(function(slack_id_of_pm){
                        message = {
                            "text": "Who is the active programmer for project .....?",
                            "channel": slack_id_of_pm,
                            "attachments": attachments
                        };
                        logger.info(JSON.stringify(message));
                        sendMessageToSlack(endPoint, message);
                    });
                }
            });

        }
    });


    //convert the response in JSON format
    res.end(JSON.stringify('test'));


});

function sendMessageToSlack(endPoint, message) {
    let options = {
        url: endPoint,
        method: 'POST',
        headers: {
            'Authorization': 'Bearer xoxb-495244200950-498222946918-8eGgrFVMF8HQ9SnuQ2fjReGJ',
            'Content-Type': 'application/json'
        },
        json: message
    };
    request(options, (error, response, body) => {
        if (error) {
            // handle errors as you see fit
        }
    })
}

app.listen(config.server.port, config.server.hostname);
