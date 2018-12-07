class Asana {
    processWebHookNotification(req, res) {
        let pms = {};

        // Handshake sent from Asana webhook, It will be used only once for verification
        let secret = req.header('X-Hook-Secret');
        if (secret !== undefined) {
            res.header('X-Hook-Secret', secret);
            res.send('');
        }

        //Log the event
        logger.info('testing');
        //convert the response in JSON format
        res.end(JSON.stringify('test'));
    }
}

let logger = require('./../app/utils/logger.js');
let config = require('./../config.js');
let request = require('request');
module.exports = new Asana();