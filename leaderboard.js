let express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    request = require('request')
Airtable = require('airtable')
dateTime = require('node-datetime'),
    emitter = require('./app/utils/events.js');

const config = require('./config.js');
const slackapi = require('./routes/slack.js');
const airtableapi = require('./routes/airtable.js');
const metric = require('./routes/metrics.js');

let sessions = {};
let messages_map = {};
const max_question = 4;

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded
let logger = require('./app/utils/logger.js');

app.post('/slack/actions', (req, res) => {
    logger.info('Message From Slack ' + JSON.stringify(req.body));
    let message_ts = JSON.parse(req.body.payload).message_ts;
    let session = sessions[messages_map[message_ts].task_id];

    logger.info('Current Session ' + JSON.stringify(session));

    //delete old one
    logger.info('Remove Old Message:' + req.body.payload.message_ts);
    delete messages_map[req.body.payload.message_ts];

    // send respond with 200 status
    res.status(200).end();

    if (session.questions_count <= max_question) {
        let actionJSONPayload = JSON.parse(req.body.payload);

        logger.debug(JSON.stringify(actionJSONPayload));

        //Get Metric Type
        let type = actionJSONPayload.callback_id;
        logger.info("Ask Question " + session.questions_count);

        //Set value and ask question based on step and user's reaction
        switch (type) {
            case 'active_programmer_selection':
                console.log(session.selected_pms_for_the_task);
                metric.setName(slackapi.getSelectedValue(type, actionJSONPayload));
                slackapi.askQuestion(session.selected_pms_for_the_task, 2);

                /* logger.info("Ask Second Question");
                 slackapi.askSecondQuestion(programmers, selected_pms_for_the_task, 5, task);
                 questions_count++;*/

                break;
            case 'skills_set_used':
                metric.setName(slackapi.getSelectedValue(type, actionJSONPayload));
                slackapi.askQuestion(session.selected_pms_for_the_task, 2);
                break;
            case 'metric_rating':
                metric.setMetricByType(previous_question, slackapi.getSelectedValue(type, actionJSONPayload));
                sessions[session.task_id].questions_count++;
                if (sessions[session.task_id].questions_count < max_question) {
                    logger.debug("count" + session.questions_count);
                    slackapi.askQuestion(session.selected_pms_for_the_task, 2);
                } else {
                    logger.debug('last section');
                    airtableapi.create(session.task_id, metric);
                    slackapi.sayThanks(session.selected_pms_for_the_task, 4);
                    logger.debug("Removed Session" + JSON.stringify(sessions[session.task_id]));
                    delete sessions[session.task_id];
                    logger.info('Successfully Completed');
                }
                break;
            case 'metric_type':
                previous_question = slackapi.getSelectedValue(type, actionJSONPayload);
                slackapi.askQuestion(sessions[session.task_id].selected_pms_for_the_task, 3);
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

    let questions_count = 0, selected_pms_for_the_task = [];
    let followers = [], programmers = [], previous_question = '';
    let task = '', task_id = 0;


    //For webhook handshake with the server for the very first time while registering webhook
    let secret = req.header('X-Hook-Secret');
    let max_hours = (config.mode === "test") ? config.test.hours : 2;
    let completed_status = (config.mode === "test") ? config.test.completed_status : true;

    if (secret !== undefined) {
        res.header('X-Hook-Secret', secret);
        res.status(200).send("Ok");
        return;

    }

    if (req.body.events.length > 0) {
        task_id = (config.mode === "test") ? config.test.task_id : req.body.events[0].resource;
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

                            //for testing purpose
                            if (config.mode === "test") {
                                selected_pms_for_the_task = ["UEHMS7PNX"];
                            }

                            logger.info("Ask First Question");
                            slackapi.askFirstQuestion(programmers, selected_pms_for_the_task, 1, task, task_id);
                            questions_count++;

                            //Register the session for the new task
                            if (sessions[task_id] === undefined) {
                                sessions[task_id] = {
                                    questions_count: questions_count,
                                    selected_pms_for_the_task: selected_pms_for_the_task,
                                    followers: followers,
                                    programmers: programmers,
                                    previous_question: previous_question,
                                    task: task,
                                    task_id: task_id
                                };
                                logger.debug("Add New Session for " + task_id + JSON.stringify(sessions[task_id]));
                            }

                            //an event listener
                            emitter.once('slack-message-response-200-' + task_id, responseFromSlackListener);
                        }
                    });
                }
            }
        });
    }

    res.status(200).send('success');
});

function responseFromSlackListener(response) {
    logger.debug("slack-message-response-200 (ts):" + JSON.stringify(response));
    if (messages_map[response.body.ts] === undefined) {
        messages_map[response.body.ts] = {task_id: response.task_id};
    }
    logger.info("Messages Map:" + JSON.stringify(messages_map[response.body.ts]));
}

app.listen(config.server.port, config.server.hostname);

