const ReportData = require('../../../api/reportdata/reportdata.model')
const ReportTemplateSchema = require('../../../api/reporttemplate/reporttemplate.model')
const Company = require('../../../api/company/company.model')
const ScoreRules = require('../../../api/score/scorerule.model')
const Score = require('../../../api/score/score.model')
const timeTool = require('./time')
const {pushMsg} = require('../../../api/notification/notification.controller')
const toDate = timeTool.toDate
const moment = require('moment');

// 从规则组中 检索配置的规则
function getUserRule(scorerules, company, user) {
    return scorerules.filter(scorerule => {
        return scorerule.company.toString() == company.toString() && (scorerule.users.filter(sUser => sUser.toString() == user.toString()).length > 0)
    })
}

async function checkReport(date) {
    let scorerules = await ScoreRules.find({ruleModule: 'report', run: true})//, 'rules.rule': 'datatemplate'
    scorerules = scorerules.filter(sr => timeTool.intersectionTime(sr.date, date))// 时间校验
    let companyArr = []
    scorerules.forEach(scorerule => {
        if (!companyArr.includes(scorerule.company.toString())) companyArr.push(scorerule.company.toString())
    })
    // console.log('companyArr', companyArr)
    // 获取所有参与考核的模版
    let reportTemplates = await ReportTemplateSchema.find({
        company: {$in: companyArr}
        // 'items.score.rule': 'report_custom'
    })
    // console.log('reportTemplates', reportTemplates)
    reportTemplates.forEach(async rt => {
        let company = await Company.findById(rt.company)
        if (!company) return
        let departmentList = listD(company.organization)
        let departments = departmentList.filter(d => d.departmentId.toString() == rt.department.toString())
        if (departments.length) {
            let users = departments[0].employees
            // let admins = departments[0].admin
            // 数据考核、不交汇报和阅读汇报
            users.forEach(async user => {

                let userRule = getUserRule(scorerules, rt.company, user)
                if (!userRule.length) return // 该用户没有列入考核

                // 获取该用户的考核数据
                let userReports = await ReportData.find(
                    {user, template: rt._id, createdAt: {$gte: date.from, $lte: date.to}},
                    null,
                    {sort: {createdAt: -1}}//如有重复，[0]取最后一条
                )

                if (userReports.length) {
                    // 已交汇报 进入数据考核
                    let userReport = userReports[0] // 多次提交 取最后一次提交记录

                    userRule.forEach(ur => {
                        ur.rules.forEach(async r => {
                            if (r.rule == "noRead") {
                                // 管理员 不阅读汇报
                                if (userReport.approver && userReport.approver.length && userReport.status == "未读") {
                                    userReport.approver.map(async (v) => {
                                        let score = {
                                            user: v,
                                            at: date.to,
                                            type: '汇报',
                                            category: r.title,
                                            score: r.value,
                                            rule: r,
                                            detail: `${date.to.toHawkDateString()} ${r.title}`
                                        };
                                        let list = await Score.find(score);
                                        if (!list.length) {
                                            await Score.create(score)
                                            pushMsg({
                                                userId: user,
                                                category: "工作考核",
                                                content: '亲，您因为昨天不阅读员工汇报，被扣分：' + r.value + '分',
                                                title: "汇报",
                                                scheduleTime: toDate('08:00').toHawkString()
                                            });
                                        }
                                    })
                                }

                            } else if (r.rule == 'datatemplate') {
                                rt.items.forEach(item_rt => {
                                    userReport.items.forEach(async item_ur => {
                                        if (item_rt.name == item_ur.name) {
                                            // 加分
                                            if (item_rt.targetValue <= item_ur.value) {
                                                let rule = item_rt.score.filter(rule => rule.valueType == 'add').sort((a, b) => b.unitValue - a.unitValue)
                                                for (let k in rule) {
                                                    if (rule[k].unitValue <= item_ur.value) {
                                                        rule[k].value //要加的分数
                                                        let score = {
                                                            user: user,
                                                            at: date.to,
                                                            type: '汇报',
                                                            category: '数据考核',
                                                            score: rule[k].value,
                                                            rule: rule[k],
                                                            detail: `${date.to.toHawkDateString()} ${item_ur.name} ${rule[k].unitValue}`
                                                        };
                                                        let list = await Score.find(score);
                                                        if (!list.length) {
                                                            await Score.create(score)
                                                            pushMsg({
                                                                userId: user,
                                                                category: "工作考核",
                                                                content: '亲，您因为昨天业绩已经超额达标（' + item_ur.name + '），被加分：' + rule[k].value + '分',
                                                                title: "汇报",
                                                                scheduleTime: toDate('08:00').toHawkString()
                                                            });
                                                        }
                                                        break;
                                                    }
                                                }
                                            } else {
                                                let rule = item_rt.score.filter(rule => rule.valueType == 'sub').sort((a, b) => a.unitValue - b.unitValue)
                                                for (let k in rule) {
                                                    if (rule[k].unitValue > item_ur.value) {
                                                        rule[k].value //要减的分数
                                                        let score = {
                                                            user: user,
                                                            at: date.to,
                                                            type: '汇报',
                                                            category: '数据考核',
                                                            score: rule[k].value,
                                                            rule: rule[k],
                                                            detail: `${date.to.toHawkDateString()} ${item_ur.name} ${rule[k].unitValue}`
                                                        };
                                                        let list = await Score.find(score);
                                                        if (!list.length) {
                                                            await Score.create(score)
                                                            pushMsg({
                                                                userId: user,
                                                                category: "工作考核",
                                                                content: '亲，您因为昨天业绩不达标（' + item_ur.name + '），被扣分：' + rule[k].value + '分',
                                                                title: "汇报",
                                                                scheduleTime: toDate('08:00').toHawkString()
                                                            });
                                                        }
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    })
                                })

                            }
                        })
                    })

                } else {
                    // 不交汇报
                    // 判断是否是节假日，提交周期而进行是否扣分
                    let isDo = true
                    if (rt.period == 'day') {
                        isDo = rt.days.filter((v) => v == moment(date.to).day()).length
                    } else if (rt.period == 'week' && rt.startTimeOfWeek.length === 2 && rt.endTimeOfWeek.length === 2) {
                        let start = moment(date.to).day(rt.startTimeOfWeek[0]).format("YYYY-MM-DD");
                        let end = moment(date.to).day(rt.endTimeOfWeek[0]).format("YYYY-MM-DD");
                        let now = moment(date.to).format("YYYY-MM-DD");
                        if (now == end) {
                            let list = await ReportData.find({
                                user,
                                template: rt._id,
                                createdAt: {
                                    $gte: new Date(start + ' 00:00:00'),
                                    $lte: new Date(end + ' 23:59:59.999')
                                }
                            })
                            isDo = !list.length
                        } else {
                            isDo = false
                        }
                    } else if (rt.period == 'month' && rt.startTimeOfMonth.length === 2 && rt.endTimeOfMonth.length === 2) {
                        let start = moment(date.to).format("YYYY-MM") + '-' + (rt.startTimeOfMonth[0] < 10 ? '0' + rt.startTimeOfMonth[0] : rt.startTimeOfMonth[0]);
                        let end = moment(date.to).format("YYYY-MM") + '-' + (rt.endTimeOfMonth[0] < 10 ? '0' + rt.endTimeOfMonth[0] : rt.endTimeOfMonth[0]);
                        let now = moment(date.to).format("YYYY-MM-DD");
                        if (now == end) {
                            let list = await ReportData.find({
                                user,
                                template: rt._id,
                                createdAt: {
                                    $gte: new Date(start + ' 00:00:00'),
                                    $lte: new Date(end + ' 23:59:59.999')
                                }
                            })
                            isDo = !list.length
                        } else {
                            isDo = false
                        }
                    } else {
                        isDo = false
                    }
                    if (!isHoliday(company.holidays, date.to) && isDo) {
                        userRule.forEach(ur => {
                            ur.rules.forEach(async r => {
                                if (r.rule == "no") {
                                    let score = {
                                        user: user,
                                        at: date.to,
                                        type: '汇报',
                                        category: r.title,
                                        score: r.value,
                                        rule: r,
                                        detail: `${date.to.toHawkDateString()} ${r.title}`
                                    };
                                    let list = await Score.find(score);
                                    if (!list.length) {
                                        await Score.create(score);
                                        pushMsg({
                                            userId: user,
                                            category: "工作考核",
                                            content: '亲，你因为昨天不交汇报，被扣分：' + r.value + '分',
                                            title: "汇报",
                                            scheduleTime: toDate('08:00').toHawkString()
                                        });
                                    }
                                }
                            })
                        })
                    }
                }
            })
        }
    })
}

function listD(d) {
    return d.sub.slice(0).concat(d.sub.reduce((accum, s) => {
        return accum.concat(listD(s))
    }, []));
}

// 假日
function isHoliday(holidays, date) {
    let ret = false;
    holidays.forEach(h => {
        let holiday = new Date(h);
        if (holiday.toHawkDateString() == date.toHawkDateString()) {
            ret = true;
        }
    })
    return ret;
}

module.exports = {checkReport}
