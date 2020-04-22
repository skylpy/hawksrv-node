const errors = require('@lib/errors');
const L = require('debug')('app:api');
const User = require('@user/user.model');
const Application = require('./application.model');
const pushMsg = require('@notification/notification.controller').pushMsg;
const excel = require('../../excel/application.export');

const CATEGORY_MAP = {
    '请假':'leave',
    '加班':'overtime',
    '出差':'travel'
}

module.exports = {
    create,
    query,
    getById,
    update
};

const filteringItems = '-__v -updatedAt -companyId';

async function create(req, res, next) {
    L('Calling API applicaiton.create', req.body);

    try {
        let obj = req.body;
        let applicant = req.user.sub;
        let companyId = req.user.cid;

        let {
            category,
            content,
            approver
        } = req.body;

        if (!category || !content || !approver) {
            throw new Error('invalid parameter for API applicaton.create');
        }

        let apply = await Application.create({
            applicant,
            companyId,
            category,
            content,
            approver
        });

        pushMsg({
            userId:obj.approver,
            category:obj.category,
            content:"亲，您下属向你提交"+obj.category+"申请",
            title:obj.category+"提醒通知",
            applyId: apply._id
        });

        apply.notify();
        res.status(200).end();

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }

}

async function getById(req, res, next) {
    L('Calling API application.getById', req.params.id);

    try {
        let aId = req.params.id;

        if (!aId) {
            throw new Error('invalid parameter for API applicaton.getById');
        }

        let a = await Application.findById(aId, filteringItems);
        res.status(200).json(a);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function query(req, res, next) {
    L('Calling API application.query', req.query);

    try {
        let filters = JSON.parse(req.query.q);

        filters.companyId = req.user.cid;

        if (req.get('download-excel')) {
            // 导出excel查询
            let trs = await Application.find({
                applicant: { '$in':filters.employees },
                createdAt: {
                    '$gte': filters.dateRange[0],
                    '$lte': filters.dateRange[1]
                },
                category: filters.category
            })

            excel[CATEGORY_MAP[filters.category]](filters.companyId, res, trs)
        } else {

            if (filters.createdBefore || filters.createdAfter) {
                filters.createdAt = {};

                if (filters.createdAfter) {
                    filters.createdAt.$gte = new Date(parseInt(filters.createdAfter));
                    delete filters.createdAfter;
                }

                if (filters.createdBefore) {
                    filters.createdAt.$lte = new Date(parseInt(filters.createdBefore));
                    delete filters.createdBefore;
                }
            }

            let result = await Application.find(filters, filteringItems);
            res.status(200).json(result);
        }


    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function update(req, res, next) {
    L('Calling API application.update', req.params.id, req.body);
    let aId = req.params.id;

    if (!aId) {
        throw new Error('invalid parameter for API applicaton.update');
    }

    try {

        let a = await Application.findByIdAndUpdate(aId, req.body, {new: true});
        pushMsg({
            userId:a["applicant"],
            category:a["category"],
            content:"您的"+a["category"]+"申请"+(a["status"] === '已通过' ? '已通过' : '被拒绝'),
            title:a["category"]+"提醒通知",
        });
        a.notify();
        res.status(200).json(a);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

