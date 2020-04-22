const errors = require('@lib/errors');
const L = require('debug')('app:api');
const Client = require('./client.model');
const excel = require('../../excel/client.export');

module.exports = {
    create,
    update,
    remove,
    getById,
    query,
    addContact,
    updateContact,
    removeContact
};

const filteringItems = '-__v -updatedAt';

async function create(req, res, next) {
    L('Calling API client.create', req.body);

    if (!req.body) {
        next(new errors.BadRequest('invalid parameter for client creation'));
        return;
    }

    try {
        let client = req.body;
        client.companyId = req.user.cid;
        client.serial = 'K'+new Date().getTime();
        let c = await Client.create(client);

        c.notify(req.user.sub);
        res.status(200).end();

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function update(req, res, next) {
    L('Calling API client.update');
    let cId = req.params.id;

    if (!cId) {
        next(new errors.BadRequest('invalid client id'));
        return;
    }

    try {
        let c = await Client.findByIdAndUpdate(cId, req.body, {new: true});

        c.notify(req.user.sub);
        res.status(200).end();

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function remove(req, res, next) {
    L('Calling API client.remove');
    let cId = req.params.id;

    if (!cId) {
        next(new errors.BadRequest('invalid client id'));
        return;
    }

    try {
        await Client.deleteOne({_id: cId});
        res.status(200).end();
        L('successfully delete client', cId);
        return;

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function getById(req, res, next) {
    L('Calling API client.getById', req.params);

    if (!req.params.id) {
        next(new errors.BadRequest('invalid client id'));
        return;
    }

    try {
        let c = await Client.findById(req.params.id, filteringItems);
        res.json(c);

    } catch (err) {
        L(err);
        next(new errors.BadRequest(err.message));
    }
}

async function query(req, res, next) {
    L('Calling API client.query', req.query);

    try {
        let conditions = req.query.q ? JSON.parse(req.query.q) : {};
        let filter = { companyId: req.user.cid};

        Object.keys(conditions).forEach(k => {
            if (typeof conditions[k] == 'string') {
                filter[k] = conditions[k];
            } else if (conditions[k] instanceof Array) {
                filter[k] = { $in: conditions[k] }
            } else {
                filter[k] = conditions[k];
            }
        })
      
        if (req.get('download-excel')) {
            let { downType, classify } = filter
            delete filter.downType
            delete filter.classify
            let result = await Client.find(filter, filteringItems);
            excel.query(
                { 
                    companyId: req.user.cid, 
                    userId: req.user._id,
                    downType, 
                    classify 
                }, 
                res, 
                result
            );
        } else {
            let result = await Client.find(filter, filteringItems);
            res.status(200).json(result);
        }

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function addContact(req, res, next) {
    L('Calling API client.addContact', req.body);

    let clientId = req.params.id;
    let contact = req.body;

    if (!contact || !clientId) {
        next(new Error('invalid query string for client.addContact'));
        return;
    }

    try {
        let client = await Client.findById(clientId);
        client.contacts.push(contact);
        await client.save();

        res.status(200).json(result);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function updateContact(req, res, next) {
    L('Calling API client.updateContact', req.body);

    let clientId = req.params.id;
    let contactId = req.params.clientId;
    let contact = req.body;

    if (!contact || !clientId || !contactId) {
        next(new Error('invalid query string for client.updateContact'));
        return;
    }

    try {
        await Client.findOneAndUpdate({
            "_id": clientId,
            "contacts._id": contactId
        }, {
            "contacts.$": contact
        });

        res.status(200).json(result);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function removeContact(req, res, next) {
    L('Calling API client.removeContact', req.body);

    let clientId = req.params.id;
    let contactId = req.params.clientId;

    if (!contactId || !clientId) {
        next(new Error('invalid query string for client.removeContact'));
        return;
    }

    try {
        await Client.findOneAndUpdate({_id: clientId}, {
            $pull: {contacts: {_id: contactId}}
        });

        res.status(200).json(result);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}