const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const L = require('debug')('app:api');
const TimeRecord = require('@timerecord/timerecord.model');
const Score = require('@score/score.model');
const ScoreRule = require('@score/scorerule.model');

const TimeSlotSchema = new mongoose.Schema({
    start: {
        type: String,
        validate: {
            validator: function (v) {
                return /\d\d:\d\d/.test(v);
            },
            message: props => `${props.value} is not a valid time!`
        },
        required: true
    },
    end: {
        type: String,
        validate: {
            validator: function (v) {
                return /\d\d:\d\d/.test(v);
            },
            message: props => `${props.value} is not a valid time!`
        },
        required: true
    },
    start_range: {
        type: String,
        validate: {
            validator: function (v) {
                return /\d\d:\d\d/.test(v);
            },
            message: props => `${props.value} is not a valid time!`
        },
        required: true
    },
    end_range: {
        type: String,
        validate: {
            validator: function (v) {
                return /\d\d:\d\d/.test(v);
            },
            message: props => `${props.value} is not a valid time!`
        },
        required: true
    }
});

const TimecardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
    },
    workDays: {
        type: [Boolean],
        required: true
    },
    workTimes: {
        type: [TimeSlotSchema],
        required: true
    },
    owners: {
        type: [ObjectId],
        lowercase: true
    },
    location: {
        type: Map
    }
});

TimecardSchema.methods.isWorkDay = function (date/*eg. 2010-01-01*/) {
    let d = new Date(date);
    let index = d.getDay();
    index = (index == 0) ? 6 : (index - 1);
    return this.workDays[index];
}

function toDate(time) {
    let hms = time.split(':');
    let hh = parseInt(hms[0]), mm = parseInt(hms[1]), ss = parseInt(hms[2] ? hms[2] : '0');
    let d = new Date();
    d.setHours(hh);
    d.setMinutes(mm);
    d.setSeconds(ss);
    return d;
}

// 允许打卡区间 1小时
const onehour = 60 * 60 * 1000;

// 上班上
function checkin_on(wt, range, records) {
    let time = wt.start/*HH:MM*/
    let start_range = wt.start_range
    let on = toDate(time).getTime();
    if (!records || records.length == 0) return {
        status: '漏卡',
        detail: `上班时间: ${toDate(time).toHawkString()} | 打卡时间: 无`
    };

    let validRec = records.filter(r => {
        if (range && r.offset > range) return false;
        let start = on - start_range; //提前1小时可以上班打卡
        let end = on + onehour; //迟到超过1小时等于漏卡
        let checkinAt = toDate(r.time).getTime();

        if (checkinAt > start && checkinAt < end) return true;
        return false;
    })

    if (validRec.length < 1) return {
        status: '漏卡',
        detail: `上班时间: ${toDate(time).toHawkString()} | 打卡时间: 不在正常区间`
    };

    let firstRec = validRec[0];
    let arrivedAt = toDate(firstRec.time).getTime();

    if (arrivedAt <= on) return {status: '正常'};

    let late = (arrivedAt - on) / (60 * 1000); // minutes
    return {status: '迟到', quantity: late};
}

// 下班卡
function checkin_off(wt/*HH:MM*/, range, records) {
    let time = wt.end
    let off = toDate(time).getTime();

    if (!records || records.length == 0) return {
        status: '漏卡',
        detail: `下班时间: ${toDate(time).toHawkString()} | 打卡时间: 无`
    };

    let validRec = records.filter(r => {
        if (range && r.offset > range) return false;
        let start = off - onehour; // 早退超过1小时等于漏卡
        let checkinAt = toDate(r.time).getTime();

        if (checkinAt > start) return true;
        return false;
    })

    if (validRec.length < 1) return {
        status: '漏卡',
        detail: `下班时间: ${toDate(time).toHawkString()} | 打卡时间: 不在正常区间`
    };

    let lastRec = validRec.pop();
    let leaveAt = toDate(lastRec.time).getTime();

    if (leaveAt >= off) return {status: '正常'};

    let early = (off - leaveAt) / (60 * 1000); // minutes
    return {status: '早退', quantity: early};
}

async function add_score(user, result, company) {
    if (!result || result.length == 0) return;

    let attendanceIndexes = company.attendanceIndexes;
    if (!attendanceIndexes || attendanceIndexes.length == 0) return;
    let scorerules = await ScoreRule.find({company, ruleModule: "attendance", users: user})
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
        console.log(r)
        let penalty = 0;
        let rule

        if (r.status == '漏卡') {
            if (leakageCardRule) {
                rule = leakageCardRule
                penalty = rule.value
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
            }
        }

        let score = {
            user: user,
            at: new Date(),
            type: '考勤',
            category: r.status,
            quantity:r.quantity,
            score: penalty,
            rule,
            detail: r.detail
        };
        await Score.create(score);
    }
}

TimecardSchema.methods.checkin = function (company) {
    let today = (new Date()).toHawkDateString();
    if (!this.isWorkDay(today)) return;
    if (!this.owners || this.owners.length == 0) return;
    let workTimes = this.workTimes;
    let range = this.location && this.location.toJSON().range || null;

    this.owners.forEach(o => {
        TimeRecord.findOne({
            userId: o,
            date: today
        }, function (err, tr) {
            if (err) {
                L(err);
                L('failed to check in for user', o);
                return;
            }

            let result = [];
            let records = tr && tr.records.slice(0) || [];
            records.sort((a, b) => (a.time < b.time) ? -1 : 1);

            workTimes.forEach(wt => {
                let on_check = checkin_on(wt, range, records);
                result.push(on_check);
                let off_check = checkin_off(wt, range, records);
                result.push(off_check);
            });
            add_score(o, result.filter(r => r.status != '正常'), company);
        })
    });
};

module.exports = TimecardSchema;
