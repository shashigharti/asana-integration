class SlackAPI {
    sendMessageToSlack(endPoint, message) {
        let options = {
            url: endPoint,
            method: 'POST',
            headers: config.slack.bot.headers,
            json: message
        };
        request(options, (error, response, body) => {
            if (error) {
                // handle errors as you see fit
            }
        })
    }
    getSelectedValue(type){
        switch (type) {
            case 'active_programmer_selection':
                logger.info('active_programmer_selection');
                return actionJSONPayload.actions[0].selected_options[0].value;
            case 'metric_rating':
                logger.info('metric_rating');
                return 0;
            case 'metric_type':
                logger.info('metric_type');
                return 'communication';
            default:
                logger.info('default');
        }
    }
    askQuestion(pms){
        let endPoint = config.slack.bot.post_message_url;
        let attachments = question.getQuestion(1);
        let message = '';
        pms.forEach(function (slack_id_of_pm) {
            message = {
                "text": "Who is the active programmer for project .....?",
                "channel": slack_id_of_pm,
                "attachments": attachments
            };
            logger.info(JSON.stringify(message));
            slackapi.sendMessageToSlack(endPoint, message);
        });
       // questions_count++;
    }
}

let logger = require('./../app/utils/logger.js');
//let questions_count = require('./../app/utils/common.js');
let config = require('./../config.js');
let request = require('request');
module.exports = new SlackAPI();