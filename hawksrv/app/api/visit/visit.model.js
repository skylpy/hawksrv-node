const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const User = require('@user/user.model');
const L = require('debug')('app:api');

const VisitSchema = new Schema({
    companyId: ObjectId,
    creator: ObjectId,
    executor: [ObjectId],
    client: ObjectId,
    clientName: String,
    clientClassify: {
        type: String,
        enum: ['客户资料','商家资料']
    },
    contact: ObjectId,
    contactName:String,
    contactPhone:String,
    visitType:String,
    deadline: Date,
    content: String,
    clientClassify:String,

    isVisit:Boolean,
    //提示
    remind: String,

    location: {
        lng: Number,
        lat: Number,
        address: String
    },
    finishedAt: Date,
    notes: String,
    //通话时长
    duration:String,
    photo: [],
    type:{
        type:String,
        default: '走访',
        enum: ['电话','走访']
    },
    status: {
        type: String,
        default: '未完成',
        enum: ['未完成', '已完成', '已失访','已取消']
    },

    resultStatus: {
        type: String,
        default: '0',
        enum: ['0', '1']
    },

    //拜访次数
    visitNumber:{
        type:Number
    },
    // 拜访照片
    visitphoto:[],
    //拜访总结
    visitsummary:""

},{
    timestamps: true
});

VisitSchema.methods.notify = function() {

    if (!this.executor || !this.creator) {
        L('invalid parameter for visit notification');
        return;
    }

    if (this.status == '未完成') {
        User.notify([this.executor], {
            category: '拜访',
            source: this.creator,
            description: '您有新的拜访任务',
            ref: this._id
        });
    } else if (this.status == '已完成') {
        User.notify([this.creator], {
            category: '拜访',
            source: this.executor,
            description: '拜访已完成，等待您的审核',
            ref: this._id
        });
    } else if (this.status == '已失访') {
        User.notify([this.creator, this.executor], {
            category: '拜访',
            source: this.executor,
            description: '拜访任务已超过截止时间',
            ref: this._id
        });
    }
}

module.exports = mongoose.model('Visit', VisitSchema);