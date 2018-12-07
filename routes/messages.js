class Message {
    generateQuestion() {
        return [
            {
                "text": "Choose active programmer",
                "color": "#3AA3E3",
                "attachment_type": "default",
                "callback_id": "active_programmer_selection",
                "actions": [
                    {
                        "name": "programmers_list",
                        "text": "Pick a programmer...",
                        "type": "select",
                        "options": [
                            {
                                "text": "Developer 1",
                                "value": "developer1"
                            },
                            {
                                "text": "Developer 2",
                                "value": "developer2"
                            }
                        ]
                    }
                ]
            }
        ];
    }
}

let logger = require('./../app/utils/logger.js');
let config = require('./../config.js');
let request = require('request');
module.exports = new Message();