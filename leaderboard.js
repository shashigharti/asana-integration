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

        logger.debug(JSON.stringify(actionJSONPayload));

        //Get Metric Type
        let type = actionJSONPayload.callback_id;
        logger.info("Ask Question " + questions_count);

        //Set value and ask question based on step and user's reaction
        switch (type) {
            case 'active_programmer_selection':
                console.log(selected_pms_for_the_task);
                metric.setName(slackapi.getSelectedValue(type, actionJSONPayload));
                slackapi.askQuestion(selected_pms_for_the_task, 2);

               /* logger.info("Ask Second Question");
                slackapi.askSecondQuestion(programmers, selected_pms_for_the_task, 5, task);
                questions_count++;*/

                break;
            case 'skills_set_used':
                metric.setName(slackapi.getSelectedValue(type, actionJSONPayload));
                slackapi.askQuestion(selected_pms_for_the_task, 2);
                break;
            case 'metric_rating':
                metric.setMetricByType(previous_question, slackapi.getSelectedValue(type, actionJSONPayload));
                questions_count++;
                if (questions_count < max_question) {
                    logger.debug("count" + questions_count);
                    slackapi.askQuestion(selected_pms_for_the_task, 2);
                } else {
                    logger.debug('last section');
                    airtableapi.create(task_id, metric);
                    slackapi.sayThanks(selected_pms_for_the_task, 4)
                    logger.info('Successfully Completed');
                }
                break;
            case 'metric_type':
                previous_question = slackapi.getSelectedValue(type, actionJSONPayload);
                slackapi.askQuestion(selected_pms_for_the_task, 3);
                break;
            default:
                logger.debug('default');
        }
        logger.debug(metric.getMetrics());

    }

});


app.post('/asana/receive-webhook', (req, res) => {
    logger.info('Webhook From Asana');
    logger.debug(JSON.stringify(req.body));


    //For webhook handshake with the server for the very first time while registering webhook
    let secret = req.header('X-Hook-Secret');
    let max_hours = (config.log === "debug") ? config.test.hours : 2;
    let completed_status = (config.log === "debug") ? config.test.completed_status : true;

    if (secret !== undefined) {
        res.header('X-Hook-Secret', secret);
        res.status(200).send("Ok");
        return;

    }

    if (req.body.events.length > 0) {
        task_id = (config.log === "debug") ? config.test.task_id : req.body.events[0].resource;
        logger.debug("task id:" + task_id);

        // Configure the request
        let options = {
            url: config.asana.base_url + "/tasks/" + task_id,
            method: 'GET',
            headers: config.asana.headers
        };
        logger.debug("Asana options:" + JSON.stringify(options));


        // Get followers of the task
        request(options, function (error, response, body) {
            let selected_pm_for_the_task = [];
            logger.debug(body);

            if (!error && response.statusCode === 200) {
                logger.info("Response received from Asana Status: 200");
                let task_details = JSON.parse(body);
                let estimated_hours = 0;
                logger.debug("Task Status:" + task_details.data.completed);

                //Get the actual hours
                task_details.data.custom_fields.forEach(function (custom_field, index) {
                    logger.debug(custom_field);
                    if (custom_field.name === "Hours Estimate") {
                        estimated_hours = custom_field.number_value;
                        logger.debug("Estimated Hours:" + custom_field.number_value);
                    }
                });
                logger.info("task is completed and has estimated hours > " + max_hours + ":" + (task_details.data.completed === true && estimated_hours > 2));
                if (task_details.data.completed === completed_status && estimated_hours > max_hours) {
                    task = task_details.data.name;
                    metric.setTask(task); //set task name
                    metric.setTimestamp(Date.now()); //set time stamp
                    metric.setProject(task_details.data.projects[0].name);

                    logger.debug("Followers:" + JSON.stringify(task_details.data.followers));

                    task_details.data.followers.forEach(function (follower) {
                        followers.push(follower.name);
                    });

                    logger.debug("Followers:" + JSON.stringify(followers));

                    // Configure the request
                    let options = {
                        url: config.airtable.base_url + "/" + config.airtable.pms_sheet_name,
                        method: 'GET',
                        headers: config.airtable.headers
                    };

                    logger.debug("Air table:" + JSON.stringify(options));
                    // Start the request
                    request(options, function (error, response, body) {
                        let pms = {};
                        logger.debug("Response from Air Table" + JSON.stringify(body));


                        if (!error && response.statusCode === 200) {
                            logger.info("Response received from Air Table Status: 200");
                            let pm_data = JSON.parse(body);

                            //map pms name with slack ids
                            pm_data.records.forEach(function (pm) {
                                pms[pm.fields["Name"]] = pm.fields["Slack ID"];
                            });
                            logger.debug("ALL PMS:" + JSON.stringify(pms));
                            logger.debug("ALL Follower" + JSON.stringify(followers));

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
                            logger.debug("Selected PMS:" + JSON.stringify(selected_pms_for_the_task));
                            //selected_pms_for_the_task = ["UEHMS7PNX"];

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
