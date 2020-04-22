const TimeRecord = require('../../../api/timerecord/timerecord.model')
const ScoreRule = require('../../../api/score/scorerule.model')
const Score = require('../../../api/score/score.model')
const timetool = require('./time')
const {pushMsg} = require('../../../api/notification/notification.controller')

// 获取当天的考勤状态
async function getCheckInfo(company, userId, myTimeCard, checkTime) {
    checkTime = checkTime || new Date()
    let list = []
    let date = checkTime.toHawkDateString() // 检索日期

    // 获取当天的打卡记录
    let timeRecord = await TimeRecord.find({userId, date})

    if (!isHoliday(company.holidays, checkTime) && isWorkDay(myTimeCard, checkTime)) {

        // 上下班打卡
        myTimeCard.workTimes.forEach((wt) => {
            let checkin, checkout
            timeRecord.forEach((item) => {
                item.records.forEach(async (record) => {

                    if (record.auditing == '0') {
                        return // 非定位打卡，审核被拒，当作未打卡
                    } else if (record.auditing == '-1') {
                        record.auditing = '2';
                        await item.save();
                    }


                    if (
                        record.type == '上班' ||
                        record.type == '迟到' ||
                        record.type == '下班' ||
                        record.type == '早退'
                    ) {
                        if (record.workTime.toString() == wt._id.toString()) {
                            if (!checkin && (record.type == '上班' || record.type == '迟到')) {
                                checkin = record//取列表第一个匹配值
                                if (record.type == '迟到') {
                                    let ms = toDate(record.time, checkTime).getTime() - toDate(wt.start, checkTime).getTime()
                                    let s = parseInt(ms / 1000 % 60)
                                    let m = parseInt(ms / 1000 / 60)
                                    checkin.quantity = m
                                    checkin.detail = date + ' 上班迟到' + m + '分' + s + '秒'
                                }
                            }
                            if (record.type == '下班' || record.type == '早退') {
                                checkout = record //取列表最后匹配值
                                if (record.type == '早退') {
                                    let ms = toDate(wt.end, checkTime).getTime() - toDate(record.time, checkTime).getTime()
                                    let s = parseInt(ms / 1000 % 60)
                                    let m = parseInt(ms / 1000 / 60)
                                    checkout.quantity = m
                                    checkout.detail = date + ' 下班早退' + m + '分' + s + '秒'
                                }
                            }
                        }
                    }
                })
            })
            // 上班漏卡判断
            if (!checkin) {
                let t = toDate(wt.start, checkTime)
                t.setHours(t.getHours() + 1) //迟到一小时算漏卡，无打迟到卡机会
                if (t < checkTime) {
                    checkin = {type: '漏卡'}
                    checkin.detail = date + ' 上班漏卡'
                }
            }
            // 下班漏卡判断
            if (!checkout) {
                if (toDate(wt.end_range, checkTime) < checkTime) {
                    checkout = {type: '漏卡'}
                    checkout.detail = date + ' 下班漏卡'
                }
            }
            // type:打卡类型 time:上下班时间
            list.push({
                type: '上班',
                time: wt.start,
                status: checkin ? checkin.type : '无',
                detail: checkin ? checkin.detail : '',
                checkTime: checkin ? checkin.time : '',
                quantity: checkin ? checkin.quantity : 0
            })
            list.push({
                type: '下班',
                time: wt.end,
                status: checkout ? checkout.type : '无',
                detail: checkout ? checkout.detail : '',
                checkTime: checkout ? checkout.time : '',
                quantity: checkout ? checkout.quantity : 0
            })
        })
    }
    // 外勤打卡
    // for (let tr in timeRecord) {
    //     let item = timeRecord[tr]
    //     if (item.type == '外勤') {
    //         list.push({type: '', time: '', status: '外勤', checkTime: item.time})
    //     }
    //     if (item.type == '打卡') {
    //         list.push({type: '', time: '', status: '打卡', checkTime: item.time})
    //     }
    // }
    return list
}

// 考勤加减分记录
async function attendanceScore(company, user, result, date) {
    if (!result || result.length == 0) return;
    let scorerules = await ScoreRule.find({company, ruleModule: "attendance", users: user, run: true})
    scorerules = scorerules.filter(item => timetool.intersectionTime(item.date, timetool.getDayFilter(null, date)))
    if (!scorerules.length) return
    let lateRules = [] //迟到
    let earlyRules = [] //早退
    let leakageCardRule //漏卡

    scorerules.forEach(rules => {
        rules.rules.forEach(rule => {
            if (rule.rule == "late") {
                lateRules.push(rule)
            } else if (rule.rule == "leakage_card") {
                leakageCardRule = rule
            } else if (rule.rule == "early") {
                earlyRules.push(rule)
            }
        })
    })
    for (let i = 0; i < result.length; i++) {
        let r = result[i]
        let penalty = 0;
        let rule
        let isScore = false

        if (r.status == '漏卡') {
            if (leakageCardRule) {
                rule = leakageCardRule
                isScore = true

                // 获取该用户当月的所有漏卡记录
                let {from, to} = timetool.getMonthFilter(null, date)// 一个月
                let filter = {user, category: '漏卡', at: {$gte: from, $lte: to}};
                const filteringItems = '-__v -createdAt';
                let result = await Score.find(filter, filteringItems)
                // 超过次数
                if (result.length >= rule.unitValue) {
                    penalty = rule.value
                } else {
                    penalty = 0
                }
            }

        } else if (r.status == '迟到') {
            // 降序
            lateRules.sort(function (a, b) {
                return b.unitValue - a.unitValue
            })
            let n = lateRules.findIndex(i => i.unitValue <= r.quantity);
            if (n >= 0) {
                rule = lateRules[n]
                penalty = rule.value
                isScore = true
            }

        } else if (r.status == '早退') {
            // 降序
            earlyRules.sort(function (a, b) {
                return b.unitValue - a.unitValue
            })
            let n = earlyRules.findIndex(i => i.unitValue <= r.quantity);
            if (n >= 0) {
                rule = earlyRules[n]
                penalty = rule.value
                isScore = true
            }
        }
        if (isScore) {
            let score = {
                user: user,
                at: toDate(r.time, date),
                type: '考勤',
                category: r.status,
                quantity: r.quantity,
                score: penalty,
                rule,
                detail: r.detail
            };
            let list = await Score.find(score);
            if (!list.length) {
                await Score.create(score)
                pushMsg({
                    userId: user,
                    category: "工作考核",
                    content: '亲，因为您昨天' + r.status + ',被扣分：' + penalty + '分',
                    title: "考勤",
                    scheduleTime: toDate('08:00').toHawkString()
                });
            }
        }
    }
}

// 全勤奖 还未测试
// async function perfectAttendance(date) {
//     let scorerules = await ScoreRule.find({ruleModule: "attendance", run: true})
//     scorerules.forEach((scorerule) => {
//         scorerule.rules.forEach((rule) => {
//             if (rule.rule == 'perfect_attendance') {
//                 scorerule.users.forEach(async (user) => {
//                     let {from, to} = date
//
//                     let filter = {
//                         user,
//                         at: {
//                             $gte: from,
//                             $lte: to
//                         },
//                         status:'正常'
//                     };
//                     const filteringItems = '-__v -updatedAt';
//                     //获取该用户上个月所有的加减分记录
//                     let result = await Score.find(filter, filteringItems)
//                     let isOk = true
//                     result.forEach((item) => {
//                         if (item.category == '迟到' ||
//                             item.category == '早退' ||
//                             item.category == '漏卡'
//                         ) {
//                             if (item.score > 0) { // 此处针对漏卡无扣分
//                                 isOk = false
//                             }
//                         }
//                     })
//                     if (isOk) {
//                         //没有全勤奖咯~！
//                         let score = {
//                             user: user,
//                             at: to,
//                             type: '考勤',
//                             category: '全勤奖',
//                             score: rule.value,
//                             rule,
//                             detail: to.getFullYear() + '年' + (to.getMonth() + 1) + '月全勤奖'
//                         };
//                         await Score.create(score);
//                         pushMsg({
//                             userId: user,
//                             category: "工作考核",
//                             content: '亲，你上个月全勤，被奖励分：：' + penalty + '分',
//                             title: "考勤",
//                             scheduleTime: toDate('08:00').toHawkString()
//                         });
//                     }
//                 })
//             }
//         })
//     })
//
// }

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

// 请假或出差
function isLeave() {

}

// 工作日
function isWorkDay(myTimeCard, date) {
    if (!myTimeCard) return false;
    let index = date.getDay();
    index = (index == 0) ? 6 : (index - 1);
    return myTimeCard.workDays[index];
}

// 08:00时间转换Date对象
function toDate(timepoint, date) {
    let time = timepoint.split(':');
    let d = date ? new Date(date.getTime()) : new Date();
    d.setHours(parseInt(time[0]));
    d.setMinutes(parseInt(time[1]));
    d.setSeconds(parseInt(time[2] ? time[2] : '0'));
    d.setMilliseconds(0);
    return d;
}

module.exports = { getCheckInfo, attendanceScore }
