//用于过期提醒，人数超额禁用
const CompanyLife = require('../api/companylife/companylife.model')
const Users = require('../api/user/user.model')
const TimeTool = require('../lib/score/lib/time')
const {pushMsg} = require('../api/notification/notification.controller')
const CronTime = require('cron').CronTime
const CronJob = require('cron').CronJob

let test = false // 测试开关

async function checkValidityUser() {
    const list = await CompanyLife.find({status: '正常'})
    const disableList = []
    for (let c of list) {
        const userConut = await Users.count({companyId: c.companyId, status: true, isDelete: {$ne: true}})
        if (c.number < userConut) { // 人数超过， 发送消息提示禁用用户
            const superadmin = await Users.findOne({companyId: c.companyId, superadmin: true})
            pushMsg({
                userId: superadmin._id,
                category: "企业套餐",
                content: '注意！您的所购买企业套餐人数为' + c.number + '人，实际使用人数' + userConut + '人，请购买套餐增加人数或禁用多余人数，明天将会自动禁用超额人数，请及时处理。',
                title: "企业套餐使用人数超额",
            })
            disableList.push(c.companyId)
        }
    }
    // 创建明天定时任务
    if (disableList.length) {
        const today = TimeTool.getDayFilter() // 明天
        let milliseconds = today.to.getTime() - today.from.getTime() // 24小时

        // 测试 缩短时间
        if (test) {
            milliseconds = 1000
        }

        const time = setTimeout(() => {
            disableList.forEach(c => disableUser(c))
        }, milliseconds)
    }
}


async function disableUser(companyId) {
    const c = await CompanyLife.findOne({companyId})
    const users = await Users.find({companyId: companyId, status: true, isDelete: {$ne: true}}).sort({createdAt: -1})
    if (c.number < users.length) { // 人数超过， 开始禁用用户
        let disableCount = 0
        let disableUsers = []
        for (let i = 0; i < users.length; i++) {
            if (disableUsers.length >= (users.length - c.number)) break; // 达到禁用人数跳出
            let user = users[i]
            if (user.superadmin) continue;
            user.status = false;
            await user.save()
            disableUsers.push(user)
        }

        const usersName = disableUsers.map(u => u.name).join('、')
        const superadmin = users.find(u => u.superadmin)
        pushMsg({
            userId: superadmin._id,
            category: "企业套餐",
            content: '注意！您的所购买企业套餐人数为' + c.number + '人，实际使用人数' + users.length + '人，系统自动禁用以下用户：' + usersName + '。',
            title: "企业套餐超额人数禁用",
        })
    }
}

// 每天1点 重新计算
new CronJob('0 0 1 * * *', () => {
    checkValidityUser()
}).start();

// 测试
if (test) {
    checkValidityUser()
}
