/**
 * 加减分模块
 */
//
if (global.$ScoreModule) {
    return module.exports = global.$ScoreModule
}


const EventEmitter = require('events');
const CronJob = require('cron').CronJob;
const cfg = require('config')
const L = require('debug')('Score')

class Score extends EventEmitter {
    constructor() {
        super()
        this.score_module = {}
    }

    setup(name, scoreServer) {
        L('setup rule '+name)
        this.score_module[name] = scoreServer;

        // 初始事件
        if(cfg.cronRun && scoreServer.cron && scoreServer.cron.length){
            for (let i = 0; i < scoreServer.cron.length; i++) {
                let item = scoreServer.cron[i]
                if(item){
                    const job = new CronJob(item.time, item.run);
                    job.start();
                }
            }
        }

        // 初始任务
        if(scoreServer.event && scoreServer.event.length){
            for (let i = 0; i < scoreServer.event.length; i++) {
                let item = scoreServer.event[i]
                if(item){
                    this.on(name + '.' + item.name, item.run)
                }
            }
        }

        // 初始rules的事件和任务
        for (let key in scoreServer.rules) {
            let item = scoreServer.rules[key]
            // 注册监听事件
            if (item.event && item.event.open) {
                this.on(name + '.' + key, item.event.run)
            }

            // 添加定时任务
            if (cfg.cronRun && item.cron && item.cron.open) {
                const job = new CronJob(item.cron.time, item.cron.run);
                job.start();
            }

        }
    }

    module(name) {
        return this.score_module[name] || null
    }

    getRuleType(name) {
        let module = this.score_module[name]
        if (module) {
            let arr = []
            for (let key in module.rules) {
                let item = module.rules[key]
                arr.push({name: item.name, rule: key, default: item.default})
            }
            return arr
        }
    }
}

let score = new Score()
let files = require('fs').readdirSync(__dirname + '/rule');
files.forEach(f =>score.setup(f.replace('.js',''), require(__dirname + '/rule/' + f)))

// 全局暴露
global.$ScoreModule = score

module.exports = score
