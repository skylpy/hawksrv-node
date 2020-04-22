const L = require('debug')('Score:Attendance')
const Company = require('../../../api/company/company.model')
const timetool = require('../lib/time')
const {getCheckInfo, attendanceScore, perfectAttendance} = require('../lib/attendance')


let ScoreRule = {
    //
    name: "考勤",
    cron: [{
        open: true,
        time: '0 2 0 * * *', // 第二天 凌晨 00:02
        run: async function () {
            let date = timetool.getDayFilter(-1) //-1 昨天
            Company.find({}, function (err, companys) {
                if (err) {
                    L(err);
                    return;
                }
                if (companys.length) {
                    companys.forEach(company => {
                        if (!company.timeCards) return;
                        company.timeCards.forEach(tc => {
                            tc.owners.forEach(async (owner) => {
                                // 获取该用户当天的考勤状态
                                let checkList = await getCheckInfo(company, owner, tc, date.to)
                                // 加减分
                                await attendanceScore(company._id, owner, checkList, date.to)
                            })
                        })
                    })
                }
            })
        }
    }],
    rules: {
        // "perfect_attendance": {
        //     name: "全勤奖",
        //     cron: {
        //         open: true,
        //         time: '0 0 0 1 * *', //每月一号
        //         run: async function () {
        //             L('Cron::全勤奖')
        //             try {
        //                 let date = timetool.getMonthFilter(-1) //-1 上个月开始与结束
        //                 perfectAttendance(date)
        //             } catch (error) {
        //                 L(error);
        //             }
        //         }
        //     },
        //     default: {title: "全勤奖励", valueType: 'add', value: 100}
        // },
        "late": {
            name: "迟到",
            default: {title: "迟到", unit: "分钟", unitValue: 5, valueType: 'sub', value: 10}
        },
        "early": {
            name: "早退",
            default: {title: "早退", unit: "分钟", unitValue: 5, valueType: 'sub', value: 10}
        },
        // "sick_leave": {
        //     name: "病假",
        //     event: {
        //         open: true,
        //         run: async function (prarms) {
        //             L('Event::病假(' + JSON.stringify(prarms) + ')')
        //             try {
        //
        //             } catch (e) {
        //
        //             }
        //         }
        //     },
        //     default: {title: "请病假", unit: "次数", unitValue: 1, valueType: 'sub', value: 100}
        // },
        "leakage_card": {
            name: "漏卡",
            default: {title: "漏卡", unit: "每月免除次数", unitValue: 1, valueType: 'sub', value: 10},
        }
    }
}
// ScoreRule.cron[0].run() //测试考勤用
// ScoreRule.rules.perfect_attendance.cron.run() //测试全勤奖
module.exports = ScoreRule
