class Question {
    getQuestion(number) {
        switch (number) {
            case 1:
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
            case 2:
                return [
                    {
                        "text": "Select a Metric",
                        "callback_id": "metric_type",
                        "color": "#3AA3E3",
                        "attachment_type": "default",
                        "actions": [
                            {
                                "name": "communication",
                                "text": "communication",
                                "type": "button",
                                "value": "communication"
                            },
                            {
                                "name": "speed",
                                "text": "speed",
                                "type": "button",
                                "value": "speed"
                            },
                            {
                                "name": "quality",
                                "text": "quality",
                                "type": "button",
                                "value": "quality"
                            }
                        ]
                    }
                ];

            case 3:
                return [
                    {
                        "text": "Give Your Rating",
                        "callback_id": "metric_rating",
                        "color": "#3AA3E3",
                        "attachment_type": "default",
                        "actions": [
                            {
                                "name": "1",
                                "text": "1",
                                "type": "button",
                                "value": "1"
                            },
                            {
                                "name": "2",
                                "text": "2",
                                "type": "button",
                                "value": "2"
                            },
                            {
                                "name": "3",
                                "text": "3",
                                "type": "3",
                                "value": "3"
                            }
                        ]
                    }
                ];
            default:
                return '';
        }

    }
}

let logger = require('./../app/utils/logger.js');
let config = require('./../config.js');
let request = require('request');
module.exports = new Question();