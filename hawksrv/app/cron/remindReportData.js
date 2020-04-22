const L = require('debug')('app:cron');
var CronJob = require('cron').CronJob;
const moment = require('moment');
const Reportdata = require('@reportdata/reportdata.model');
const ReportUtil = require('@reportdata/reportdata.util');
const Reporttemplate = require('@reporttemplate/reporttemplate.model');
const User = require('@user/user.model');
const UserUtil = require('@user/user.util');
const pushMsg = require('@notification/notification.controller').pushMsg;
const Company = require('@company/company.model');

moment.locale('zh-cn');

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

// 将未确认的汇报数据确认
async function remindReportData() {


    L('running remindReportData cron')
    var remindTime = [60,120,180,240,300,360,420,480];
    var remindTimeString = [];
    remindTime.forEach(value => {
        let hour = moment().hour() + value/60;
        if (hour>24){
            hour = hour - 24;
        }
        remindTimeString.push(hour)
    })
    var result = await Reporttemplate.find(
        {$or:[
                {endTime:{$in:remindTimeString},period:'day'},
                {endTimeOfWeek:{$in:remindTimeString},period:'week'},
                {endTimeOfMonth:{$in:remindTimeString},period:'month'},
            ]
        }
    );
    if (result.length == 0)return;
    result.forEach((template,index)=>{
        remindByTemplate(template)
    })

}

async function remindByTemplate(template) {
    if (ReportUtil.checkSubmitDate(template, new Date())) {
        // if ()
        let hour = moment().hour() + template.remindTime/60;
        if (hour>24){
            hour = hour - 24;
        }
        if (hour != template.endTime){
            return;
        }
        // console.log('截止时间:'+moment({hour:moment().hour()+template.remindTime/60 }).format("YYYY-MM-DD HH:mm"))
        let data = await User.find({companyId: template.company});
        let company = await Company.findById(template.company, '-__v');
        for (let i in data) {
            let user = data[i];
            let d = await UserUtil.userDepartment(user._id)
            if (d && d.departmentId == template.department) {
                let params = {user:user._id,createdAt:{ $gt: ReportUtil.getTimeInterval(template).startTime}}
                Reportdata.find(params).sort({'createdAt':-1}).exec(function (err,data) {
                    if (data.length == 0){
                        if (isHoliday(company.holidays, new Date())) return     //节假日不推送
                        pushMsg({
                            userId:user._id,
                            category:"汇报",
                            content:"亲，您今天需要提交的数据汇报还没有提交哦，请尽快提交",
                            title:"汇报提醒通知",
                            url:"/office/submitreport/",
                        });
                    }
                });
            }
            i++;
        }
    }
}

const job = new CronJob('0 0 * * * *', function() {
    L('adding remindReportData');
    remindReportData();
});

job.start();
L('setup: remindReportData');
// remindReportData()
