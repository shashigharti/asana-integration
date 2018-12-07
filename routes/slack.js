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
            default:
                logger.info('default');
        }
    }
}

let logger = require('./../app/utils/logger.js');
let config = require('./../config.js');
let request = require('request');
module.exports = new SlackAPI();