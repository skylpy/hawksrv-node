const errors = require('@lib/errors');
const L = require('debug')('app:api');
const Task = require('./task.model');
const Score = require('@score/score.model');
const Company = require('@company/company.model');
const UserUtil = require('@user/user.util');
const User = require('@user/user.model');
const pushMsg = require('@notification/notification.controller').pushMsg;

module.exports = {
    create,
    update,
    remove,
    getById,
    taskManager,
    updateStatus,
    updateAuditType,
    auth,
    query
};

const filteringItems = '-__v -updatedAt';

async function create(req, res, next) {
    L('Calling API task.create', req.body);

    if (!req.body) {
        next(new errors.BadRequest('invalid parameter for task creation'));
        return;
    }

    try {
        let task = req.body;
        task.applicant = req.user.sub;
        task.companyId = req.user.cid;
        let last = await Task.find({companyId:task.companyId}).sort({createdAt:-1}).limit(1);
        if (last && last.length > 0 && last[0].no){
            task.no = last[0].no + 1;
        }else {
            task.no = 1;
        }
        let t = await Task.create(task);
        if (t.executor != t.applicant){
            let applicant = await User.findById(t.applicant);
            let notification = {
                category:'任务',
                userId:t.executor,
                title:"新任务提醒",
                content:"亲，"+applicant.name+"给您安排了新的任务，请查看",
                url:"/office/taskdetail/",
                extras:{id:t._id},
            }
            pushMsg(notification)
        }

        res.status(200).end();

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function updateStatus(req, res, next) {
    L('Calling API task.updateStatus');
    let tId = req.body._id;

    if (!tId) {
        next(new errors.BadRequest('invalid task id'));
        return;
    }
    if (!req.body.status) {
        next(new errors.BadRequest('invalid task status'));
        return;
    }
    try {
        let task = await Task.findById(tId);
        task.auditType = '未审核';
        task.status = req.body.status;
        let msg = async (txt) => {
            let executor = await User.findById(task.executor);
            req.body.msgIdList.map(v => {
                let notification = {
                    category:'任务',
                    userId: v,
                    title: `下属${txt}任务提醒`,
                    content:executor.name+ txt + '任务了，请查看并审核',
                    url:"/office/taskdetail/",
                    extras:{id:task._id},
                }
                pushMsg(notification)
            })
        };
        if (task.executor != task.applicant){
            if (req.body.status == '已完成'){
                task.finishAt = new Date();
                task.summarized = false;
                msg('完成');

            }else if (req.body.status == '未完成'){
                msg('未完成');
            }
        }
        let t = await Task.findByIdAndUpdate(tId, task, {new: true})
        res.status(200).json(t);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}
async function updateAuditType(req, res, next) {
    L('Calling API task.updateAuditType');
    let tId = req.body.id;

    if (!tId) {
        next(new errors.BadRequest('invalid task id'));
        return;
    }
    if (!req.body.status || !req.body.auditType) {
        next(new errors.BadRequest('invalid task status'));
        return;
    }
    try {
        let param = req.body;
        let task = await Task.findById(tId);
        task.auditType = param.auditType;
        task.status = param.status;
        task.notes = param.notes
        task.deadline = param.deadline
        let t = await Task.findByIdAndUpdate(tId, task, {new: true});
        if(t.auditType == '已审批'){
            if(t.status == '已完成'){
                $ScoreModule.emit('task.finish', {task:t})
            }else if(t.status == '未完成'){
                $ScoreModule.emit('task.unfinished', {task:t})
            }
        }
        let notification = {
            category:'任务',
            userId:t.executor,
            title:"任务审批提醒",
            content:"您的任务有新的审批结果",
            url:"/office/taskdetail/",
            extras:{id:t._id},
        }
        if ((t.status == '已完成'||t.status == '未完成') && t.auditType == '已审批'){
            notification.content = '亲，您的编号为'+t.no+'任务审批结果为'+t.status+'，请查看'
        }else if (t.auditType == '已延期'){
            notification.content = '亲，您的编号为'+t.no+'任务时间延长了，请尽快完成任务'
        }else if (t.auditType == '已驳回'){
            notification.content = '亲，您的编号为'+t.no+'任务被驳回了，请查看详情'
        }
        pushMsg(notification)
        res.status(200).json(t);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function update(req, res, next) {
    L('Calling API task.update');
    let tId = req.params.id;

    if (!tId) {
        next(new errors.BadRequest('invalid task id'));
        return;
    }

    try {
        let t = await Task.findByIdAndUpdate(tId, req.body, {new: true});
        res.status(200).end();
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function remove(req, res, next) {
    L('Calling API task.remove');
    let tId = req.params.id;

    if (!tId) {
        next(new errors.BadRequest('invalid task id'));
        return;
    }

    try {
        let t = await Task.findById(tId);
        await Task.deleteOne({_id: tId});
        if (t.executor != t.applicant){
            let applicant = await User.findById(t.applicant);
            let notification = {
                category:'任务',
                userId:t.executor,
                title:"任务提醒",
                content:"亲，您的"+t.no+"任务已经被"+applicant.name+"取消，请查看",
                url:"/office/taskindex/"
            }
            pushMsg(notification)
        }
        res.status(200).end();
        L('successfully delete task', tId);
        return;

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function getById(req, res, next) {
    L('Calling API task.getById', req.params);

    if (!req.params.id) {
        next(new errors.BadRequest('invalid task id'));
        return;
    }

    try {
        let t = await Task.findById(req.params.id, filteringItems);
        res.json(t);

    } catch (err) {
        L(err);
        next(new errors.BadRequest(err.message));
    }
}
/**
 * 鉴权，判断当前用户是否拥有对该任务的管理权限
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
        let task = await Task.findById(req.params.id, filteringItems);
        if (directlyUsers.includes(task.executor.toString())) {
            res.json(true);
        }else {
            res.json(false);
        }

    } catch (err) {
        L(err);
        next(new errors.BadRequest(err.message));
    }

}
async function taskManager(req,res,next){
    L('Calling API task.taskManager', req.query);

    try {
        //直属员工列表
        let directlyUserIds = JSON.parse(req.query.q).executor // await UserUtil.directlyUsers(req.user.sub);

        let result = {}
        let filters = null;
        //查询员工进行中的任务
        filters ={status:{'$in':['待进行','进行中']},deadline:{'$gt':new Date()},executor:{'$in':directlyUserIds}};
        result.proceedList =  await Task.find(filters);
        //查询待审批的任务
        filters = {$or:[{auditType:{$in:['','未审核']},status:{$in:['未完成','已完成']}},{status:{$in:['待进行','进行中']},deadline:{$lt:new Date()}}],executor:{'$in':directlyUserIds}};
        result.unauditList =  await Task.find(filters);
        //查询已审批的任务
        filters = {auditType: '已审批',executor:{'$in':directlyUserIds}}
        result.auditedList =  await Task.find(filters);
        res.status(200).json(result);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}
async function query(req, res, next) {
    L('Calling API task.query', req.query);

    try {
        let filters = JSON.parse(req.query.q);

        if (!filters) {
            next(new Error('invalid query string for task.query'));
            return;
        }

        if (filters.createdBefore || filters.createdAfter) {
            filters.createdAt = {};

            if (filters.createdAfter) {
                filters.createdAt.$gte = filters.createdAfter;
                delete filters.createdAfter;
            }

            if (filters.createdBefore) {
                filters.createdAt.$lte = filters.createdBefore;
                delete filters.createdBefore;
            }
        }
        if (filters.deadlineAfter || filters.deadlineBefore) {
            filters.deadline = {};

            if (filters.deadlineAfter) {
                filters.deadline.$gte = filters.deadlineAfter;
                delete filters.deadlineAfter;
            }

            if (filters.deadlineBefore) {
                filters.deadline.$lte = filters.deadlineBefore;
                delete filters.deadlineBefore;
            }
        }
        filters.companyId = req.user.cid;

        let result = await Task.find(filters, filteringItems);
        res.status(200).json(result);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}