const errors = require('@lib/errors');
const L = require('debug')('app:api');
const sealType = require('./sealtype.model');
const seal = require('./seal.model');
const pushMsg = require('@notification/notification.controller').pushMsg;

module.exports = {
    createType,
    queryType,
    updateType,
    create,
    query,
    update
};

async function createType(req, res, next) {
    L('Calling API sealType.create', req.body);

    try {
        let companyId = req.user.cid;
        let obj = {companyId: companyId};
        if (req.body && req.body.type) obj.type = req.body.type
        await sealType.create(obj);
        res.status(200).end();
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function queryType(req, res, next) {
    L('Calling API sealType.query');

    try {
        let companyId = req.user.cid;
        let result = await sealType.findOne({companyId: companyId});
        res.status(200).json(result);
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function updateType(req, res, next) {
    L('Calling API sealType.create', req.body);

    try {
        let companyId = req.user.cid;
        let obj = {companyId: companyId};
        if (req.body && req.body.type) obj.type = req.body.type
        await sealType.updateOne(obj)
        res.status(200).end();
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}


async function create(req, res, next) {
    L('Calling API seal.create', req.body);

    try {
        let companyId = req.user.cid;
        let obj = req.body
        obj.companyId = companyId
        obj.creator = req.user.sub
        let apply = await seal.create(obj);

        pushMsg({
            userId: obj.approver,
            category: '用章',
            content:"亲，您下属向您提交用章申请，请尽快审批",
            title: "用章提醒通知",
            applyId: apply._id
        });

        obj.sendover.forEach(v => {
            pushMsg({
                userId: v,
                category: '用章',
                content: "亲，您下属提交了用章申请",
                title: "用章提醒通知",
                applyId: apply._id
            });
        })
        res.status(200).end();
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function query(req, res, next) {
    L('Calling API seal.query');

    try {
        let filter = {
            companyId: req.user.cid
        }
        if (req.query.approver) filter.approver = req.query.approver
        if (req.query.creator) filter.creator = req.query.creator
        if (req.query.id) filter._id = req.query.id
        let result = await seal.find(filter);
        res.status(200).json(result);
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function update(req, res, next) {
    L('Calling API seal.create', req.body);

    try {
        let companyId = req.user.cid;
        let obj = req.body
        let _id = obj._id
        delete obj._id
        await seal.update({_id, companyId}, obj)
        pushMsg({
            userId: obj.creator,
            category: '用章',
            content: "亲，您的用章申请" + (obj.status == '已确认' ? '已通过' : '被驳回， 原因' + obj.comment),
            title: "用章提醒通知",
            applyId: _id
        });
        res.status(200).end();
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}
