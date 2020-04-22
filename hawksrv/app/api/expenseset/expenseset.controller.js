const errors = require('@lib/errors');
const L = require('debug')('app:api');
const expenseset = require('./expenseset.model');

module.exports = {
    create,
    query,
    update
};

async function create(req, res, next) {
    L('Calling API expenseset.create', req.body);

    try {
        let companyId = req.user.cid;
        let obj = {companyId: companyId};
        if (req.body && req.body.type) obj.type = req.body.type
        await expenseset.create(obj);
        res.status(200).end();
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function query(req, res, next) {
    L('Calling API expenseset.query');

    try {
        let companyId = req.user.cid;
        let result = await expenseset.findOne({companyId: companyId});
        res.status(200).json(result);
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function update(req, res, next) {
    L('Calling API expenseset.create', req.body);

    try {
        let companyId = req.user.cid;
        let obj = {companyId: companyId};
        if (req.body && req.body.type) obj.type = req.body.type
        await expenseset.updateOne(obj)
        res.status(200).end();
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}
