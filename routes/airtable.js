class AirtableAPI {
    create(task_id, metric) {
        let base = new Airtable({apiKey: config.airtable.api_key}).base('appohapUWdo5okapf');
        let dt = dateTime.create();
        let timestamp = dt.format('Y-m-d H:M:S');

        base('Developers').create({
            "Name": metric.name,
            "Task": metric.task + " https://app.asana.com/0/1/" + task_id,
            "Project": metric.project,
            "Quality": metric.quality,
            "Speed": metric.speed,
            "Communication": metric.communication,
            "Timestamp": timestamp
        }, function(err, record) {
            if (err) { console.error(err); return; }
        });

    }
}

let Airtable = require('airtable');
let logger = require('./../app/utils/logger.js');
let config = require('./../config.js');
let request = require('request');
module.exports = new AirtableAPI();