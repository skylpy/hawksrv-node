const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const L = require('debug')('app:api');

const NotificationSchema = new Schema({
    //分类
    category: {
        type: String,
        required: true
    },
    userId: {
        type: ObjectId,
        required: true
    },
    //标题
    title:{
        type:String,
        required:true
    },
    //内容
    content:{
        type:String,
        required:true
    },
    //拓展参数
    extras:{
        type:Object
    },
    //url
    url:{
        type:String
    },
    scheduleTime:{
        type:String
    },
    status:{
        type:String,
        default: "未读",
        enum: ['未读','已读']
    },
    applyId: {
        type:String,
        default: ''
    }

},{
    timestamps: true
});


module.exports = mongoose.model('Notification', NotificationSchema);
