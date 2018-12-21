class SlackAPI {
    sendMessageToSlack(endPoint, message, task_id) {
        let options = {
            url: endPoint,
            method: 'POST',
            headers: config.slack.bot.headers,
            json: message
        };
        request(options, (error, response, body) => {
            if (error) {
                logger.debug(error);
            }else{
                logger.info("Response from Slack Status:200" + JSON.stringify(body));
                emitter.emit('slack-message-response-200-' + task_id, {body:response.body, task_id: task_id});
                logger.debug(emitter.removeAllListeners());
            }
        });
    }

    getSelectedValue(type, actionJSONPayload) {
        switch (type) {
            case 'active_programmer_selection':
                logger.debug('active_programmer_selection');
                return actionJSONPayload.actions[0].selected_options[0].value;
            case 'metric_rating':
                logger.debug('metric_rating');
                return actionJSONPayload.actions[0].value;
            case 'metric_type':
                logger.debug('metric_type');
                return actionJSONPayload.actions[0].value;
            default:
                logger.debug('default');
        }
    }

    askFirstQuestion(programmers, pms, number, task) {
        logger.debug('Ask Question ' + number);
        let endPoint = config.slack.bot.post_message_url;
        let message = '';
        let $this = this;
        let slack_id_of_pm = pms[0];
        message = question.getFirstQuestion(programmers, slack_id_of_pm, task);
        logger.debug("message:" + JSON.stringify(message));
        return $this.sendMessageToSlack(endPoint, message);
        /*pms.forEach(function (slack_id_of_pm) {
            message = question.getFirstQuestion(programmers, slack_id_of_pm, number, task);
            logger.debug("message:" + JSON.stringify(message));
            $this.sendMessageToSlack(endPoint, message);
        });*/
    }

    askQuestion(pms, number) {
        logger.debug('Ask Question ' + number);
        let endPoint = config.slack.bot.post_message_url;
        let message = '';
        let $this = this;
        let slack_id_of_pm = pms[0];
        message = question.getQuestion(slack_id_of_pm, number);
        logger.debug("message:" + JSON.stringify(message));
        return $this.sendMessageToSlack(endPoint, message);
        /*pms.forEach(function (slack_id_of_pm) {
            message = question.getQuestion(slack_id_of_pm, number);
            logger.debug("message:" + JSON.stringify(message));
            $this.sendMessageToSlack(endPoint, message);
        });*/
    }

    sayThanks(pms, number) {
        logger.debug('Say Thanks');
        let endPoint = config.slack.bot.post_message_url;
        let message = '';
        let $this = this;
        let slack_id_of_pm = pms[0];
        message = question.getQuestion(slack_id_of_pm, number);
        logger.debug("message:" + JSON.stringify(message));
        $this.sendMessageToSlack(endPoint, message);
        /*pms.forEach(function (slack_id_of_pm) {
            message = question.getQuestion(slack_id_of_pm, number);
            logger.debug("message:" + JSON.stringify(message));
            $this.sendMessageToSlack(endPoint, message);
        });*/
    }
}
const question = require('./questions.js');
const logger = require('./../app/utils/logger.js');
const emitter = require('./../app/utils/events.js');
const config = require('./../config.js');
const request = require('request');
module.exports = new SlackAPI();