const fs = require('fs');
const path = require('path');
const listEndpoints = require('express-list-endpoints');
const L = require('debug')('app');
const cfg = require('config')

module.exports = function (server) {

    registerGlobalAPI()

    // init configuration
    require('./init')(server);

    // add routes
    var routers = getRouters();

    Object.keys(routers).forEach((api) => {
        server.use('/api/'+api, require(routers[api]));
    });

    // sanity check
    L('-------------  APIs Activated ------------------');
    L(listEndpoints(server));
    L('-----------------------------------------------');

    // 是否开启定任务
    if(cfg.cronRun){
        cron();
    }
}

function getRouters() {
    var rs = {};
    var apiDir = __dirname + '/api';

    fs.readdirSync(apiDir).forEach((folder) => {
        var folderPath = apiDir + '/' + folder;

        if (!fs.statSync(folderPath).isDirectory()) {
            return; // only look for API folder
        }

        fs.readdirSync(folderPath).forEach((f) => {

            if (!f.match(/(.+routes)\.js$/)) {
                return; // only look for routers file
            }

            rs[folder] = path.join(folderPath, f);
        });
    });

    return rs;
}

function cron() {
    let dir = __dirname + '/cron';
    let files = fs.readdirSync(dir);
    files.forEach(f => require(dir + '/' + f) );
}


function registerGlobalAPI() {
    Date.prototype.toHawkDateString = function() {
        const Y = this.getFullYear()
        const M = this.getMonth()+1
        const D = this.getDate()
        return `${Y}-${M > 9 ? M : `0${M}`}-${D > 9 ? D : `0${D}`}`
    }

    Date.prototype.toHawkTimeString = function() {
        const h = this.getHours()
        const m = this.getMinutes()
        const s = this.getSeconds()
        return `${h > 9 ? h : `0${h}`}:${m > 9 ? m : `0${m}`}:${s > 9 ? s : `0${s}`}`
    }

    Date.prototype.toHawkString = function() {
        return this.toHawkDateString() + ' ' + this.toHawkTimeString();
    }
    console.log('[init] install global API');
}
