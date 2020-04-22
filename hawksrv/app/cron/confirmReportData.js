const L = require('debug')('app:cron');
var CronJob = require('cron').CronJob;
const moment = require('moment');
const Company = require('@company/company.model');
const Reportdata = require('@reportdata/reportdata.model');

moment.locale('zh-cn');
// 将未确认的汇报数据确认
function confirmReportData() {
    L('running confirmReportData cron')
    // console.log(moment({hour:0}));
        Reportdata.update({
            createdAt: {$lt : moment({hour:0})},
            status: {$in : ['未读','已读']}
        },{$set:{status:'已确认'}},{multi:true},function (err,result) {
            L(err)
            L(result)
        })

}

const job = new CronJob('0 30 8 * * *', function() {
    L('adding confirmReportData');
    confirmReportData();
});

job.start();
L('setup: confirmReportData');
// confirmReportData()