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
}

let logger = require('./../app/utils/logger.js');
let config = require('./../config.js');
let request = require('request');
module.exports = new SlackAPI();