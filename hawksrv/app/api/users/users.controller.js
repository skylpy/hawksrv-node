const User = require('@user/user.model');
const errors = require('@lib/errors');
const L = require('debug')('app:api');
const Company = require('@company/company.model');
const pushMsg = require('@notification/notification.controller').pushMsg;

module.exports = {
    queryAll,
    update,
    remove,
    getSalary
};

async function queryAll(req, res, next) {
    let fields = '';

    if (req.query && req.query.fields) {
        fields = req.query.fields;
        fields = fields.split(',');

        if (!fields.includes('_id')) {
            fields.push(' _id');
        }
        fields = fields.join(' ');

    } else {
        fields = '_id avatar name job department role superadmin privilege privilegeTemp phoneHidden status gender phone';
    }

    L('Calling API users.queryAll for ', fields);

    try {

        let personnel = await User.find({companyId: req.user.cid}, fields);

        L('sending personnel list', personnel);
        res.json(personnel);

    } catch (error) {
        L(error)
        next(new errors.BadRequest(error.message));
    }
}

async function update(req, res, next) {
    L('Calling API users.update', req.params, req.body);
    let updates = req.body;

    if (!updates) {
        next(new errors.BadRequest('fails to update with bad parameters'));
        return;
    }

    if (!(updates instanceof Array)) {
        updates = [req.body];
    }

    let user = updates[0];
    let userid = user["_id"];

    // pushMsg({
    //     userId:userid,
    //     category:"权限",
    //     content:"您的权限有改变哦，请查看",
    //     title:"权限提醒通知"
    // });

    updates.forEach(p => {

        if (p._id) {
            User.findByIdAndUpdate(p._id, p, (err, user) => {
                if (err) { L(err); return }

                // refresh organization setting
                p.companyId = req.user.cid;
                Company.onUserChange(p);
            })
        }

    });

    res.status(200).end();
}

async function remove(req, res, next) {
    L('Calling API users.remove', req.query.id);

    try {
        let uIdList = JSON.parse(req.query.id);

        if (!uIdList || !(uIdList instanceof Array)) {
            next(new errors.BadRequest('fails to remove users with bad parameters'));
            return;
        }

        await Company.deleteUser({
            companyId: req.user.cid,
            deleteUser: uIdList
        });

        uIdList.forEach(async uId => {
            // refresh organization setting
            (async (uId) => {
                let userInfo = await User.findOne({_id: uId});
                userInfo.isDelete = true
                userInfo.phoneHidden = true
                userInfo.status = false
                userInfo.phone = userInfo.phone + new Date()
                await userInfo.save()
            })(uId)
        });

        res.status(200).end();

    } catch (error) {
        L(error)
        next(new errors.BadRequest(error.message));
    }
}
async function getSalary(req, res, next) {
    L('Calling API user.getSalary', req.body);
    let uid = req.user.sub
    let cid = req.user.cid

    // 数据校验
    let my = await User.findOne({_id: uid})
    let flag = my.privilege.filter(p => p == '薪资录入')

    // 权限校验
    if (my.superadmin || flag.length) {
        try {
            let fields = '_id salary';
            let list = await User.find({companyId:cid}, fields)
            res.status(200).json(list);
        } catch (err) {
            L(err)
            next(new errors.BadRequest(err.message));
        }
    }else{
        next(new errors.BadRequest('No Permission'));
    }

}