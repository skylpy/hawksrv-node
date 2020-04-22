const errors = require('@lib/errors');
const L = require('debug')('app:api');
const moment = require('moment');
const User = require('@user/user.model');
const Notification = require('@notification/notification.model');
const xgPush = require('@lib/xgPush.js');
const jPush = require('@lib/jPush.js');
moment.locale('zh-cn');
const config = require('config');

module.exports = {
    pushMsg,
    getById,
    uploadRegistrationID,
    query,
    remove,
    removeall,
    getUnreadMessageCount,
    status
};

/**
 * 推送消息
 * 参数：
 * notification.category 分类(必传)
 * notification.userId 用户ID(必传)
 * notification.title 标题(必传)
 * notification.content 内容(必传)
 * notification.url 跳转链接
 * notification.extras 扩展参数
 * notification.scheduleTime 定时发送时间 格式"2016-08-08 18:00:00"
 * @returns {Promise<void>}
 */
async function pushMsg(notification) {
    if (!notification.userId || !notification.category
        || !notification.title || !notification.content
    ) {
        throw new Error('缺少必传参数');
    }
    let user = await User.findById(notification.userId);
    notification = await Notification.create(notification);
    if(config.pushMode == 'xgpush'){
        if (user && user.xgpushId) xgPush.pushById(user.xgpushId, notification);
    }else{
        if (user && user.jpushId) jPush.pushById(user.jpushId, notification);
    }
}

// pushMsg({
//     userId: "5c95991320b33124f46928a6",
//     category: "推送测试",
//     // scheduleTime: toDate('08:00').toHawkString(),
//     content: '腾讯推送测试',
//     title: "推送测试"
// })

async function uploadRegistrationID(req, res, next) {
    if (!req.body.registrationID) {
        next(new errors.BadRequest('invalid registrationID'));
        return;
    }
    let registrationID = req.body.registrationID;
    if(req.body.pushMode == 'xgpush'){
        await User.update({xgpushId: registrationID}, {$set: {xgpushId: ''}});
        await User.update({_id: req.user.sub}, {$set: {xgpushId: registrationID}});
    }else{
        let registrationID = req.body.registrationID;
        await User.update({jpushId: registrationID}, {$set: {jpushId: ''}});
        await User.update({_id: req.user.sub}, {$set: {jpushId: registrationID}});
    }

    res.json(true);
}

/**
 * findById，会把'未读'的status设置成'已读'
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
async function getById(req, res, next) {
    L('Calling API ReportDatas.read', req.params);

    if (!req.params.id) {
        next(new errors.BadRequest('invalid ReportDatas id'));
        return;
    }

    try {
        let n = await Notification.findByIdAndUpdate(req.params.id, {status: "已读"}, {new: true})
        res.json(n);
    } catch (err) {
        L(err);
        next(new errors.BadRequest(err.message));
    }

}

async function query(req, res, next) {
    L('Calling API Notification.query', req.query);
    try {
        let params = req.query.q && JSON.parse(req.query.q) || {};
        if (!params.userId) {
            params.userId = req.user.sub;
        }
        let result = await Notification.find(params).sort({'createdAt': -1}).limit(50);
        res.status(200).json(result);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function getUnreadMessageCount(req, res, next) {
    L('Calling API Notification.getUnreadMessageCount', req.query);
    try {
        let result = await Notification.count({userId: req.user.sub, status: '未读'})
        res.status(200).json(result);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function remove(req, res, next) {

    L('Calling API Notification.remove');
    let id = req.params.id;

    if (!id) {
        next(new errors.BadRequest('invalid Notification id'));
        return;
    }

    try {
        await Notification.deleteOne({_id: id});
        res.status(200).end();

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function status(req, res, next) {

    L('Calling API Notification.remove');
    let id = req.body.id;
    let status = req.body.status;

    if (!id) {
        next(new errors.BadRequest('invalid Notification id'));
        return;
    }

    try {
        let n = await Notification.findByIdAndUpdate(req.body.id, {status}, {new: true})
        res.status(200).end();

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function removeall(req, res, next) {

    L('Calling API Notification.remove');
    let userId = req.params.userId;
    if (!userId) {
        next(new errors.BadRequest('invalid Notification id'));
        return;
    }

    try {

        var wherestr = {'userId': userId};

        Notification.remove(wherestr, function (err, res) {
            if (err) {
                console.log("Error:" + err);
            } else {
                console.log("Res:" + res);
            }
        })
        // await Notification.deleteOne({_id: id});
        res.status(200).end();

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

const filteringItems = '-__v -updatedAt';
