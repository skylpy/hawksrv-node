const TimeRecord = require('./timerecord.model');
const {pushMsg} = require('../../api/notification/notification.controller')
const {getSuperiorDepartments} = require('../user/user.util');
const User = require('../user/user.model');
const errors = require('@lib/errors');
const L = require('debug')('app:api');
const excel = require('../../excel/timerecord.export');

module.exports = {
    add,
    query,
    edit
};

async function add(req, res, next) {
    L("calling api timerecord.add", req.body);

    let {time, location, detail, type, workTime, offset, photo, auditing} = req.body;
    let userId = req.user.sub;
    let record = {time, location, offset, type, workTime, photo, detail, auditing};

    try {
        let date = (new Date()).toHawkDateString();
        let tr = await TimeRecord.findOne({userId, date});
        if (tr) {
            tr.records.push(record);
            await tr.save();
        } else {
            tr = await TimeRecord.create({
                userId: userId,
                date: date,
                records: [record]
            })
        }

        // 无定位打卡
        if (record.auditing == '-1') {
            //-1：待审核， 0审核失败，1人工审核通过，2自动审核通过
            let user = await User.findById(userId)
            let superiorDepartments = await getSuperiorDepartments(req.user.cid, userId)

            let admins = []
            superiorDepartments.forEach(sd=>{
                if(sd.admin.length){
                    if(!sd.admin.filter(a=>a==userId).length){ // 自己是当前部门管理员则跳过
                        admins = sd.admin
                    }
                }
            })
            if (!admins.length) {
                admins = await User.find({companyId: req.user.cid, superadmin: true}) // 发给超级管理员
            }
            admins.forEach(admin => {
                pushMsg({
                    userId: admin._id ? admin._id.toString() : admin,
                    category: "打卡审批",
                    content: '亲，您的下属员工' + user.name + '向您提交了打卡申请，请打开我的考勤 > 打卡记录 > 选择他本人  然后进行审批',
                    title: "打卡审批"
                })
            })
        }
        res.status(200).end();
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function query(req, res, next) {
    L("calling api timerecord.query", req.query.q);

    if (!req.query.q) {
        next(new errors.BadRequest("invalid filter for timerecord.query"));
        return;
    }

    let filter = JSON.parse(req.query.q);
    let userId = filter.userId || req.user.sub;

    // 坑，一般日期是区间不是列表
    if (!filter.date || !(filter.date instanceof Array)) {
        next(new errors.BadRequest("invalid date for timerecord.query"));
        return;
    }

    let dates = [];
    filter.date.forEach(d => {
        dates.push((new Date(d)).toHawkDateString());
    })

    try {
        if (req.get('download-excel')) {
            // 导出excel查询
            let trs = await TimeRecord.find({
                userId: { '$in':filter.employees },
                createdAt: {
                    '$gte': filter.dateRange[0],
                    '$lte': filter.dateRange[1]
                }
            })
            
            excel.query(res,trs)
        } else {
            let trs = await TimeRecord.find({userId}).in('date', dates);
            res.status(200).json(trs);
        }
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }

}

async function edit(req, res, next) {
    L("calling api timerecord.edit", req.body);

    if (!req.body) {
        next(new errors.BadRequest("invalid filter for timerecord.edit"));
        return;
    }

    let filter = req.body;
    let userId = filter.userId

    try {
        let tr = await TimeRecord.findOne({userId, 'date': filter.date});
        if (tr) {
            tr.records.forEach(async (v, i) => {
                if (v._id == filter._id) {
                    v.auditing = filter.auditing;
                }
            });
        }
        await TimeRecord.update(
            {
                userId,
                'date': filter.date
            }, {
                $set: {
                    records: tr.records
                }
            }
        );
        L("find timerecord.edit", tr);
        res.status(200).end();
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}
