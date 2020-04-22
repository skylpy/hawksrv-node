const errors = require('@lib/errors');
const L = require('debug')('app:api');
const ReportTemplates = require('./reporttemplate.model');
module.exports = {
    add,
    query,
    remove,
    update
};

const filteringItems = '-__v -updatedAt';

async function add(req, res, next) {
    L('Calling API ReportTemplates.add', req.body);

    if (!req.body) {
        next(new errors.BadRequest('invalid parameter for ReportTemplates creation'));
        return;
    }

    try {
        let reportTemplate = req.body;
        reportTemplate.company = req.user.cid
        await ReportTemplates.create(reportTemplate);
        res.status(200).end();

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function remove(req, res, next) {
    L('Calling API ReportTemplates.remove');
    let id = req.params.id;

    if (!id) {
        next(new errors.BadRequest('invalid ReportTemplates id'));
        return;
    }

    try {
        await ReportTemplates.deleteOne({_id: id});
        res.status(200).end();

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function query(req, res, next) {
    L('Calling API finance.query', req.query);

    try {
        let params = req.query.q && JSON.parse(req.query.q) || '';

        if (!params) {
            next(new errors.BadRequest('invalid parameters for finance.query'));
            return;
        }
        let result = await ReportTemplates.findOne({
            department:params.departmentId
        })
        res.status(200).json(result);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}
async function update(req, res, next) {
    L('Calling API ReportTemplates.update');
    let cId = req.params.id;

    if (!cId) {
        next(new errors.BadRequest('invalid client id'));
        return;
    }

    try {
        req.body.company = req.user.cid
        let c = await ReportTemplates.findByIdAndUpdate(cId, req.body, {new: true});
        res.status(200).end();

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}