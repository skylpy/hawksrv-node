const moment = require('moment');
moment.locale('zh-cn');
/**
 * 获取提交时间区间
 */
function getTimeInterval(journalTemplate) {
    let timeInterval = {};
    if (journalTemplate.period == 'day'){
        timeInterval.startTime = moment({hour:journalTemplate.startTime});
        timeInterval.endTime = moment({hour:journalTemplate.endTime});
        return timeInterval;
    }
    if (journalTemplate.period == 'week'){
        timeInterval.startTime = moment({hour:journalTemplate.startTimeOfWeek[1]}).day(journalTemplate.startTimeOfWeek[0])
        timeInterval.endTime = moment({hour:journalTemplate.endTimeOfWeek[1]}).day(journalTemplate.endTimeOfWeek[0])
    }
    if (journalTemplate.period == 'month'){
        timeInterval.startTime = moment({hour:journalTemplate.startTimeOfMonth[1]}).date(journalTemplate.startTimeOfMonth[0])
        timeInterval.endTime = moment({hour:journalTemplate.endTimeOfMonth[1]}).date(journalTemplate.endTimeOfMonth[0])
    }
    return timeInterval
}
function checkSubmitDate(journalTemplate,date,error){

    if (journalTemplate == null){
        return true;
    }
    if (journalTemplate.period == 'day'){
        if (journalTemplate.days.indexOf(moment().day())<0)
        {
            if (error) error("尚未到提交时间");
            return false;
        }
    }
    let timeInterval = getTimeInterval(journalTemplate);
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
            if(datas[key]){
                datas[key].dates.push(format(item._id));
                datas[key].datas.push(item.value[key]);
                datas[key].sum += item.value[key];

            }else{
                datas[key] =  {
                    dates:[format(item._id)],
                    datas:[item.value[key]],
                    sum:item.value[key],
                    color:colorList[colorIndex++]
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


