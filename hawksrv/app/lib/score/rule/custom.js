const L = require('debug')('Score:Custom')
const ScoreRuleModel = require('../../../api/score/scorerule.model')
const Score = require('../../../api/score/score.model')
const timetool = require('../lib/time')
const {pushMsg} = require('../../../api/notification/notification.controller')

async function doScore(item, date) {
    item.rules.forEach(curr_rule => {
        item.users.forEach(async user => {
            let score
            if (curr_rule.rule == 'add') {
                score = {
                    user: user,
                    at: date.to,
                    type: '自定义加减',
                    category: "加分",
                    quantity: null,
                    score: curr_rule.value,
                    rule: curr_rule,
                    detail: date.to.toHawkDateString() +" "+ item.title
                };
                await Score.create(score);
                pushMsg({
                    userId: user,
                    category: "工作考核",
                    content: '亲，你因为' + item.title + '，被奖励分：' + curr_rule.value + '分',
                    title: "加分",
                    // scheduleTime: toDate('08:00').toHawkString()
                });
            } else if (curr_rule.rule == 'sub') {
                score = {
                    user: user,
                    at: date.to,
                    type: '自定义加减',
                    category: "减分",
                    quantity: null,
                    score: curr_rule.value,
                    rule: curr_rule,
                    detail: date.to.toHawkDateString() +" "+ item.title
                };
                await Score.create(score);
                pushMsg({
                    userId: user,
                    category: "工作考核",
                    content: '亲，你因为' + item.title + '，被扣分：' + curr_rule.value + '分',
                    title: "扣分",
                    // scheduleTime: toDate('08:00').toHawkString()
                });
            }
        })
    })
    item.run = false
    item.status = '完成'
    item.save();
}

const ScoreRule = {
    name: "自定义加减分",
    cron: [{
        open: true,
        time: '0 2 0 * * *',
        run: async function (prarms) {
            L('Cron::XX')
            try {
                const date = timetool.getDayFilter()
                let list = await ScoreRuleModel.find({
                    "ruleModule": "custom",
                    "run": true,
                    // "date.from": {$lte: date.from},
                    // "date.to": {$gte: date.to}
                })
                list = list.filter(item => timetool.intersectionTime(item.date, date))
                list.forEach(async item => {
                    await doScore(item, date)
                })
            } catch (error) {
                console.log(error)
            }
        }
    }],
    event: [
        {
            name: "then",
            open: true,
            run: async function (item) {
                try {
                    L('Event::XX(' + JSON.stringify(item) + ')')
                    const date = timetool.getDayFilter()
                    if (item.run && timetool.intersectionTime(item.date, date)) {
                        await doScore(item, date)
                    }
                } catch (error) {
                    console.log(error)
                }
            }
        }
    ],
    rules: {
        "add": {
            name: "加分",
            event: {
                open: true,
                run: async function (prarms) {
                    try {
                        L('Event::finish(' + JSON.stringify(prarms) + ')')

                    } catch (e) {

                    }
                }
            },
            default: {title: "加分", valueType: 'add', value: 10}
        },
        "sub": {
            name: "减分",
            default: {title: "减分", valueType: 'sub', value: 10}
        }
    }
}
// ScoreRule.cron[0].run() //测试用
module.exports = ScoreRule