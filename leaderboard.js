let express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    request = require('request')
Airtable = require('airtable')
dateTime = require('node-datetime');

const config = require('./config.js');
const slackapi = require('./routes/slack.js');
const airtableapi = require('./routes/airtable.js');
const metric = require('./routes/metrics.js');
let questions_count = 0, max_question = 4, selected_pms_for_the_task = [];
let followers = [], programmers = [], previous_question = '';
let task = '', task_id = 0;

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
                metric.setMetricByType(previous_question, slackapi.getSelectedValue(type, actionJSONPayload));
                questions_count++;
                if (questions_count < max_question) {
                    logger.info("count" + questions_count);
                    slackapi.askQuestion(selected_pms_for_the_task, 2);
                } else {
                    logger.info('last section');
                    airtableapi.create(task_id, metric);
                    logger.info('end');
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
    logger.info('Webhook From Asana');
    logger.info(JSON.stringify(req.body));


    //For webhook handshake with the server for the very first time while registering webhook
    let secret = req.header('X-Hook-Secret');
    if (secret !== undefined) {
        res.header('X-Hook-Secret', secret);
        res.status(200).send("Ok"); return;

    }

    if(req.body.events.length > 0){
        task_id = req.body.events[0].resource;
        logger.info("task id:" + task_id);

        // Configure the request
        let options = {
            url: config.asana.base_url + "/tasks/" + task_id,
            method: 'GET',
            headers: config.asana.headers
        };
        logger.info("Asana options:" + JSON.stringify(options));


        // Get followers of the task
        request(options, function (error, response, body) {
            let selected_pm_for_the_task = [];
            logger.info(body);

            if (!error && response.statusCode === 200) {

                let task_details = JSON.parse(body);
                logger.info("Task Status:" + task_details.data.completed);

                if (task_details.data.completed === false) {
                    task = task_details.data.name;
                    metric.setTask(task); //set task name
                    metric.setTimestamp(Date.now()); //set time stamp
                    metric.setProject(task_details.data.projects[0].name);

                    logger.info("Followers:" + JSON.stringify(task_details.data.followers));

                    task_details.data.followers.forEach(function (follower) {
                        followers.push(follower.name);
                    });

                    logger.info("Followers:" + JSON.stringify(followers));

                    // Configure the request
                    let options = {
                        url: config.airtable.base_url +  "/" + config.airtable.pms_sheet_name,
                        method: 'GET',
                        headers: config.airtable.headers
                    };

                    logger.info("Air table:" + JSON.stringify(options));
                    // Start the request
                    request(options, function (error, response, body) {
                        let pms = {};
                        logger.info("Response from Air Table" + JSON.stringify(body));


                        if (!error && response.statusCode === 200) {
                            let pm_data = JSON.parse(body);

                            //map pms name with slack ids
                            pm_data.records.forEach(function (pm) {
                                pms[pm.fields["Name"]] = pm.fields["Slack ID"];
                            });
                            logger.info("ALL PMS:" + JSON.stringify(pms));
                            logger.info("ALL Follower" + JSON.stringify(followers));

                            followers.forEach(function (follower) {
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
                            logger.info("Selected PMS:" + JSON.stringify(selected_pms_for_the_task));
                            selected_pms_for_the_task = ["UEHMS7PNX"];

                            logger.info("Ask First Question");
                            slackapi.askFirstQuestion(programmers, selected_pms_for_the_task, 1, task);
                            questions_count++;

                        }
                    });
                }
            }
        });
    }

    res.status(200).send('success');
});

app.listen(config.server.port, config.server.hostname);
