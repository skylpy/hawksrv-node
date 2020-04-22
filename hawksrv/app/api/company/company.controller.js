const Company = require('./company.model');
const L = require('debug')('app:api');
const errors = require('@lib/errors');
const createAdmin = require('@user/user.controller').register;
const User = require('@user/user.model');
const startTrial = require('@companylife/companylife.controller').startTrial;
const setBalance = require('@finance/finance.controller').setBalance;
const pushMsg = require('@notification/notification.controller').pushMsg;
const axios = require('axios');
const config = require('config');
const Utils = require('@utils/utils.model');

module.exports = {
    register,
    getById,
    getBalance,
    update,
    addTimeCard,
    updateTimeCard,
    deleteTimeCard,
    addAnnounce,
    updateAnnounce,
    deleteAnnounce,
    addVisitSet,
    updateVisitSet,
    deleteVisitSet,
    getAnnounce
}

let options = {
    new: true
};

async function update(req, res, next) {
    L('Calling company API company.update, details: %O', req.body);

    let updates = Object.assign({}, req.body);

    try {
        let updated_fields = null;
        delete updates._id;
        updated_fields = await Company.findByIdAndUpdate(
            req.user.cid,
            updates,
            {
                new: true,
                select: Object.keys(updates).join(' '),
            }
        );
        if (req.body.reportItemTemplates) {
            updated_fields = await Company.update(
                {'_id': req.body._id},
                {$set: { 'reportItemTemplates': updates.reportItemTemplates }}
            );
        }
        res.status(200).json(updated_fields);
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function register(req, res, next) {
    L('Calling company API company.register, details: %O', req.body);
    let {
        companyName,
        companyAccount,
        invitationCode,
        region,
        name,
        phone,
        passwd,
        force,
        code
    } = req.body;

    if (!companyName || !companyAccount || !name || !phone || !passwd) {
        next(new errors.BadRequest('invalid parameters for registrating new company'));
        return;
    }

    let c = null;
    try {
        let accountCompany = await Company.find({account:companyAccount});
        if (accountCompany && accountCompany.length > 0){
            next(new errors.BadRequest('该企业账号已被注册，请更换别的账号', 201));
            return;
        }
        let user = await User.find({phone:phone});
        if (!force && user && user.length > 0){
            next(new errors.BadRequest('该手机号码已被注册，请更换别的手机号码', 202));
            return;
        }
        let pcode = await Utils.find({phone: phone}).sort({'createdAt':-1})
        if (pcode.length && pcode[0].code !== code){
            next(new errors.BadRequest('手机号码和验证码不匹配'));
            return;
        }
        if (!pcode.length) {
            next(new errors.BadRequest('请点击发送验证码'));
            return;
        } else {
            // 清除验证码
            if (pcode.length) await Utils.deleteMany({phone:phone})
        }

        // create new company
        c = await Company.create({
            name: companyName,
            account: companyAccount,
            invitationCode: invitationCode,
            region: region,
            organization: { departmentId: Date.now(), name: "公司" },
            contracts: { folderId: 'contracts', name: '根目录', sub: [], files: [] },
            financialdocs: { folderId: 'contracts', name: '根目录', sub: [], files: [] },
        });

        let companyId = c._id;

        // create admin user
        let superadmin = await createAdmin(req, {
            companyId,
            name,
            phone,
            passwd,
            superadmin: true, // by default the creator is superadmin
            role: 'admin'
        });
        c.organization.employees.push(superadmin._id);
        c.organization.admin.push(superadmin._id);
        c.save();

        //开通试用
        await startTrial(companyId);
        notifyNewCompany(companyId)
        // response with success
        res.status(200).end();

    } catch (err) {
        L(err);

        if (c) {
            Company.findByIdAndDelete(c.id, (err) => {
                L(err);
            })
        }

        next(new errors.BadRequest(err.message))
    }
}
async function notifyNewCompany(id){
    try {
        axios.post(config.get("tradeApiUrl")+"/registerCompany",{id:id}).then(function (response){
            L('notify has new Company success');
            }
        ) .catch(function (error) {
            L(error);
        });
    }catch (e) {
        L(e);
        return false;

    }
}
async function getById(req, res, next) {
    L('Calling company API company.getById');

    if (!req.user.cid) {
        next(new errors.BadRequest('invalid company id'));
        return;
    }

    try {
        let c = await Company.findById(req.user.cid, '-__v');
        res.json(c);
    } catch (err) {
        L(err);
        next(new errors.BadRequest(err.message));
    }
} // getById

async function getBalance(req, res, next) {
    L('Calling company API company.getBalance');

    if (!req.user.cid) {
        next(new errors.BadRequest('invalid company id'));
        return;
    }

    try {
        // let company = await Company.findById(req.user.cid)
        // let balance = company.balance
        let balance = await setBalance(req.user.cid)
        res.json({
            balance: (balance || 0)
        });
    } catch (err) {
        L(err);
        next(new errors.BadRequest(err.message));
    }
} // getBalance

async function addTimeCard(req, res, next) {
    L('Calling API company.addTimeCard', req.body);

    let newTc = req.body;
    delete newTc._id;

    try {
        let c = await Company.findById(req.user.cid);
        c.timeCards.push(newTc);
        await c.save();
        res.status(200).end();

    } catch (error) {
        L(error);
        next(errors.BadRequest(error.message));
    }
} // addTimeCard()

async function deleteTimeCard(req, res, next) {
    L('Calling API company.deleteTimeCard', req.params);
    let tcId = req.params.id;
    if (!tcId) {
        next(new errors.BadRequest('invalid parameters id for deleting time card'));
        return;
    }

    try {
        let c = await Company.findById(req.user.cid);
        c.timeCards.id(tcId).remove();
        await c.save();
        res.status(200).end();

    } catch (error) {
        L(error);
        next(errors.BadRequest(error.message));
    }

} // deleteTimeCard()

async function updateTimeCard(req, res, next) {
    L('Calling API company.updateTimeCard', req.body);
    let tcId = req.params.id;

    if (!tcId) {
        next(new errors.BadRequest('invalid parameters id for updating time card'));
        return;
    }

    try {
        let c = await Company.findById(req.user.cid);
        c.timeCards.id(tcId).remove();
        c.timeCards.push(req.body);
        await c.save();
        res.status(200).end();

    } catch (error) {
        L(error);
        next(errors.BadRequest(error.message));
    }

} // updateTimeCard()

async function addAnnounce(req, res, next) {
    L('Calling API company.addAnnounce', req.body);

    let newAn = req.body;
    delete newAn._id;
    newAn.deadline = new Date(newAn.deadline);
    let applicant = req.user.sub;
    try {
        let c = await Company.findByIdAndUpdate(req.user.cid, {
            $push: {announces: newAn}
        }, options);
        let myuser = await User.findById(applicant);

        if (!newAn.draft){
            for (var i = 0;i < newAn.receiver.length;i ++){

                pushMsg({
                    userId:newAn.receiver[i],
                    category:"公告",
                    content: newAn.content,
                    title: `${myuser.name}给您发送公告-${newAn.title}，请查阅`
                });
            }
        }


        res.status(200).json(c.announces);

        let an = c.announces[c.announces.length-1];
        an.notify(req.user.sub);

    } catch (error) {
        L(error);
        next(errors.BadRequest(error.message));
    }
} // addAnnounce()

async function updateAnnounce(req, res, next) {
    L('Calling API company.updateAnnounce', req.body);
    let anId = req.params.id;
    let applicant = req.user.sub;
    if (!anId) {
        next(new errors.BadRequest('invalid parameters id for updateAnnounce'));
        return;
    }

    try {
        let content = req.body;
        let annouce_update = {};

        Object.keys(content).forEach(i => {
            let update_key = 'announces.$.' + i;
            annouce_update[update_key] = content[i];
        });

        if (Object.keys(annouce_update).length == 0) {
            throw new Error('invalid announce update content');
        }

        let c = await Company.findOneAndUpdate({
            _id: req.user.cid,
            "announces._id": anId
        }, {
            $set: annouce_update
        }, options);

        let an = c.announces.id(anId);
        if (an) an.notify(req.user.sub);

        let myuser = await User.findById(applicant);

        if (!content.draft){
            for (var i = 0;i < content.receiver.length;i ++){

                pushMsg({
                    userId:content.receiver[i],
                    category:"公告",
                    content: content.content,
                    title: `${myuser.name}给您发送公告-${content.title}，请查阅`
                });
            }
        }

        res.status(200).json(c.announces);

    } catch (error) {
        L(error);
        next(errors.BadRequest(error.message));
    }
} // updateAnnounce()

async function deleteAnnounce(req, res, next) {
    L('Calling API company.deleteAnnounce', req.params);
    let anId = req.params.id;

    if (!anId) {
        next(new errors.BadRequest('invalid parameters id for deleteAnnounce'));
        return;
    }

    try {
        let c = await Company.findOneAndUpdate({
            _id: req.user.cid
        }, {
            $pull: { announces: { _id: anId }}
        }, options);

        res.status(200).json(c.announces);

    } catch (error) {
        L(error);
        next(errors.BadRequest(error.message));
    }
} // deleteAnnounce()

async function addVisitSet(req, res, next) {
    L('Calling API company.addVisitSet', req.body);

    let newTc = req.body;
    delete newTc._id;

    try {
        let c = await Company.findById(req.user.cid);

        c.visitset =  {};
        c.visitset = newTc;

        await c.save();
        res.status(200).end();

    } catch (error) {
        L(error);
        next(errors.BadRequest(error.message));
    }
} // addVisitSet()

async function updateVisitSet(req, res, next) {
    L('Calling API company.updateTimeCard', req.body);
    let vsId = req.params.id;

    if (!vsId) {
        next(new errors.BadRequest('invalid parameters id for updating VisitSet'));
        return;
    }

    try {

        let visitset = req.body;

        let c = await Company.findByIdAndUpdate(
            req.user.cid
        , {
            $set: {visitset:visitset}
        }, options);

        res.status(200).json(c.visitset);

    } catch (error) {
        L(error);
        next(errors.BadRequest(error.message));
    }

} // updateVisitSet()
async function deleteVisitSet(req, res, next) {
    L('Calling API company.deleteTimeCard', req.params);
    let tcId = req.params.id;
    if (!tcId) {
        next(new errors.BadRequest('invalid parameters id for deleting time card'));
        return;
    }

    try {
        let c = await Company.findById(req.user.cid);
        c.visitset.id(tcId).remove();
        await c.save();
        res.status(200).end();

    } catch (error) {
        L(error);
        next(errors.BadRequest(error.message));
    }

}

async function getAnnounce(req, res, next) {
    L('Calling company API company.getBalance');

    if (!req.user.cid) {
        next(new errors.BadRequest('invalid company id'));
        return;
    }


    try {
        let filter = {_id: req.user.cid};
        let result = await Company.find(filter).sort({createdAt:-1});
        let dic = result[0];
        let announces = dic["announces"];
        let ans = [];
        for(var i=announces.length-1;i>=0;i--){
            let item = announces[i];
            ans.push(item)
        }
        res.status(200).json(ans);

    } catch (err) {
        L(err);
        next(new errors.BadRequest(err.message));
    }
} // getBalance
