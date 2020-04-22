const L = require('debug')('app:cron');
var CronJob = require('cron').CronJob;
const {pushMsg} = require('../api/notification/notification.controller')

const Company = require('@company/company.model');
const Journalmgr = require('../api/journalmgr/journalmgr.model');
const Reportdata = require('../api/reportdata/reportdata.model');
const User = require('../api/user/user.model');
const Journalsettemplate = require('../api/journalset/journalsettemplate.model')
const Transaction = require('../api/finance/transaction.model')

const moment = require('moment');

let attendanceCrons = {}
let transactionCrons = []
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

// return
async function report() {
    // 汇报未读消息推送
    Reportdata.find((err, reports) => {
        let push = new Map()
        reports.map(report => {
            if (report.status === '未读' && report.approver.length) {
                report.approver.forEach((uid) => {
                    let unread = push.get(uid) || 0
                    push.set(uid, unread + 1)
                })
            }
        })
        let crons = []
        for (let [key, value] of push) {
            crons.push(createCron(toCronTime(toDate('22:00',0), 'day'), {
                userId: key,
                category: '汇报',
                content: `亲，您还有${value}条汇报未读`,
                title: '汇报',
            }))
        }

        attendanceCrons['report'] = crons
    })
}

async function Journal() {
    // 日报未读消息推送
    Journalmgr.find((err, journalmgrs) => {
        let push = new Map()
        journalmgrs.map(journal => {
            if (journal.status === '未读' && journal.approver.length) {
                journal.approver.forEach((uid) => {
                    let unread = push.get(uid) || 0
                    push.set(uid, unread + 1)
                })
            }
        })
        let crons = []
        for (let [key, value] of push) {
            crons.push(createCron(toCronTime(toDate('22:00', 0), 'day'), {
                userId: key,
                category: '日报',
                content: `亲，您还有${value}条日报未读`,
                title: '日报',
            }))
        }

        attendanceCrons['Journal'] = crons
    })
}

async function JournalNoSubmit () {
    // 不提交日报
    Company.find((err, companys) => {
        companys.forEach(async company => {
            if (!isHoliday(company.holidays, new Date())) {
                let crons = []
                // 不是节假日
                let users = await User.find({companyId: company._id});
                users.map(async v => {
                    let department = userDepartment(v._id, company)
                    if(!department)return

                    let template = await Journalsettemplate.findOne({department: department.departmentId})
                    if(!template)return

                    let startDate = '';
                    let endDate = '';
                    let now = moment().format("YYYY-MM-DD");
                    let endTime = ''

                    if (template.period == 'day') {
                        // 不是提交日
                        if (!template.days.filter((v) => v == new Date().getDay()).length) return
                        startDate = moment().format("YYYY-MM-DD");
                        endDate = moment().format("YYYY-MM-DD");
                        endTime = template.endTime
                    } else if(template.period == 'week') {
                        startDate = moment().day(template.startTimeOfWeek[0]).format("YYYY-MM-DD");
                        endDate = moment().day(template.endTimeOfWeek[0]).format("YYYY-MM-DD");
                        endTime = template.endTimeOfWeek[1]
                        if (moment(now).isBefore(startDate) || moment(now).isAfter(endDate)) return
                    } else if(template.period == 'month') {
                        startDate = moment().format("YYYY-MM") + '-' + (template.startTimeOfMonth[0] < 10 ? '0' + template.startTimeOfMonth[0] : template.startTimeOfMonth[0]);
                        endDate = moment().format("YYYY-MM") + '-' + (template.endTimeOfMonth[0] < 10 ? '0' + template.endTimeOfMonth[0] : template.endTimeOfMonth[0]);
                        endTime = template.endTimeOfMonth[1]
                        if (moment(now).isBefore(startDate) || moment(now).isAfter(endDate)) return
                    }

                    let daily_list = await Journalmgr.find({
                        applicant: v._id,
                        rtype: "日报",
                        createdAt: {
                            $gte: new Date(startDate + ' 00:00:00'),
                            $lte: new Date(endDate + ' 23:59:59.999')
                        }
                    })
                    if (!daily_list.length) {
                        let time = template.remindTime || 0
                        crons.push(createCron(toCronTime(toDate(`${endTime < 10 ? '0' + endTime : endTime}:00`, -time), 'day'), {
                            userId: v._id,
                            category: '日报',
                            content: `亲，你今天的日报还没提交`,
                            title: '日报',
                        }))
                    }
                })
                attendanceCrons['Journal' + company._id] = crons
            }
        })
    })
}

async function attendance() {
    Company.find((err, companys) => {
        companys.forEach(company => {
            let cronData = []
            company.timeCards.forEach(tc => {
                if (tc.type != '上下班打卡') return
                let users = tc.owners
                let start = []
                let end = []
                let crons = []
                let week = new Date().getDay();
                week = week === 0 ? 6 : week - 1;
                if (tc.workDays[week] && !isHoliday(company.holidays, new Date())) {
                    tc.workTimes.forEach(wt => {
                        start.push(wt.start)
                        end.push(wt.end)
                        users.forEach(user => {
                            crons.push(createCron(toCronTime(toDate(wt.start, -10), 'day'), {
                                userId: user,
                                category: "考勤",
                                content: '亲，您还有10分钟就要上班了，请记得打卡',
                                title: "考勤",
                            }))
                            crons.push(createCron(toCronTime(toDate(wt.end, 0), 'day'), {
                                userId: user,
                                category: "考勤",
                                content: '亲，您的下班时间到了，请记得打卡',
                                title: "考勤",
                            }))
                        })
                    })
                    cronData.push({timeCards: tc._id, crons, users, start, end})
                }
            });
            attendanceCrons[company._id] = cronData
        })
    })
}


function createCron(cronTime, msg) {
    // console.log(cronTime,msg)
    let job = new CronJob(cronTime, () => {
        L('pushMsg ' + cronTime + ' ' + msg.content);
        pushMsg(msg)
    });
    job.start()
    return job
}

function toCronTime(date, rule) {
    const W = date.getDay()
    const M = date.getMonth() + 1
    const D = date.getDate()
    const h = date.getHours()
    const m = date.getMinutes()
    const s = date.getSeconds()
    let timeArr
    if (rule == 'day') {
        timeArr = [s, m, h, '*', '*', '*']
    } else if (rule == 'month') {
        timeArr = [s, m, h, D, '*', '*']
    } else if (rule == 'Week') {
        timeArr = [s, m, h, D, M, '*']
    } else {
        timeArr = [s, m, h, D, M, W]
    }
    let str = timeArr.join(' ')
    return str
}

// 08:00时间转换Date对象 m分钟的差值
function toDate(timepoint, m, date) {
    let time = timepoint.split(':');
    let d = date ? new Date(date.getTime()) : new Date();
    d.setHours(parseInt(time[0]));
    d.setMinutes(parseInt(time[1]));
    d.setSeconds(parseInt(time[2] ? time[2] : '0'));
    d.setMilliseconds(0);
    d.setMinutes(d.getMinutes() + m)
    return d;
}

function clearCron(){
    for (let key in attendanceCrons) {
        attendanceCrons[key].forEach(item=>item.crons.forEach(job=>job.stop()));
    }
    transactionCrons.forEach(item=>item.stop())
}

async function finance() {
    let data = {
        date: moment().format("YYYY-MM-DD"),
        status:{$ne:'已完成'}
    }
    let list = await Transaction.find(data)
    list.forEach(item=>{
        transactionCrons.push(createCron('0 0 8 * * *',{
            userId: item.lister,
            category: "财务管理",
            content: '您今天有一笔'+item.code+'账款需要处理，再不处理就过期了，请查看',
            title: "账款处理",
        }))
        if(item.agent && item.lister != item.agent){
            transactionCrons.push(createCron('0 0 8 * * *',{
                userId: item.agent,
                category: "财务管理",
                content: '您今天有一笔'+item.code+'账款需要处理，再不处理就过期了，请查看',
                title: "账款处理",
            }))
        }
    })
}

// 每天三点 重新计算
new CronJob('0 0 3 * * *', () => {
    // 清除历史定时器
    clearCron()
    // 重新扫描任务
    attendance()
    Journal()
    report()
    JournalNoSubmit()
    finance()
}).start();

attendance()
Journal()
report()
JournalNoSubmit()
finance()
