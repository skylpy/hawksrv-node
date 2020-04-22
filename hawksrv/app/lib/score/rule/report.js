const L = require('debug')('Score:Report')
const {checkReport} = require('../lib/report')
const toolTool = require('../lib/time')
const ScoreRule = {
    name: "汇报",
    cron: [{
        open: true,
        time: '0 2 0 * * *',
        run: async function (prarms) {
            L('Cron::XX')
            try {
                let day = toolTool.getDayFilter(-1)
                checkReport(day) // 数据达标考核
            } catch (error) {
                console.log(error)
            }
        }
    }],
    rules: {
        "datatemplate": {
            name: "模板配置考核项",
            default: {title: "模板配置考核项"}
        },
        "no": {
            name: "不交汇报",
            default: {title: "不交汇报", valueType: 'sub', value: 20}
        },
        "noRead": {
            name: "不阅读汇报",
            default: {title: "不阅读汇报", valueType: 'sub', value: 20}
        }
    }
}
// ScoreRule.cron[0].run() //测试用
module.exports = ScoreRule
