const moment = require('moment');
moment.locale('zh-cn');
/**
 * 获取提交时间区间
 */
function getTimeInterval(reportTemplate) {
    let timeInterval = {};
    if (reportTemplate.period == 'day'){
        timeInterval.startTime = moment({hour:reportTemplate.startTime});
        timeInterval.endTime = moment({hour:reportTemplate.endTime});
        return timeInterval;
    }
    if (reportTemplate.period == 'week'){
        timeInterval.startTime = moment({hour:reportTemplate.startTimeOfWeek[1]}).day(reportTemplate.startTimeOfWeek[0])
        timeInterval.endTime = moment({hour:reportTemplate.endTimeOfWeek[1]}).day(reportTemplate.endTimeOfWeek[0])
    }
    if (reportTemplate.period == 'month'){
        timeInterval.startTime = moment({hour:reportTemplate.startTimeOfMonth[1]}).date(reportTemplate.startTimeOfMonth[0])
        timeInterval.endTime = moment({hour:reportTemplate.endTimeOfMonth[1]}).date(reportTemplate.endTimeOfMonth[0])
    }
    return timeInterval
}
function checkSubmitDate(reportTemplate,date,error){
    if (reportTemplate.period == 'day'){
        if (reportTemplate.days.indexOf(moment().day())<0)
        {
            if (error) error("尚未到提交时间");
            return false;
        }
    }
    let timeInterval = getTimeInterval(reportTemplate);
    if (timeInterval.startTime > date){
        if (error) error("尚未到提交时间");
        return false;
    }
    if (timeInterval.endTime < date){
        if (error) error("已过截止时间");
        return false;
    }
    return true;
}

/**
 * 将汇总的数据转换成想要的格式
 * @param list
 */
function statisticsDataConvert(list){
    var colorList = ['#c23531','#2f4554', '#61a0a8', '#d48265', '#91c7ae','#749f83',  '#ca8622', '#bda29a','#6e7074', '#546570', '#c4ccd3'];
    var colorIndex = 0;
    var datas = {};
    function format(date) {
        return date.substring(5)
    }

    for(let i = 0;i<list.length;i++){
        let item = list[i];
        for(let key in item.value){
            let type = key.includes('_unit=') ? key.split('_unit=')[0] : key;
            if(datas[type]){
                datas[type].dates.push(format(item._id));
                datas[type].datas.push(item.value[key]);
                datas[type].sum += item.value[key];
                datas[type].unit = key.includes('_unit=') ? key.split('_unit=')[1] : '';
            }else{
                datas[type] =  {
                    dates:[format(item._id)],
                    datas:[item.value[key]],
                    sum:item.value[key],
                    color:colorList[colorIndex++],
                    unit: key.includes('_unit=') ? key.split('_unit=')[1] : ''
                }
            }
        }
    }
    return datas;
}
var timeFunctionObj={
    '最近一周':function () {
        return moment({hour: 0}).subtract(1, 'week');
    },
    '最近两周':function () {
        return moment({hour: 0}).subtract(2, 'week');
    },
    '最近一个月':function () {
        return moment({hour: 0}).subtract(1, 'month');
    },
    '最近两个月':function () {
        return moment({hour: 0}).subtract(2, 'month');
    },
    '最近三个月':function () {
        return moment({hour: 0}).subtract(3, 'month');
    },
    '最近半年':function () {
        return moment({hour: 0}).subtract(6, 'month');
    },
}
function generateDate(dateName) {
    if (dateName){
        return timeFunctionObj[dateName]();
    }
    return moment({hour: 0}).subtract(1, 'week');

}
module.exports = {getTimeInterval,checkSubmitDate,statisticsDataConvert,generateDate};


