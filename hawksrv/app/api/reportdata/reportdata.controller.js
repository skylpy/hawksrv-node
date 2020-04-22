const errors = require('@lib/errors');
const L = require('debug')('app:api');
const ReportDatas = require('../reportdata/reportdata.model');
const moment = require('moment');
const ReportDataUtil = require('./reportdata.util');
const ReportTemplates = require('../reporttemplate/reporttemplate.model');
const mongoose = require('mongoose');
const User = require('../user/user.model');
const UserUtil = require('@user/user.util');
const pushMsg = require('@notification/notification.controller').pushMsg;
moment.locale('zh-cn');
module.exports = {
    add,
    query,
    remove,
    update,
    statistics,
    submitReport,
    read,
    auth,
    getByUserInPeriod,
    getById
};

const filteringItems = '-__v -updatedAt';

/**
 * 提交汇报
 * @returns {Promise<void>}
 */
async function submitReport(req, res, next){
    L('Calling API ReportDatas.add', req.body);

    if (!req.body) {
        next(new errors.BadRequest('invalid parameter for ReportDatas creation'));
        return;
    }

    try {
        let reportDatas = req.body;
        let approver = []
        if (reportDatas.approver) {
            approver = reportDatas.approver
        }
        let template = await ReportTemplates.findOne({
            department:reportDatas.department
        })
        var error = null;
        await ReportDataUtil.checkSubmitDate(template,new Date(),function (msg) {
            error = new errors.CustomError("提示",msg,501,501)
        })
        if (error){
            next(error);
            return;
        }
        reportDatas.status = '未读'
        if (reportDatas._id){
            await ReportDatas.findByIdAndUpdate(reportDatas._id, reportDatas, {new: true});
        }else{
            await ReportDatas.create(reportDatas);
        }

        let noteVal = ''  // 通知内容
        if (template.items && reportDatas.items) {
            template.items.forEach((v, i) => {
                noteVal += v.name + '： ' + reportDatas.items[i].value + ' ' + v.unit + (i == template.items.length - 1 ? ';' : '， ')
            })
        }

        if (approver.length) {
            let myuser = await User.findById(req.user.sub);
            for (var i = 0;i < approver.length;i ++){
                pushMsg({
                    userId: approver[i],
                    category:"汇报",
                    content: "亲，您的下属给你提交了汇报，内容如下： " + noteVal,
                    title: myuser.name + "提交了新的汇报"
                });
                // url:"/office/journaldetail/"
            }
        }
        res.status(200).end();
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}


async function add(req, res, next) {
    L('Calling API ReportDatas.add', req.body);

    if (!req.body) {
        next(new errors.BadRequest('invalid parameter for ReportDatas creation'));
        return;
    }

    try {

        // function RndNum(n){
        //     var rnd="";
        //     for(var i=0;i<n;i++)
        //         rnd+=Math.floor(Math.random()*10);
        //     return rnd;
        // }
        // var userList =  await  User.find({companyId:req.user.cid});
        // // console.log(userList)
        // for (let i = 0;i<userList.length;i++){
        //     var user = userList[i];
        //     let department = await UserUtil.userDepartment(user._id)
        //     let template = await ReportTemplates.findOne({department:department.departmentId});
        //     if (template){
        //         console.log("-------------------");
        //         var items = template.items;
        //
        //         for (let i = 0;i<100 ;i++){
        //             let date = moment({hour: 0, minute: 0, seconds: 0}).subtract(i, 'days');
        //             var obj = {
        //                 "user": user._id,
        //                 "userName": user.name,
        //                 "company": user.companyId,
        //                 "template": template._id,
        //                 "department": template.department,
        //                 "name": user.name+"的"+template.name,
        //                 "status":'已确认',
        //                 "createdAt": date,
        //             }
        //             obj.items = [];
        //             items.forEach((item) =>{
        //                 item.value = RndNum(3);
        //                 obj.items.push({name:item.name,unit:item.unit,value:RndNum(3)});
        //             } )
        //
        //             obj.createdAt = date;
        //             ReportDatas.create(obj);
        //             console.log(obj)
        //         }
        //     }
        // }


        let reportDatas = req.body;
        reportDatas.status = '已确认'
        await ReportDatas.create(reportDatas);
        res.status(200).end();

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function remove(req, res, next) {
    L('Calling API ReportDatas.remove');
    let id = req.params.id;

    if (!id) {
        next(new errors.BadRequest('invalid ReportDatas id'));
        return;
    }

    try {
        await ReportDatas.deleteOne({_id: id});
        res.status(200).end();

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function query(req, res, next) {
    L('Calling API ReportDatas.query', req.query);
    try {
        // let u = await User.findById(req.user.sub, filteringItems);
        let params = req.query.q && JSON.parse(req.query.q) || '';

        if (!params) {
            next(new errors.BadRequest('invalid parameters for ReportDatas.query'));
            return;
        }
        if (params.directlyUser){
            delete params.directlyUser;
            let uidList = JSON.parse(req.query.q).subList // await UserUtil.directlyUsers(req.user.sub);
            delete params.subList
            params.user = {'$in':uidList}
        }
        // 时间范围
        if (params.startTime || params.endTime) {
            params.createdAt = {};
            if (params.endTime) {
                params.createdAt.$lte = new Date(params.endTime);
                delete params.endTime;
            }
            if (params.startTime) {
                params.createdAt.$gte = new Date(params.startTime);
                delete params.startTime;
            }
        }
        let result = await ReportDatas.find(params).sort({'createdAt':-1}).limit(100);
        res.status(200).json(result);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}
async function update(req, res, next) {
    L('Calling API ReportDatas.update');
    let cId = req.params.id;

    if (!cId) {
        next(new errors.BadRequest('invalid ReportDatas id'));
        return;
    }

    try {
        let c = await ReportDatas.findByIdAndUpdate(cId, req.body, {new: true});
        if (c.status == "已驳回"){
                let notification = {
                    category:'数据汇报',
                    userId:c.user,
                    title:"数据汇报驳回提醒",
                    content:"亲，您的数据汇报已被驳回请及时修改",
                    url:"/office/submitreport/",
                    extras:{id:c._id},
                }
                pushMsg(notification)
        } else if (c.status == '已撤回') {
            if (c.approver && c.approver.length) {
                let myuser = await User.findById(req.user.sub);
                c.approver.map(v => {
                    pushMsg({
                        userId: v,
                        category:"汇报",
                        content: `亲，您的下属撤回了汇报`,
                        title: myuser.name + "撤回了汇报"
                    });
                })
            }
        }
        res.status(200).end();

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}
async function updateStatus(id,status,next){
    L('Calling API ReportDatas.updateStatus');
    if (!id) {
        next(new errors.BadRequest('invalid ReportDatas id'));
        return;
    }
    if (!status){
        next(new errors.BadRequest('invalid ReportDatas status'));
        return;
    }
    let c = await ReportDatas.findByIdAndUpdate(id, {status:status}, {new: true});
    if (c.errors){
        L(errors);
        next(errors)
    }
    L(c)
    return c;

}

/**
 * 阅读日报，会把'未读'的status设置成'已读'
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
async function read(req, res, next){
    L('Calling API ReportDatas.read', req.params);


    if (!req.params.id) {
        next(new errors.BadRequest('invalid ReportDatas id'));
        return;
    }

    try {
        let directlyUsers = await UserUtil.directlyUsers(req.user.sub);
        let report = await ReportDatas.findById(req.params.id, filteringItems);
        if (directlyUsers.includes(report.user.toString())) {
            if (!report.status || report.status == '未读' ){
                report = await updateStatus(req.params.id,'已读',next);
            }
        }
        res.json(report);
    } catch (err) {
        L(err);
        next(new errors.BadRequest(err.message));
    }

}
/**
 * 鉴权，判断当前用户是否拥有对该汇报的权限
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
async function auth(req, res, next){
    L('Calling API ReportDatas.read', req.params);


    if (!req.params.id) {
        next(new errors.BadRequest('invalid ReportDatas id'));
        return;
    }

    try {
        let directlyUsers = await UserUtil.directlyUsers(req.user.sub);
        let report = await ReportDatas.findById(req.params.id, filteringItems);
        if (directlyUsers.includes(report.user.toString())) {
            res.json(true);
        }else {
            res.json(false);
        }

    } catch (err) {
        L(err);
        next(new errors.BadRequest(err.message));
    }

}

async function getByUserInPeriod(req, res, next) {
    try {

        let params = req.query.q && JSON.parse(req.query.q) || '';
        if (!params || !params.user || !params.template) {
            next(new errors.BadRequest('invalid parameters for ReportDatas.getByUserInPeriod'));
            return;
        }
        let tmp = await ReportTemplates.findById(params.template, filteringItems);
        let startTime = ReportDataUtil.getTimeInterval(tmp).startTime;
        params.createdAt = { $gt: startTime}
        let result = await ReportDatas.find(params).sort({'createdAt':-1})
        res.status(200).json(result[0]);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}
async function getById(req, res, next) {
    L('Calling API ReportDatas.getById', req.params);

    if (!req.params.id) {
        next(new errors.BadRequest('invalid ReportDatas id'));
        return;
    }

    try {
        let c = await ReportDatas.findById(req.params.id, filteringItems);
        res.json(c);

    } catch (err) {
        L(err);
        next(new errors.BadRequest(err.message));
    }
}

/**
 * 数据汇总统计功能
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
async function statistics(req,res,next) {
    L('Calling API ReportDatas.statistics', req.params);
    try {
        let params = req.query.q && JSON.parse(req.query.q) || '';

        if (!params) {
            next(new errors.BadRequest('invalid parameters for ReportDatas.statistics'));
            return;
        }
        var o = {
            map: function () {
                var date = new Date(this.createdAt);
                var key = "" + date.getFullYear() + "-"
                    + (date.getMonth() < 9 ?('0'+(date.getMonth()+1)) : (date.getMonth()+1)) + "-"
                    + (date.getDate()<10?('0'+(date.getDate())):date.getDate());
                for (var i = 0; i < this.items.length; i++) {
                    let name = this.items[i].name  + '_unit=' + this.items[i].unit;
                    let value = this.items[i].value;
                    var values = {};
                    values[name] = value;
                    emit(key, values);
                }
            },
            reduce : function(key, items) {
                var reducedVal = {};


                for (var idx = 0; idx < items.length; idx++) {
                    var item = items[idx];

                    for(var k in item){
                        if(!reducedVal[k]){
                            reducedVal[k] = 0;
                        }
                        reducedVal[k] += item[k]
                    }

                }
                return reducedVal;
            },
            query:{},
            out: {inline: 1}
        };

        if (params) {
            o.query.status = '已确认';
            o.query.createdAt = {
                $gte : ReportDataUtil.generateDate(params.dateName),
                $lt : moment({hour:0}),
            }
            if (params.user) {
                o.query.user = params.user;
            }
            if (params.department) {
                let departmentids = [params.department];
                if (!params.isMore) {
                    let department = await UserUtil.getDepartment(req.user.cid,params.department)
                    departmentids = departmentids.concat(UserUtil.departmentToList(department).map(d => d.departmentId));
                }
                o.query.department = {'$in':departmentids};
            }
        }
        o.query.company = req.user.cid;
        ReportDatas.mapReduce(o, function (err, results) {
            if (err){
                L(err);
                next(new errors.BadRequest(err.message));
            }
            res.json(ReportDataUtil.statisticsDataConvert(results.results));
        })


    } catch (err) {
        L(err);
        next(new errors.BadRequest(err.message));

    }
}


