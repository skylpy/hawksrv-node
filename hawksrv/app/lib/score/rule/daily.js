const L = require('debug')('Score:Daily')
const JournalMgr = require('../../../api/journalmgr/journalmgr.model')
const Journalsettemplate = require('../../../api/journalset/journalsettemplate.model')
const Company = require('../../../api/company/company.model')
const ScoreRuleModel = require('../../../api/score/scorerule.model')
const Score = require('../../../api/score/score.model')
const timetool = require('../lib/time')
const {pushMsg} = require('../../../api/notification/notification.controller')
const moment = require('moment');
let listD = function (d) {
    return d.sub.slice(0).concat(d.sub.reduce((accum, s) => {
        return accum.concat(listD(s))
    }, []));
}
let userDepartment = function (uid,company) {
    let dList = listD(company.organization).filter(d => d.employees.includes(uid.toString()));
    return dList.length > 0 ? dList[0] : null;
}
// 假日
const isHoliday = (holidays, date) => {
    let ret = false;
    holidays.forEach(h => {
        let holiday = new Date(h);
        if (holiday.toHawkDateString() == date.toHawkDateString()) {
            ret = true;
        }
    })
    return ret;
}

const ScoreRule = {
    name: "日报",
    rules: {
        "no": {
            name: "不交日报",
            cron: {
                open: true,
                time: '0 5 0 * * *', //第二天凌晨统计
                run: async function () {
                    L('Cron::no 不交日报')
                    try {
                        // 所有日报考核
                        const date = timetool.getDayFilter(-1) // 昨天日报
                        let list = await ScoreRuleModel.find({
                            "ruleModule": "daily",
                            "rules.rule": "no",
                            run: true,
                            // "date.from": {$lte: date.from},
                            // "date.to": {$gte: date.to}
                        })
                        list = list.filter(item => timetool.intersectionTime(item.date, date))
                        list.forEach(async item => {
                            let curr_rule
                            item.rules.forEach(async rule => {
                                if (rule.rule == "no") {//不交日报规则
                                    curr_rule = rule //最后一次有效
                                }
                            })

                            let company = await Company.findById(item.company, '-__v');

                            item.users.forEach(async user => {

                                let department = userDepartment(user, company)
                                if(!department)return

                                let template = await Journalsettemplate.findOne({department:department.departmentId})
                                if(!template)return

                                // 判断是否是节假日
                                if (isHoliday(company.holidays, date.to)) return

                                let startDate = '';
                                let endDate = '';
                                let now = moment(date.to).format("YYYY-MM-DD");

                                if (template.period == 'day') {
                                    // 不是提交日
                                    if (!template.days.filter((v) => v == moment(date.to).day()).length) return

                                    startDate = moment(date.to).format("YYYY-MM-DD");
                                    endDate = moment(date.to).format("YYYY-MM-DD");

                                } else if(template.period == 'week'){
                                    startDate = moment(date.to).day(template.startTimeOfWeek[0]).format("YYYY-MM-DD");
                                    endDate = moment(date.to).day(template.endTimeOfWeek[0]).format("YYYY-MM-DD");
                                    // 不是提交日最后一天
                                    if (now != endDate) return

                                } else if(template.period == 'month'){
                                    startDate = moment(date.to).format("YYYY-MM") + '-' + (template.startTimeOfMonth[0] < 10 ? '0' + template.startTimeOfMonth[0] : template.startTimeOfMonth[0]);
                                    endDate = moment(date.to).format("YYYY-MM") + '-' + (template.endTimeOfMonth[0] < 10 ? '0' + template.endTimeOfMonth[0] : template.endTimeOfMonth[0]);
                                    // 不是提交日最后一天
                                    if (now != endDate) return

                                }

                                let daily_list = await JournalMgr.find({
                                    applicant: user,
                                    rtype: "日报",
                                    createdAt: {
                                        $gte: new Date(startDate + ' 00:00:00'),
                                        $lte: new Date(endDate + ' 23:59:59.999')
                                    }
                                })
                                if (daily_list.length) {
                                    // 有交日报 不扣分
                                    console.log(daily_list)
                                } else {
                                    //不交日服 扣分
                                    let score = {
                                        user: user,
                                        at: date.to,
                                        type: '日报',
                                        category: "不交日报",
                                        quantity: 1,
                                        score: curr_rule.value,
                                        rule: curr_rule,
                                        detail: date.to.toHawkDateString() + " 不交日报"
                                    };
                                    let list = await Score.find(score);
                                    if (!list.length) {
                                        await Score.create(score);
                                        pushMsg({
                                            userId: user,
                                            category: "工作考核",
                                            content: '亲，你因为昨天不交日报，被扣分：' + curr_rule.value + '分',
                                            title: "日报",
                                        });
                                    }
                                }
                            })
                        })
                    } catch (e) {

                    }
                }
            },
            default: {title: "不交日报", valueType: 'sub', value: 100}
        }
    }
}
// ScoreRule.rules.no.cron.run() //测试用
module.exports = ScoreRule
