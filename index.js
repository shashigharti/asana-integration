let express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    request = require('request')
    Airtable = require('airtable');

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
                    let base = new Airtable({apiKey: config.airtable.api_key}).base('appohapUWdo5okapf');

                    base('Developers').create({
                        "Name": metric.name,
                        "Task": "Include task name with Asana URL hyperlink",
                        "Project": "Check Project ID",
                        "Quality": "1-5 Rating, pulled from Slack",
                        "Speed": "1-5 Rating, pulled from Slack",
                        "Communication": "1-5 Rating, pulled from Slack",
                        "Timestamp": "Time at which the rating was done"
                    }, function(err, record) {
                        if (err) { console.error(err); return; }
                        console.log(record.getId());
                    });




                   /* let base = new Airtable({apiKey: config.airtable.api_key}).base('appohapUWdo5okapf');
                    base('Developers').create(JSON.stringify({
                        "Name": metric.name,
                        "Task": metric.task,// "https://app.asana.com/0/1/" + task_id,
                        "Project": metric.project,
                        "Quality": metric.quality,
                        "Speed": metric.speed,
                        "Communication": metric.communication,
                        "Timestamp": metric.timestamp
                    }), function (err, record) {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        logger.log(record.getId());
                    });
*/
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

    //For webhook handshake with the server for the very first time while registering webhook
    let secret = req.header('X-Hook-Secret');
    if (secret !== undefined) {
        res.header('X-Hook-Secret', secret);
        res.send('');
    }

    task_id = req.body.events[0].resource;
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

            if (task_details.data.completed === true) {
                task = task_details.data.name;
                metric.setTask(task); //set task name
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

                        slackapi.askFirstQuestion(programmers, selected_pms_for_the_task, 1, task);
                        questions_count++;

                    }
                });
            }
        }
    });
    res.send('success');
});

app.listen(config.server.port, config.server.hostname);
