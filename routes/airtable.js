class AirtableAPI {
    create(data) {
        logger.info(data);
        let options = {
            url: config.airtable.base_url,
            method: 'POST',
            headers: config.airtable.headers,
            json: JSON.parse(data)
        };
        request(options, (error, response, body) => {
            if (error) {
                logger.info(error)
            }
        })
    }
}

let logger = require('./../app/utils/logger.js');
let config = require('./../config.js');
let request = require('request');
module.exports = new AirtableAPI();