class AirtableAPI {
    create(task_id, data) {
        let base = new Airtable({apiKey: config.airtable.api_key}).base('appohapUWdo5okapf');

        base('Developers').create({
            "Name": data.name,
            "Task": data.task + "https://app.asana.com/0/1/" + task_id,
            "Project": data.project,
            "Quality": data.quality,
            "Speed": data.speed,
            "Communication": data.communication,
            "Timestamp": data.timestamp
        }, function (err, record) {
            if (err) {
                console.error(err);
                return;
            }
            console.log(record.getId());
        });
    }
}

let Airtable = require('airtable');
let logger = require('./../app/utils/logger.js');
let config = require('./../config.js');
let request = require('request');
module.exports = new AirtableAPI();