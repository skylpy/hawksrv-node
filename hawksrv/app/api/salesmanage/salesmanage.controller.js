const errors = require('@lib/errors');
const L = require('debug')('app:api');
const salesmanage = require('./salesmanage.model');
const pushMsg = require('@notification/notification.controller').pushMsg;

module.exports = {
    create,
    query,
    update
};

async function create(req, res, next) {
    L('Calling API salesmanage.create', req.body);

    try {
        let companyId = req.user.cid;
        let obj = req.body
        obj.companyId = companyId
        obj.creator = req.user.sub
        let apply = await salesmanage.create(obj);

        pushMsg({
            userId: obj.approver,
            category: '销售业绩',
            content:"亲，您下属向您提交销售业绩，请尽快查看",
            title: "销售业绩",
            applyId: apply._id
        });

        obj.sendover.forEach(v => {
            pushMsg({
                userId: v,
                category: '销售业绩',
                content: "亲，您下属提交了销售业绩",
                title: "销售业绩",
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
    L('Calling API salesmanage.query');

    try {
        let filter = {
            companyId: req.user.cid
        }
        if (req.query.approver) filter.approver = req.query.approver
        if (req.query.creator) filter.creator = req.query.creator
        if (req.query.id) filter._id = req.query.id
        let result = await salesmanage.find(filter);
        res.status(200).json(result);
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function update(req, res, next) {
    L('Calling API salesmanage.create', req.body);

    try {
        let companyId = req.user.cid;
        let obj = req.body
        let _id = obj._id
        delete obj._id
        await salesmanage.update({_id, companyId}, obj)
        pushMsg({
            userId: obj.creator,
            category: '销售业绩',
            content: "亲，您的销售业绩" + (obj.status == '已确认' ? '已通过' : '被驳回， 原因' + obj.comment),
            title: "销售业绩",
            applyId: _id
        });
        res.status(200).end();
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}
