const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const User = require('@user/user.model');

const Chat = new Schema({
    userId: {
        type: ObjectId,
        required: true
    },
    targetId: {
        type: ObjectId,
        required: true
    },
    companyId: {
        type: ObjectId,
        required: true
    },
    // 对方最后阅读时间，用于标记未读消息
    lastTime: {
        type: Date,
        required: true
    },
    // 置顶
    top: {
        type: Boolean,
        default:false
    },
    // 黑名单
    blacklist:{
        type:Boolean,
        default:false,
    },
    // 勿打扰
    notDisturb: {
        type: Boolean,
        default:false
    },
    // 未读消息数
    unread: {
        type: Number,
        default: 0,
    },
    //
    status: {
        type: String,
        default: '',
        enum: ['在线', '不在线', '']
    }
},{
    timestamps: true
});

module.exports = mongoose.model('Chat', Chat);
