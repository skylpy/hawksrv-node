const errors = require('@lib/errors');
const L = require('debug')('app:api');
const Logs = require('./logs.model');

module.exports = {
    add,
    query,
    remove
};

const filteringItems = '-__v -updatedAt';

async function add(req, res, next) {
    L('Calling API logs.add', req.body);

    if (!req.body) {
        next(new errors.BadRequest('invalid parameter for logs creation'));
        return;
    }

    try {
        let logs = req.body;
        await Logs.create(logs);
        res.status(200).end();

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function remove(req, res, next) {
    L('Calling API logs.remove');
    let id = req.params.id;

    if (!id) {
        next(new errors.BadRequest('invalid logs id'));
        return;
    }

    try {
        await Logs.deleteOne({_id: id});
        res.status(200).end();

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function query(req, res, next) {
    L('Calling API logs.query', req.query);

    try {
        let phone = req.query.phone;

        if (!phone) {
            next(new Error('invalid phone number for logs.query'));
            return;
        }

        let result = await Logs.find({phone}, filteringItems);
        res.status(200).json(result);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}