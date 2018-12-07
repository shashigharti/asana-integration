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
    getSelectedValue(type,actionJSONPayload){
        switch (type) {
            case 'active_programmer_selection':
                logger.info('active_programmer_selection');
                logger.info(JSON.stringify(actionJSONPayload));
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
    askQuestion(pms, number){
        let endPoint = config.slack.bot.post_message_url;
        let attachments = question.getQuestion(number);
        let message = '';
        let $this = this;
        pms.forEach(function (slack_id_of_pm) {
            message = {
                "text": "Who is the active programmer for project .....?",
                "channel": slack_id_of_pm,
                "attachments": attachments
            };
            logger.info(JSON.stringify(message));
            $this.sendMessageToSlack(endPoint, message);
        });
        questions_count++;
    }
}

const question = require('./questions.js');
const logger = require('./../app/utils/logger.js');
let questions_count = require('./../app/utils/common.js');
const config = require('./../config.js');
const request = require('request');
module.exports = new SlackAPI();