let express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    request = require('request');

const config = require('./config.js');
const slackapi = require('./routes/slack.js');
const airtableapi = require('./routes/airtable.js');
const metric = require('./routes/metrics.js');
let questions_count = 0, max_question = 4, selected_pms_for_the_task = [];
let followers = [], programmers = [], previous_question = '';
let task_name = '';

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded
let logger = require('./app/utils/logger.js');


app.post('/slack/actions', (req, res) => {
    // send respond with 200 status
    res.status(200).end();

    if (questions_count <= max_question) {
        let actionJSONPayload = JSON.parse(req.body.payload);

        logger.info(JSON.stringify(actionJSONPayload));

        //Get Metric Type
        let type = actionJSONPayload.callback_id;

        //Set value and ask question based on step and user's reaction
        switch (type) {
            case 'active_programmer_selection':
                metric.setName(slackapi.getSelectedValue(type, actionJSONPayload));
                slackapi.askQuestion(selected_pms_for_the_task, 2);
                break;
            case 'metric_rating':
                questions_count++;
                logger.info("count" + questions_count);
                metric.setMetricByType(previous_question, slackapi.getSelectedValue(type, actionJSONPayload));
                if (questions_count <= max_question) {
                    slackapi.askQuestion(selected_pms_for_the_task, 2);
                } else {
                    slackapi.sayThanks(selected_pms_for_the_task, 4);
                    airtableapi.create(JSON.stringify(metric.getMetrics()));
                }
                break;
            case 'metric_type':
                previous_question = slackapi.getSelectedValue(type, actionJSONPayload);
                slackapi.askQuestion(selected_pms_for_the_task, 3);
                break;
            default:
                logger.info('default');
        }
        logger.info(metric.getMetrics());

    }

});


app.post('/asana/receive-webhook', (req, res) => {

    //For webhook handshake with the server for the very first time while registering webhook
    let secret = req.header('X-Hook-Secret');
    if (secret !== undefined) {
        res.header('X-Hook-Secret', secret);
        res.send('');
    }

    let task_id = req.body.events[0].resource;
    //logger.info(task_id);

    // Configure the request
    let options = {
        url: config.asana.base_url + "/tasks/" + task_id,
        method: 'GET',
        headers: config.asana.headers
    };

    // Get followers of the task
    request(options, function (error, response, body) {
        let selected_pm_for_the_task = [];

        if (!error && response.statusCode === 200) {

            let task_details = JSON.parse(body);

            metric.setTask(task_details.data.name); //set task name
            metric.setTimestamp(Date.now()); //set time stamp
            metric.setProject(task_details.data.projects[0].name);

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
                        } else {
                            programmers.push({
                                text: follower,
                                value: follower
                            });
                        }
                    });

                    //log slack ids of PM
                    //logger.info(selected_pms_for_the_task);

                    selected_pms_for_the_task = ['UEHMS7PNX']; //for testing
                    logger.info(selected_pms_for_the_task);

                    questions_count++;
                    slackapi.askFirstQuestion(programmers, selected_pms_for_the_task, 1);

                }
            });

        }
    });
    res.send('success');
});

app.listen(config.server.port, config.server.hostname);
