const L = require('debug')('Score:Visit')
const Visit = require('../../../api/visit/visit.model')
const ScoreRuleModel = require('../../../api/score/scorerule.model')
const Score = require('../../../api/score/score.model')
const timetool = require('../lib/time')
const {pushMsg} = require('../../../api/notification/notification.controller')

const ScoreRule = {
    name: "拜访",
    rules: {
        "no": {
            name: "未完成拜访",
            cron: {
                open: true,
                time: '0 5 0 * * *', //第二天凌晨统计
                run: async function (prarms) {
                    L('Event::no(' + JSON.stringify(prarms) + ')')
                    try {
                        // 所有日报考核
                        const date = timetool.getDayFilter(-1) // 昨天拜访
                        let list = await ScoreRuleModel.find({
                            "ruleModule": "visit",
                            "rules.rule": "no",
                            "run": true
                        })
                        list = list.filter(item => timetool.intersectionTime(item.date, date))
                        list.forEach(async item => {
                            let curr_rule
                            item.rules.forEach(async rule => {
                                if (rule.rule == "no") {//不交日报规则
                                    curr_rule = rule //最后一次有效
                                }
                            })
                            if (!curr_rule) return
                            item.users.forEach(async user => {
                                let visit_list = await Visit.find({
                                    executor: user,
                                    // deadline: {$gte: date.from, $lte: date.to}
                                })
                                //有拜访记录
                                if (visit_list.length) {
                                    let score
                                    visit_list.forEach(async visit => {
                                        //['未完成', '已完成', '已失访']
                                        if (visit.status == '未完成') {
                                            score = {
                                                user: user,
                                                at: date.to,
                                                type: '拜访',
                                                category: "未完成拜访",
                                                quantity: null,
                                                score: curr_rule.value,
                                                rule: curr_rule,
                                                ref: visit,
                                                detail: date.to.toHawkDateString() + " 未完成拜访",
                                            };
                                            let list = await Score.find(score);
                                            if (!list.length) {
                                                await Score.create(score);
                                                pushMsg({
                                                    userId: user,
                                                    category: "工作考核",
                                                    content: '亲，您因为未完成拜访，被扣分：' + curr_rule.value + '分',
                                                    title: "未完成拜访",
                                                });
                                            }
                                        } else if (visit.status == '已失访') {

                                        } else if (visit.status == '已完成' && this.finishedAt && visit.deadline < visit.finishedAt) {
                                            //迟拜访

                                        } else if (visit.status == '已完成') {
                                            return
                                        }
                                    })
                                }
                            })
                        })
                    } catch (e) {

                    }
                }
            },
            default: {title: "未完成拜访", valueType: 'sub', value: 100}
        },
        "visitCount": {
            name: "走访拜访数",
            cron: {
                open: true,
                time: '0 5 0 * * *', //第二天凌晨统计
                run: async function () {
                    let dayDate = timetool.getDayFilter(-1) // 昨天拜访
                    let weekDate
                    let monthDate
                    if (new Date().getDay() == 1) {
                        weekDate = {
                            form: timetool.getDayFilter(-7 + -1).from,
                            to: timetool.getDayFilter(-1).to
                        }
                    }
                    if (new Date().getDate() == 1) {
                        monthDate = timetool.getMonthFilter(-1)
                    }

                    let list = await ScoreRuleModel.find({
                        "ruleModule": "visit",
                        "rules.rule": "visitCount",
                        "run": true
                    })
                    list = list.filter(item => timetool.intersectionTime(item.date, dayDate))
                    list.forEach(async item => {
                        item.rules.forEach(async cr => {
                            let curr_rule = JSON.parse(JSON.stringify(cr))
                            if (curr_rule.rule == "visitCount") {
                                let type = curr_rule.more.type.value
                                let date
                                if (type == '每日') {
                                    date = dayDate
                                }
                                if (type == '每周') {
                                    date = weekDate
                                }
                                if (type == '每月') {
                                    date = monthDate
                                }
                                if (!date) return
                                item.users.forEach(async user => {
                                    let visit_list = await Visit.find({
                                        executor: user,
                                        status: '已完成',
                                        type: '走访',
                                        finishedAt: {$gte: date.from, $lte: date.to}
                                    })
                                    const count = visit_list.length
                                    if (count >= curr_rule.unitValue) {
                                        //加分
                                        if(curr_rule.more.add.value==0)return
                                        score = {
                                            user: user,
                                            at: date.to,
                                            type: '拜访',
                                            category: "走访拜访数",
                                            quantity: null,
                                            score: curr_rule.more.add.value,
                                            rule: {...curr_rule, valueType: 'add', value: curr_rule.more.add.value},
                                            // ref: visit,
                                            detail: date.to.toHawkDateString() + " 完成走访拜访数",
                                        };
                                        let list = await Score.find(score);
                                        if (!list.length) {
                                            await Score.create(score);
                                            pushMsg({
                                                userId: user,
                                                category: "工作考核",
                                                content: '亲，您因为完成走访拜访数，被奖励：' + curr_rule.more.add.value + '分',
                                                title: "完成拜访数",
                                            });
                                        }
                                    } else {
                                        //扣分
                                        if(curr_rule.more.sub.value==0)return
                                        score = {
                                            user: user,
                                            at: date.to,
                                            type: '拜访',
                                            category: "走访拜访数",
                                            quantity: null,
                                            score: curr_rule.more.sub.value,
                                            rule: {...curr_rule, valueType: 'sub', value: curr_rule.more.sub.value},
                                            // ref: visit,
                                            detail: date.to.toHawkDateString() + " 未完成走访拜数",
                                        };
                                        let list = await Score.find(score);
                                        if (!list.length) {
                                            await Score.create(score);
                                            pushMsg({
                                                userId: user,
                                                category: "工作考核",
                                                content: '亲，您因为未完成走访拜访数，被扣分：' + curr_rule.more.sub.value + '分',
                                                title: "未完成拜访",
                                            });
                                        }
                                    }
                                })
                            }
                        })
                    })
                }
            },
            default: {
                title: "走访拜访数",
                unit: "人数",
                unitValue: 0,
                more: {
                    add: {
                        title: "加分",
                        value: 0,
                        valueType: 'add'
                    },
                    sub: {
                        title: "减分",
                        value: 0,
                        valueType: 'sub'
                    },
                    type: {
                        title: "周期",
                        value: '每日',
                        valueType: 'enum',
                        cols: [{
                            // displayValues: ['每日','每周','每月'],
                            values: ['每日', '每周', '每月']
                        }]
                    }
                },
            }
        },
        "phoneCount": {
            name: "电话拜访数",
            cron: {
                open: true,
                time: '0 5 0 * * *', //第二天凌晨统计
                run: async function () {
                    let dayDate = timetool.getDayFilter(-1) // 昨天拜访
                    let weekDate
                    let monthDate
                    if (new Date().getDay() == 1) {
                        weekDate = {
                            form: timetool.getDayFilter(-7 + -1).from,
                            to: timetool.getDayFilter(-1).to
                        }
                    }
                    if (new Date().getDate() == 1) {
                        monthDate = timetool.getMonthFilter(-1)
                    }

                    let list = await ScoreRuleModel.find({
                        "ruleModule": "visit",
                        "rules.rule": "phoneCount",
                        "run": true
                    })
                    list = list.filter(item => timetool.intersectionTime(item.date, dayDate))
                    list.forEach(async item => {
                        item.rules.forEach(async cr => {
                            let curr_rule = JSON.parse(JSON.stringify(cr))
                            if (curr_rule.rule == "phoneCount") {
                                let type = curr_rule.more.type.value
                                let date
                                if (type == '每日') {
                                    date = dayDate
                                }
                                if (type == '每周') {
                                    date = weekDate
                                }
                                if (type == '每月') {
                                    date = monthDate
                                }
                                if (!date) return
                                item.users.forEach(async user => {
                                    let visit_list = await Visit.find({
                                        executor: user,
                                        status: '已完成',
                                        type: '电话',
                                        finishedAt: {$gte: date.from, $lte: date.to}
                                    })
                                    const count = visit_list.length
                                    if (count >= curr_rule.unitValue) {
                                        //加分
                                        score = {
                                            user: user,
                                            at: date.to,
                                            type: '拜访',
                                            category: "电话拜访数",
                                            quantity: null,
                                            score: curr_rule.more.add.value,
                                            rule: {...curr_rule, valueType: 'add', value: curr_rule.more.add.value},
                                            // ref: visit,
                                            detail: date.to.toHawkDateString() + " 完成电话拜访数",
                                        };
                                        let list = await Score.find(score);
                                        if (!list.length) {
                                            await Score.create(score);
                                            pushMsg({
                                                userId: user,
                                                category: "工作考核",
                                                content: '亲，您因为完成电话拜访数，被奖励：' + curr_rule.more.add.value + '分',
                                                title: "完成电话拜访数",
                                            });
                                        }
                                    } else {
                                        //扣分
                                        score = {
                                            user: user,
                                            at: date.to,
                                            type: '拜访',
                                            category: "电话拜访数",
                                            quantity: null,
                                            score: curr_rule.more.sub.value,
                                            rule: {...curr_rule, valueType: 'sub', value: curr_rule.more.sub.value},
                                            // ref: visit,
                                            detail: date.to.toHawkDateString() + " 未完成电话拜访数",
                                        };
                                        let list = await Score.find(score);
                                        if (!list.length) {
                                            await Score.create(score);
                                            pushMsg({
                                                userId: user,
                                                category: "工作考核",
                                                content: '亲，您因为未完成电话拜访数，被扣分：' + curr_rule.more.sub.value + '分',
                                                title: "未完电话成拜访数",
                                            });
                                        }
                                    }
                                })
                            }
                        })
                    })
                }
            },
            default: {
                title: "电话拜访数",
                unit: "人数",
                unitValue: 0,
                more: {
                    add: {
                        title: "加分",
                        value: 0,
                        valueType: 'add'
                    },
                    sub: {
                        title: "减分",
                        value: 0,
                        valueType: 'sub'
                    },
                    type: {
                        title: "周期",
                        value: '每日',
                        valueType: 'enum',
                        cols: [{
                            // displayValues: ['每日','每周','每月'],
                            values: ['每日', '每周', '每月']
                        }]
                    }
                },
            }
        }
    }
}
// ScoreRule.rules.no.cron.run() //测试用
// ScoreRule.rules.visitCount.cron.run() //测试用
// ScoreRule.rules.phoneCount.cron.run() //测试用
module.exports = ScoreRule
