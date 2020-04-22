const config = require('config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./user.model');
const UserUtil = require('./user.util');
const Company = require('@company/company.model');
const RongSDK = require('../../lib/rongcloud')
const CompanyLife = require('@companylife/companylife.model');
const pushMsg = require('@notification/notification.controller').pushMsg;
const axios = require('axios');

const errors = require('@lib/errors');
const L = require('debug')('app:api');

module.exports = {
    create,
    update,
    remove,
    login,
    logout,
    register,
    getCurrent,
    getById,
    getNotification,
    removeNotification,
    getDirectlyUsers,
    setSalary,
    getSalary,
    updateRongToken,
    count,
    pushGpsMsg,
    getTrack
};

const filteringItems = '-hash -__v -createdAt -updatedAt -notification -appversion';
const filteringItems2 = '-__v -createdAt -updatedAt -notification -appversion';

async function getById(req, res, next) {
    L('Calling API user.getById, params: %O', req.params);

    if (!req.params.id) {
        next(new errors.BadRequest('invalid user id'));
        return;
    }

    try {
        let u = await User.findById(req.params.id, filteringItems);
        res.json(u);
    } catch (err) {
        L(err);
        next(new errors.BadRequest(err.message));
    }
}

async function getCurrent(req, res, next) {
    L('Calling API user.getCurrent, req.user=%o', req.user);
    let uId = req.user.sub;

    if (!uId) {
        next(new errors.Unauthorized('用户没有登录'));
        return;
    }

    try {
        let u = await User.findById(uId, filteringItems2);

        if (u.hash.substring(10) != req.user.hash) {
            throw new Error('密码已修改请重新登陆，请重新登陆');
            return
        }
        if (req.user.uuid != 'web' && req.user.uuid != u.uuid) {
            throw new Error('用户在别的机器上登陆，请重新登陆');
            return
        }
        if (!u) {
            throw new Error('该用户不存在');
        }
        if (u.isDelete) {
            throw new Error('该用户已被删除');
        }
        if (!u.status) {
            throw new Error('该用户已被停用');
        }
        if (!u.rongCloud) {
            let user = {
                id: u.id,
                name: u.name,
                portrait: 'http://7xogjk.com1.z0.glb.clouddn.com/IuDkFprSQ1493563384017406982'
            }
            let rong = await RongSDK.User.register(user).then(res => {
                u.rongCloud = res.token
                u.save()
            })
        }
        L('getting current user = %o', u);
        u.hash = null
        res.status(200).json(u);

    } catch (err) {
        L(err)
        next(new errors.BadRequest(err.message));
    }

} // getCurrent()

function create(req, res, next) {
    L('Calling API user.create, details=%o', req.body)


    register(req).then(() => {
        res.status(200).end();
    }).catch((err) => {
        L(err);
        next(new errors.BadRequest(err.message || '注册新用户失败'));
    })

} // create()

async function remove(req, res, next) {
    L('Calling API user.remove');
    let uId = req.params.id;

    if (!uId) {
        next(new errors.BadRequest('invalid user id when deleting user profile'));
        return;
    }

    try {
        await Company.deleteUser({
            companyId: req.user.cid,
            deleteUser: uId
        });

        let userInfo = await User.findOne({_id: uId});
        userInfo.isDelete = true
        userInfo.phoneHidden = true
        userInfo.status = false
        userInfo.phone = userInfo.phone + new Date()
        await userInfo.save()

        res.status(200).end();
        L('successfully delete user', uId);
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function count(req, res, next) {
    L('Calling API user.count', req.query);

    try {
        let filters = JSON.parse(req.query.q);
        filters.companyId = req.user.cid;

        let number = await User.count(filters);
        res.status(200).json(number);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function update(req, res, next) {
    L('Calling API user.update', req.body);
    let uId = req.params.id;

    if (!uId) {
        next(new errors.BadRequest('invalid user id when updating user profile'));
        return;
    }

    let profile = Object.assign({}, req.body);


    if (profile.passwd) {
        profile.hash = bcrypt.hashSync(profile.passwd, 10);
        delete profile.passwd
    } else {
        delete profile.hash;
    }


    try {
        if (req.body.status) {
            let number = await User.count({status: {$ne: false}, isDelete: {$ne: true},  companyId: req.user.cid});
            let companylife = await CompanyLife.findOne({companyId: req.user.cid});
            if (companylife.number < number) {
                throw new Error('套餐使用名额已满，请先去添加使用名额或者将其他员工停用');
            }
        }
        let u = await User.updateOne({_id: uId}, profile, {new: true});
        // refresh organization setting
        profile.companyId = req.user.cid
        Company.onUserChange(profile);

        res.status(200).json(u);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function register(req, userInfo) {
    L('Calling API user.register, details=%o', userInfo || req.body);

    try {
        let profile = userInfo || req.body;
        if (req.user && req.user.cid) {
            let number = await User.count({isDelete: {$ne: true}, companyId: req.user.cid});
            let companylife = await CompanyLife.findOne({companyId: req.user.cid});
            if (companylife.number <= number) {
                throw new Error('套餐使用名额已满，请先去添加使用名额或者将其他员工停用');
            }
        }
        let phone = profile.phone;
        let u = await User.findOne({phone,companyId:profile.companyId||req.user.cid});
        if (u) throw new Error('该号码已经注册了');

        if (!profile.companyId) profile.companyId = req.user.cid;

        profile.hash = bcrypt.hashSync(profile.passwd || '123456', 10);

        delete profile._id;
        delete profile.passwd;

        let newU = await User.create(profile);

        // refresh organization setting
        profile._id = newU.id;

        Company.onUserChange(profile);

        if (!newU.rongCloud) {
            let user = {
                id: newU.id,
                name: newU.name,
                portrait: 'http://7xogjk.com1.z0.glb.clouddn.com/IuDkFprSQ1493563384017406982'
            }
            let rong = await RongSDK.User.register(user).then(res => {
                newU.rongCloud = res.token
                newU.save()
            })
        }

        return newU;

    } catch (err) {
        L(err);
        throw err;
    }
} // register()

async function login(req, res, next) {
    L('Calling API user.login, req.body=%o', req.body);
    let {phone, passwd, uuid, multiaccount, companyId, versions} = req.body;

    try {
        if (!phone || !passwd) {
            throw new Error('登陆信息不全');
        }
        // 多帐号登陆
        if (multiaccount) {
            uList.forEach(user => {

            })
        }

        let uList = await User.find({phone}).sort({createdAt:1})//排序是为了旧版登陆第一个注册企业
        let u
        if (versions == '2' && uList.length>1) {
            // 多用户
            if (companyId) {
                //指定companyId登陆
                u = uList.find(user => user.companyId == companyId)
            } else {
                //未指定companyId企业，返回企业列表
                let inlist = uList.map(u => u.companyId)
                let cList = await Company.find({_id: {$in: inlist}})
                let onePass
                let cs = cList.map(c => {
                    let uu = uList.find(user => {
                        return user.companyId.toString() == c._id.toString()
                    })
                    let isPass = bcrypt.compareSync(passwd, (uu?uu.hash:''))
                    if(isPass)onePass=true
                    return {
                        companyId: c._id,
                        name: c.name,
                        isPass
                    }
                })
                if(onePass){
                    next(new errors.BadRequest({companyList:cs},204));
                }else{
                    throw new Error('账号和密码不匹配');
                }
            }
        } else if(versions == '2' && uList.length == 1){
            // 单用户直接登陆
            u = uList[0]
        } else if(uList.length){
            // 单用户直接登陆
            u = uList[0]
        }
        // let u = await User.findOne({phone});
        if (!u) {
            throw new Error('该用户不存在');
        }
        if (u.isDelete) {
            throw new Error('该用户已被删除');
        }

        if (!u.rongCloud) {
            var user = {
                id: u.id,
                name: u.name,
                portrait: 'http://7xogjk.com1.z0.glb.clouddn.com/IuDkFprSQ1493563384017406982'
            }
            let rong = await RongSDK.User.register(user)
            u.rongCloud = rong.token
            await u.save()
        }

        if (bcrypt.compareSync(passwd, u.hash)) {
            const {hash, ...userWithoutHash} = u.toObject();
            if (u.status) {
                const token = jwt.sign({
                    sub: u.id,
                    role: u.role,
                    cid: u.companyId,
                    uuid: uuid,//用户标识符
                    hash: u.hash.substring(10)//密码标识符
                }, config.get('secret'), {expiresIn: '30 days'});
                if (uuid != 'web' && u.uuid != uuid) {
                    u.uuid = uuid
                    u.save()
                }
                res.status(200).json({
                    'profile': userWithoutHash,
                    'token': token
                });
            } else {
                throw new Error('该账户已被停用');
            }
        } else {
            throw new Error('账号和密码不匹配');
        }

    } catch (err) {
        L(err);
        next(new errors.BadRequest(err.message));
    }

    return true;
} // login()

async function logout(req, res, next) {
    L('Calling API user.logout');
    // it doesn't really need to do anything, so just let it go
    res.status(200).end();
}

async function getNotification(req, res, next) {
    //L('calling API user.getNotification');

    try {
        let u = await User.findById(req.user.sub);
        res.status(200).json(u.notification);
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function removeNotification(req, res, next) {
    L('calling API user.removeNotification', req.params);

    try {
        let nId = req.params.nId;

        if (!nId) {
            throw new Error('invalid parameter for user.removeNotification');
        }

        await User.findByIdAndUpdate(req.user.sub, {
            $pull: {notification: {_id: nId}}
        });

        res.status(200).end();

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }

}

/**
 * 获取直属员工列表
 * @returns {Promise<void>}
 */
async function getDirectlyUsers(req, res, next) {

    L('Calling API user.getDirectlyUsers, req.user=%o', req.user);
    let uId = req.user.sub;

    if (!uId) {
        next(new errors.Unauthorized('用户没有登录'));
        return;
    }

    try {
        let userList = [];
        let list = await UserUtil.directlyUsers(uId);
        if (list && list.length) {
            for (let i in list) {
                userList[i] = await User.findById(list[i], filteringItems);
            }
        }
        res.status(200).json(userList);

    } catch (err) {
        L(err)
        next(new errors.BadRequest(err.message));
    }
}

async function setSalary(req, res, next) {
    L('Calling API user.setSalary', req.body);
    let uId = req.params.id;
    let myId = req.user.sub
    let cId = req.user.cid
    // 数据校验
    if (!uId) {
        next(new errors.BadRequest('invalid user id'));
        return;
    }
    let my = await User.findOne({_id: myId})
    let flag = my.privilege.filter(p => p == '薪资录入')

    // 权限校验
    if (my.superadmin || flag.length) {
        try {
            let u = await User.updateOne({_id: uId, companyId: cId}, {salary: req.body.salary}, {new: true})
            res.status(200).json(u);
        } catch (err) {
            L(err)
            next(new errors.BadRequest(err.message));
        }
    } else {
        next(new errors.BadRequest('No Permission'));
    }

}

async function getSalary(req, res, next) {
    L('Calling API user.getSalary', req.body);
    try {
        let uid = req.user.sub
        let cid = req.user.cid
        let id = req.params.id;

        // 数据校验
        let my = await User.findOne({_id: uid})
        let flag = my.privilege.filter(p => p == '薪资录入')

        // 权限校验
        if (!my.superadmin && !flag.length && uid != id) {
            function listD(d) {
                return d.sub.slice(0).concat(d.sub.reduce((accum, s) => {
                    return accum.concat(listD(s))
                }, []));
            }

            let company = await Company.findById(cid)
            let departmentList = listD(company.organization)
            let departments = departmentList.filter(d => {
                if (d.admin.filter(ad => ad == uid).length) {
                    if (d.employees.filter(em => em == id).length) {
                        return true
                    }
                }
                return false;
            })
            if (!departments.length) {
                return next(new errors.BadRequest('No Permission'));
            }
        }

        let fields = '_id salary';
        let u = await User.findOne({companyId: cid, _id: id}, fields)
        res.status(200).json(u);

    } catch (err) {
        L(err)
        next(new errors.BadRequest(err.message));
    }
}

async function updateRongToken(req, res, next) {
    L('Calling API user.updateRongToken', req.body);
    try {
        let uid = req.user.sub
        let my = await User.findOne({_id: uid})
        let config = {
            id: my.id,
            name: my.name,
            portrait: 'http://7xogjk.com1.z0.glb.clouddn.com/IuDkFprSQ1493563384017406982'
        }
        let token
        if (req.body.forceUpdate) {
            let rong = await RongSDK.User.register(config).then(res => {
                token = res.token
                my.rongCloud = res.token
                my.save()
            })
        } else {
            token = my.rongCloud
        }
        if (token) {
            res.status(200).json(token);
        } else {
            next(new errors.BadRequest(err.message));
        }
    } catch (err) {
        L(err)
        next(new errors.BadRequest(err.message));
    }

}

async function pushGpsMsg(req, res, next) {
    L('calling API user.pushGpsMsg', req.body);

    try {
        let {admin, superAdminId, name} = req.body
        if (admin.length) {
            admin.map(id => {
                if (req.user.sub !== superAdminId) {
                    pushMsg({
                        userId: id,
                        category: 'GPS定位',
                        content: `亲，您的下属${name}GPS定位已经关闭`,
                        title: "GPS定位提醒通知",
                    });
                }
            })
        }
        res.status(200).end();
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function getTrack(req, res, next) {
    L('calling API user.pushGpsMsg', req.body);

    try {
        if (req.body.sid && req.body.tName) {
            let data = {
                id: req.body.sid,
                name: req.body.tName,
                tid: req.body.tid || 0,
                trid: req.body.trid || 0
            }
            res.status(200).json(data);
        } else {
            let add = async () => {
                await axios({
                    url: "https://tsapi.amap.com/v1/track/service/add",
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                    },
                    params: {
                        key: '3c80f99eeb5fc53c651602c56d85b258',
                        name: Date.parse(new Date()).toString()
                    }
                }).then(function (response) {
                    res.status(200).json(response.data.data);
                })
            }
            await axios({
                url: "https://tsapi.amap.com/v1/track/service/list",
                method: 'get',
                params: {
                    key: '3c80f99eeb5fc53c651602c56d85b258'
                }
            }).then(function (response) {
                let list = response.data && response.data.data && response.data.data.results || []
                if (list.length) {
                    let checkData = async (data) => {
                        let count = 0
                        await await axios({
                            url: "https://tsapi.amap.com/v1/track/terminal/list",
                            method: 'get',
                            params: {
                                key: '3c80f99eeb5fc53c651602c56d85b258',
                                sid: data.sid
                            }
                        }).then(function (response) {
                            count = response.data && response.data.data && response.data.data.count || 0
                        })
                        return count < 9900
                    }
                    let isFind = false
                    for (let i = 0; i < list.length; i++) {
                        if (checkData(list[i])) {
                            isFind = true
                            res.status(200).json({
                                id: list[i].sid,
                                name: list[i].name
                            });
                            return
                        }
                    }
                    if (!isFind) {
                        add()
                    }
                } else {
                    add()
                }
            })
        }
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.errmsg));
    }
}
