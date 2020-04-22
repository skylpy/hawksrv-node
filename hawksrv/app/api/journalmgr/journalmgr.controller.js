const errors = require('@lib/errors');
const L = require('debug')('app:api');
const User = require('@user/user.model');
const journalmgr = require('./journalmgr.model');
const journalmgrDataUtil = require('./journalmgr.util');
const JournalTemplates = require('../journalset/journalsettemplate.model');
const pushMsg = require('@notification/notification.controller').pushMsg;
const user = require('../user/user.model');

module.exports = {
    create,
    query,
    getById,
    update,
    myquery,
    bossquery
};

const filteringItems = '-__v -updatedAt -companyId';

async function create(req, res, next) {
    L('Calling API expensemgr.create', req.body);

    try {
        let obj = req.body;
        let applicant = req.user.sub;
        let companyId = req.user.cid;
        obj.companyId = companyId;
        obj.applicant = applicant;
        let template = await JournalTemplates.findOne({
            department:obj.department
        })
        L(obj);
        var error = null;
        L('template',template);
        await journalmgrDataUtil.checkSubmitDate(template,new Date(),function (msg) {
            error = new errors.CustomError("提示",msg,501,501)
        })

        if (error){
            next(error);
            return;
        }
        let apply = await journalmgr.create(obj);

        let myuser = await User.findById(applicant);
        for (var i = 0; i < obj.approver.length; i++){
            pushMsg({
                applyId: apply._id,
                userId:obj.approver[i],
                category:"日报",
                content:obj.content,
                title:myuser.name+"给你发送日报"
            });
            // url:"/office/journaldetail/"
        }

        apply.notify();
        res.status(200).end();

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }

}

async function getById(req, res, next) {
    L('Calling API expensemgr.getById', req.params.id);

    try {
        let aId = req.params.id;

        if (!aId) {
            throw new Error('invalid parameter for API applicaton.getById');
        }

        let a = await journalmgr.findById(aId, filteringItems);
        res.status(200).json(a);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function bossquery(req, res, next) {
    L('Calling API application.query', req.query);

    try {
        let filters = JSON.parse(req.query.q);

        if (filters.createdBefore || filters.createdAfter) {
            filters.createdAt = {};

            if (filters.createdAfter) {
                filters.createdAt.$gte = new Date(filters.createdAfter);
                delete filters.createdAfter;
            }

            if (filters.createdBefore) {
                filters.createdAt.$lte = new Date(filters.createdBefore);
                delete filters.createdBefore;
            }
        } else {
            if (filters.createdAt != null){
                let start = new Date(filters.createdAt), end = new Date(filters.createdAt);
                start.setHours(0);
                start.setMinutes(0);
                start.setSeconds(0);
                end.setHours(23);
                end.setMinutes(59);
                end.setSeconds(59);

                filters.createdAt = {
                    $gte: start,
                    $lte: end
                }
            }
        }

        filters.companyId = req.user.cid;

        let result = await journalmgr.find(filters, filteringItems).sort({createdAt:-1});

        res.status(200).json(result);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function query(req, res, next) {
    L('Calling API application.query', req.query);

    try {
        let filters = JSON.parse(req.query.q);

        if (filters.createdBefore || filters.createdAfter) {
            filters.createdAt = {};

            if (filters.createdAfter) {
                filters.createdAt.$gte = new Date(filters.createdAfter);
                delete filters.createdAfter;
            }

            if (filters.createdBefore) {
                filters.createdAt.$lte = new Date(filters.createdBefore);
                delete filters.createdBefore;
            }
        } else {
            if (filters.createdAt != null) {
                let start = new Date(filters.createdAt), end = new Date(filters.createdAt);
                start.setHours(0);
                start.setMinutes(0);
                start.setSeconds(0);
                end.setHours(23);
                end.setMinutes(59);
                end.setSeconds(59);

                filters.createdAt = {
                    $gte: start,
                    $lte: end
                }
            }
        }

        if (filters.applicant) {
            filters.applicant = {$in: filters.applicant}
        } else {
            filters.companyId = req.user.cid;
            // filters["approver.uid"] = req.user.sub;
            filters.approver = req.user.sub;
        }

        L('Calling API application.query', filters)
        let result = await journalmgr.find(filters, filteringItems).sort({createdAt:-1});

        res.status(200).json(result);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function myquery(req, res, next) {
    L('Calling API application.query', req.query);

    try {
        let filters = JSON.parse(req.query.q);

        if (filters.createdBefore || filters.createdAfter) {
            filters.createdAt = {};

            if (filters.createdAfter) {
                filters.createdAt.$gte = new Date(filters.createdAfter);
                delete filters.createdAfter;
            }

            if (filters.createdBefore) {
                filters.createdAt.$lte = new Date(filters.createdBefore);
                delete filters.createdBefore;
            }
        }

        filters.companyId = req.user.cid;
        filters.applicant = req.user.sub;

        let result = await journalmgr.find(filters, filteringItems).sort({createdAt:-1});

        res.status(200).json(result);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function update(req, res, next) {
    L('Calling API journalmgr.update', req.params.id, req.body);
    let aId = req.params.id;

    if (!aId) {
        throw new Error('invalid parameter for API journalmgr.update');
    }

    try {
        let applicant = req.user.sub;
        let a = await journalmgr.findByIdAndUpdate(aId, req.body, {new: true});
        let myuser = await User.findById(applicant);
        if (a["status"] == "已驳回") {
            pushMsg({
                userId:a["applicant"],
                category:"日报",
                content:"您的日报已被"+myuser.name+"驳回，"+"驳回原因是"+a["comment"],
                title:"日报驳回通知",
            });
        }

        a.notify();
        res.status(200).json(a);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

