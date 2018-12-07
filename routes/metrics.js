class Metrics {
    constructor(user_id){
        this.user_id = user_id;
        this.communication = 0;
        this.speed = 0;
    }
    setMetric(type, value) {
        switch (type) {
            case 'communication':
                this.communication = value;
                break;
            case 'speed':
                this.speed = value;
                break;
            default:
                break;
        }
    }
}

let logger = require('./../app/utils/logger.js');
let config = require('./../config.js');
let request = require('request');
module.exports = new Metrics();