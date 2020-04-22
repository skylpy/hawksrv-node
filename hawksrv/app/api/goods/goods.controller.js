const errors = require('@lib/errors');
const L = require('debug')('app:api');
const goods = require('./goods.model');
const pushMsg = require('@notification/notification.controller').pushMsg;

module.exports = {
    create,
    query,
    update
};

async function create(req, res, next) {
    L('Calling API goods.create', req.body);

    try {
        let companyId = req.user.cid;
        let obj = req.body
        obj.companyId = companyId
        obj.creator = req.user.sub
        let apply = await goods.create(obj);

        pushMsg({
            userId: obj.approver,
            category: '物品领用',
            content:"亲，您下属向您提交物品领用申请，请尽快审批",
            title: "物品领用",
            applyId: apply._id
        });

        obj.sendover.forEach(v => {
            pushMsg({
                userId: v,
                category: '物品领用',
                content: "亲，您下属提交了物品领用申请",
                title: "物品领用",
                applyId: apply._id,
            });
        })
        res.status(200).end();
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function query(req, res, next) {
    L('Calling API goods.query');

    try {
        let filter = {
            companyId: req.user.cid
        }
        if (req.query.approver) filter.approver = req.query.approver
        if (req.query.creator) filter.creator = req.query.creator
        if (req.query.id) filter._id = req.query.id
        let result = await goods.find(filter);
        res.status(200).json(result);
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function update(req, res, next) {
    L('Calling API goods.create', req.body);

    try {
        let companyId = req.user.cid;
        let obj = req.body
        let _id = obj._id
        delete obj._id
        await goods.update({_id, companyId}, obj)
        pushMsg({
            userId: obj.creator,
            category: '物品领用',
            content: "亲，您的物品领用申请" + (obj.status == '已确认' ? '已通过' : '被驳回， 原因' + obj.comment),
            title: "物品领用",
            applyId: _id,
        });
        res.status(200).end();
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}
