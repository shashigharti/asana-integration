class Metrics {
    constructor(){
        this.name = '';
        this.communication = 0;
        this.speed = 0;
    }
    setName(name){
        this.name = name;
    }
    setMetrics(type, value) {
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
    getMetrics(){
        return JSON.stringify(this);
    }
}

let logger = require('./../app/utils/logger.js');
let config = require('./../config.js');
let request = require('request');
module.exports = new Metrics();