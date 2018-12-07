class Metrics {
    constructor(){
        this.name = '';
        this.communication = 0;
        this.speed = 0;
        this.quality = 0;
    }
    setName(name){
        this.name = name;
    }
    setMetricByType(type, value) {
        switch (type) {
            case 'communication':
                this.communication = value;
                break;
            case 'speed':
                this.speed = value;
                break;
            case 'quality':
                this.quality = value;
                break;
            default:
                break;
        }
    }
    getMetrics(){
        return JSON.stringify(this);
    }
}

let logger = require('./../app/utils/logger.js');
let config = require('./../config.js');
let request = require('request');
module.exports = new Metrics();