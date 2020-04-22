const L = require('debug')('app:api');
const User = require('../user/user.model')
const ChatModel = require('./chat.model')
module.exports = {
    create,
    online,
    query,
    update,
    updateLastTime,
    heartbeat
}

async function create(req, res, next) {
    L('Calling API Chat.create', req.body);
    try {
        let {targetId} = req.body
        const userId = req.user.sub;
        const lastTime = new Date();
        let data = {
            userId: req.user.sub,
            companyId: req.user.cid,
            targetId,
            lastTime: new Date()
        }
        let chat = await ChatModel.create(data)
        res.status(200).json(chat);
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function query(req, res, next) {
    L('Calling API Chat.create', req.body);
    try {
        let targetId = req.query.targetId
        let data = {
            userId: req.user.sub,
            companyId: req.user.cid,
        }
        let chat
        if (targetId) {
            data.targetId = targetId
            chat = await ChatModel.findOne(data)
        } else {
            chat = await ChatModel.find(data)
        }
        if (chat) {
            res.status(200).json(chat);
        } else {
            res.status(200).end()
        }

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

// 对方更新阅读时间，用于本人窗口标记未读信息
async function updateLastTime(req, res, next) {
    L('Calling API Chat.updateLastTime', req.body);
    try {
        let {targetId} = req.body
        let data = {
            userId: targetId,
            companyId: req.user.cid,
            targetId: req.user.sub
        }
        await ChatModel.updateOne(data, {lastTime: new Date()})
        res.status(200).end()
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function update(req, res, next) {
    L('Calling API Chat.update', req.body);
    try {
        let {targetId, top, blacklist, notDisturb} = req.body
        let data = {
            userId: req.user.sub,
            companyId: req.user.cid,
            targetId
        }
        let update = {}
        if (top != undefined) update.top = top
        if (blacklist != undefined) update.blacklist = blacklist
        if (notDisturb != undefined) update.notDisturb = notDisturb
        await ChatModel.updateOne(data, update)
        res.status(200).end()
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function online(req, res, next) {
    L('Calling API Chat.online', req.body);
    try {
        const arr = req.body
        arr.forEach(async item => {
            const {userid, status, os, time} = item
            let online_status;
            switch (status) {
                case '0':
                    online_status = 'online'
                    break;
                case '1':
                    online_status = 'offline'
                    break;
                case '2':
                    online_status = 'logout'
                    break;
            }
            let user = await User.findByIdAndUpdate(userid, {online: online_status}, {new: true})
        })
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function heartbeat(req, res, next) {
    L('Calling API Chat.heartbeat');
    try {
        res.status(200).end()
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}