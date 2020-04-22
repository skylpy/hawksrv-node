const errors = require('@lib/errors');
const L = require('debug')('app:api');
const performance = require('./performance.model');
const pushMsg = require('@notification/notification.controller').pushMsg;

module.exports = {
    create,
    query,
    update
};

async function create(req, res, next) {
    L('Calling API performance.create', req.body);

    try {
        let companyId = req.user.cid;
        let obj = req.body
        obj.companyId = companyId
        obj.creator = req.user.sub
        let apply = await performance.create(obj);

        pushMsg({
            userId: obj.approver,
            category: '绩效报告',
            content:"亲，您下属向您提交绩效报告，请尽快查看",
            title: "绩效报告",
            applyId: apply._id
        });

        obj.sendover.forEach(v => {
            pushMsg({
                userId: v,
                category: '绩效报告',
                content: "亲，您下属提交了绩效报告",
                title: "绩效报告",
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
    L('Calling API performance.query');

    try {
        let filter = {
            companyId: req.user.cid
        }
        if (req.query.approver) filter.approver = req.query.approver
        if (req.query.creator) filter.creator = req.query.creator
        if (req.query.id) filter._id = req.query.id
        let result = await performance.find(filter);
        res.status(200).json(result);
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function update(req, res, next) {
    L('Calling API performance.create', req.body);

    try {
        let companyId = req.user.cid;
        let obj = req.body
        let _id = obj._id
        delete obj._id
        await performance.update({_id, companyId}, obj)
        pushMsg({
            userId: obj.creator,
            category: '绩效报告',
            content: "亲，您的绩效报告" + (obj.status == '已确认' ? '已通过' : '被驳回， 原因' + obj.comment),
            title: "绩效报告",
            applyId: _id,
        });
        res.status(200).end();
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}
