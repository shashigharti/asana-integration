class Question {
    getFirstQuestion(programmers, slack_id_of_pm, number, task){
        return {
            "text": "Who is the active programmer for " + task + "?",
            "channel": slack_id_of_pm,
            "attachments": [
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
                            "options": programmers
                        }
                    ]
                }
            ]
        };
    }
    getQuestion(slack_id_of_pm, number) {
        switch (number) {
            case 2:
                return {
                    "channel": slack_id_of_pm,
                    "attachments": [
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
                    ]
                };
            case 3:
                return {
                    "channel": slack_id_of_pm,
                    "attachments": [
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
                                    "type": "button",
                                    "value": "3"
                                },
                                {
                                    "name": "4",
                                    "text": "4",
                                    "type": "button",
                                    "value": "4"
                                },
                                {
                                    "name": "5",
                                    "text": "5",
                                    "type": "button",
                                    "value": "5"
                                }
                            ]
                        }
                    ]
                };
            case 4:
                return {
                    "text": "Thank you for the feedback",
                    "channel": slack_id_of_pm
                };
            default:
                return '';
        }

    }
}

let logger = require('./../app/utils/logger.js');
let config = require('./../config.js');
let request = require('request');

module.exports = new Question();