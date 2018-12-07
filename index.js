let express = require('express');
let app = express();
let bodyParser = require('body-parser');
let request = require('request');

const config = require('./config.js');
const SlackAPI = require('./routes/slack.js');
const Message = require('./routes/messages.js');

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded
let logger = require('./app/utils/logger.js');


app.post('/slack/actions', (req, res) => {
    // send respond with 200 status
    res.status(200).end();

    // parse URL-encoded payload JSON string
    let actionJSONPayload = JSON.parse(req.body.payload)
    logger.info(JSON.stringify(actionJSONPayload));

    switch (actionJSONPayload.callback_id) {
        case 'active_programmer_selection':
            logger.info('active_programmer_selection');
            programmer_name =  actionJSONPayload.actions[0].name;
            logger.info(programmer_name);

            break;
        case 'metric_selection':
            logger.info('metric_selection');
            break;
        case 'metric_rating':
            logger.info('metric_rating');
            break;
        default:
            logger.info('default');
    }
    //sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
});



app.post('/asana/receive-webhook', (req, res) => {

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
        url: config.asana.base_url + "/tasks/" + task_id,
        method: 'GET',
        headers: config.asana.headers
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
                url: config.airtable.base_url,
                method: 'GET',
                headers: config.airtable.headers
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

                    let endPoint = config.slack.bot.post_message_url;
                    let attachments = Message.generateQuestion();
                    let message = '';
                    selected_pms_for_the_task.forEach(function (slack_id_of_pm) {
                        message = {
                            "text": "Who is the active programmer for project .....?",
                            "channel": slack_id_of_pm,
                            "attachments": attachments
                        };
                        logger.info(JSON.stringify(message));
                        SlackAPI.sendMessageToSlack(endPoint, message);
                    });
                }
            });

        }
    });
    res.send('success');
});

app.listen(config.server.port, config.server.hostname);
