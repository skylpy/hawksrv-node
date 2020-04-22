const L = require('debug')('Score:Report')
const timeTool = require('../lib/time')
const Task = require('../../../api/task/task.model')
const Score = require('../../../api/score/score.model')
const Scorerule = require('../../../api/score/scorerule.model')
const {pushMsg} = require('../../../api/notification/notification.controller')
const ScoreRule = {
    name: "任务",
    rules: {
        "finish": {
            name: "完成任务",
            event: {
                open: true,
                run: async function (prarms) {
                    L('Event::finish(' + JSON.stringify(prarms) + ')')
                    try {
                        let {task} = prarms
                        let scorerule = await Scorerule.find({
                            ruleModule: 'task',
                            'rules.rule': 'finish',
                            users: task.executor,
                            run: true
                        })
                        // await Score.deleteMany({'ref._id': task._id, 'category': '完成任务'});//防止多次添加
                        scorerule.forEach(sr => {
                            sr.rules.forEach(async rule => {
                                if (rule.rule == 'finish') {
                                    let score = {
                                        user: task.executor,
                                        at: new Date(),
                                        type: '任务',
                                        category: "完成任务",
                                        quantity: null,
                                        score: rule.value,
                                        rule: rule,
                                        ref: task,
                                        detail: new Date().toHawkDateString() + " 完成任务",
                                    };
                                    let list = await Score.find(score);
                                    if (!list.length) {
                                        await Score.create(score);
                                        pushMsg({
                                            userId: task.executor,
                                            category: "工作考核",
                                            content: '亲，您因为完成任务，被加分：' + rule.value + '分',
                                            title: "完成任务"
                                        });
                                    }
                                }
                            })
                        })
                    } catch (e) {

                    }
                }
            },
            default: {title: "任务完成", valueType: 'add', value: 100}
        },
        "unfinished": {
            name: "未完成任务",
            cron: {
                open: true,
                time: '0 0 0 * * *',
                run: async function (prarms) {
                    L('Event::unfinished(' + JSON.stringify(prarms) + ')')
                    try {
                        let date = timeTool.getDayFilter(-1)
                        let taskList = await Task.find({deadline: {$gte: date.from, $lte: date.to}, auditType: '未审核'})
                        let users = taskList.map(t => t.executor)
                        let scorerules = await Scorerule.find({
                            ruleModule: 'task',
                            'rules.rule': 'unfinished',
                            users: {$in: users},
                            run: true
                        })
                        scorerules = scorerules.filter(sr => timeTool.intersectionTime(sr.date, date))// 时间校验
                        taskList.forEach(task => {
                            scorerules.forEach(sr => {
                                let flag = sr.users.filter(u => task.executor.toString() == u.toString())
                                if (flag.length) {
                                    sr.rules.forEach(async rule => {
                                        if (rule.rule == 'unfinished') {
                                            let score = {
                                                user: task.executor,
                                                at: new Date(),
                                                type: '任务',
                                                category: "未完成任务",
                                                quantity: null,
                                                score: rule.value,
                                                rule: rule,
                                                ref: task,
                                                detail: date.to.toHawkDateString() + " 未完成任务",
                                            };
                                            let list = await Score.find(score);
                                            if (!list.length) {
                                                await Score.create(score);
                                                pushMsg({
                                                    userId: task.executor,
                                                    category: "工作考核",
                                                    content: '亲，您因为未完成任务，被扣分：' + rule.value + '分',
                                                    title: "未完成任务",
                                                    scheduleTime: toDate('08:00').toHawkString()
                                                });
                                            }
                                        }
                                    })
                                }
                            })
                        })
                    } catch (e) {

                    }
                }
            },
            event: {
                open: true,
                run: async function (prarms) {
                    L('Event::unfinished(' + JSON.stringify(prarms) + ')')
                    try {
                        let {task} = prarms
                        let scorerule = await Scorerule.find({
                            ruleModule: 'task',
                            'rules.rule': 'unfinished',
                            users: task.executor,
                            run: true
                        })
                        // await Score.deleteMany({'ref._id': task._id, 'category': '完成任务'});//防止多次添加
                        scorerule.forEach(sr => {
                            sr.rules.forEach(async rule => {
                                if (rule.rule == 'unfinished') {
                                    let score = {
                                        user: task.executor,
                                        at: new Date(),
                                        type: '任务',
                                        category: "未完成任务",
                                        quantity: null,
                                        score: rule.value,
                                        rule: rule,
                                        ref: task,
                                        detail: new Date().toHawkDateString() + " 未完成任务",
                                    };
                                    let list = await Score.find(score);
                                    if (!list.length) {
                                        await Score.create(score);
                                        pushMsg({
                                            userId: task.executor,
                                            category: "工作考核",
                                            content: '亲，您因为未完成任务，被扣分：' + rule.value + '分',
                                            title: "未完成任务"
                                        });
                                    }
                                }
                            })
                        })
                    } catch (e) {

                    }
                }
            },
            default: {title: "未完成任务", valueType: 'sub', value: 100}
        }
    }
}
// ScoreRule.rules.unfinished.cron.run() //测试用
// ScoreRule.rules.finish.event.run() //测试用
module.exports = ScoreRule
