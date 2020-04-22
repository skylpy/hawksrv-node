// 获取当前月的开始和结束时间, index是月的偏移，上一月下一月
let getMonthFilter = function (index, q_date) {
    let now = new Date() || q_date
    let year = now.getFullYear()
    let month = now.getMonth() + (index || 0)
    let date = new Date(year, month + 1, 0).getDate();
    let from = new Date(year, month, 1, 0, 0, 0, 0)
    let to = new Date(year, month, date, 23, 59, 59, 999)
    return {from, to}
}

// 获取当天的开始和结束时间, index是天的偏移，上一天下一天
function getDayFilter(index, date) {
    const _date = new Date() || date
    const y = _date.getFullYear()
    const m = _date.getMonth()
    const d = _date.getDate() + (index || 0) //十二点过后 昨天
    const from = new Date(y, m, d, 0, 0, 0, 0);
    const to = new Date(y, m, d, 23, 59, 59, 999);
    return {from, to}
}

// 判断当天是否需要考勤 需要则返回TRUE
let getWeekStatus = function (date, workDays) {
    let week = date.getDay()
    week++
    if (week == 7) {
        week = 0
    }
    return workDays[week]
}
let getTimeCardStatus = function (data, workTime) {
    let start = toDate(workTime.start)
    let end = toDate(workTime.end)

}

function toDate(time) {
    let hms = time.split(':');
    let hh = parseInt(hms[0]), mm = parseInt(hms[1]), ss = parseInt(hms[2] ? hms[2] : '0');
    let d = new Date();
    d.setHours(hh);
    d.setMinutes(mm);
    d.setSeconds(ss);
    d.setMilliseconds(0);
    return d;
}

function intersectionTime(a, b) {
    if (a.from > a.to || b.from > b.to) {
        return null // 时间异常
    }
    if (b.to < a.from || a.to < b.from) {
        return false // 没有交集
    } else {
        return true // 有交集
    }
}

module.exports = {getMonthFilter, getWeekStatus, getDayFilter: getDayFilter, intersectionTime, toDate}
