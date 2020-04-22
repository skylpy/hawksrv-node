
/**
 * 将汇总的数据转换成想要的格式
 * @param list
 */
function chartDataConvert(list,start,end){
    let all = {
        client:{name:'拜访总数(客户)',color:"#01b38b", xAxis:[], yAxis:[], type:['电话','走访'], count:0, classify:'客户资料'},
        client_tel:{name:'电话拜访数(客户)',color:"#fe7f0e", xAxis:[], yAxis:[], type:['电话'], count:0, classify:'客户资料'},
        client_visit:{name:'走访拜访数(客户)',color:"#6c9bd9", xAxis:[], yAxis:[], type:['走访'], count:0, classify:'客户资料'},
        merchants:{name:'拜访总数(商家)',color:"#f55b6e", xAxis:[], yAxis:[], type:['电话','走访'], count:0, classify:'商家资料'},
        merchants_tel:{name:'电话拜访数(商家)',color:"#a86ade", xAxis:[], yAxis:[], type:['电话'], count:0, classify:'商家资料'},
        merchants_visit:{name:'走访拜访数(商家)',color:"#4a4a4a", xAxis:[], yAxis:[], type:['走访'], count:0, classify:'商家资料'},
    }
    let oArr = arrayToObj(list);
    let nArr = generateNullArr(oArr,start,end)
    for(let key in nArr){
        let item = nArr[key]
        for(let k in all){
            let data = all[k]
            let count = 0
            for(let n in item.value){
                let d = item.value[n]
                if(data.type.filter(v => v==d.type).length && d.clientClassify == data.classify){
                    data.count += 1
                    count += 1
                }
            }
            data.xAxis.push(item._id)
            data.yAxis.push(count)
        }
    }
    return all;
}
// 数组转对象
function arrayToObj(list){
    let obj = {}
    list.forEach(function (item) {
        obj[item._id] = item.value.list || [item.value]
    })
    return obj
}
// 生成空数组，以天为分割点
function generateNullArr(oArr, start, end, mode){
    let arr = []
    let date = new Date(parseInt(start))
    while (date <= end) {
        let key = date.toHawkDateString()
        date.setDate(date.getDate()+1)
        arr.push({_id:key,value:oArr[key]||null})
    }
    return arr
}
module.exports = {chartDataConvert}