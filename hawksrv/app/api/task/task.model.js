const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const User = require('@user/user.model');
const L = require('debug')('app:api');

const TaskSchema = new Schema({
    companyId: {
        type: ObjectId,
        required: true
    },
    no:{
        type:Number,
        required:true
    },
    //发起人
    applicant: {
        type: ObjectId,
        required: true
    },
    //执行人
    executor: {
        type: ObjectId,
        required: true
    },
    //审批人
    // approval:{
    //     type: ObjectId,
    //     required: true
    // },
    //类型
    type: {
        type: String,
        required: true
    },
    //截止时间
    deadline: {
        type: Date,
        required: true
    },
    //任务内容
    content: {
        type: String,
        required: true,
    },
    //图片
    photo: [String],
    //完成时间
    finishAt: Date,
    //备注
    notes: String,
    //任务总结
    summarized: Boolean,
    summary: String,
    summaryPhoto: [String],

    indexes: [{
        name: String,
        expected: Number,
        actual: Number
    }],
    //状态
    status: {
        type: String,
        default: ["待进行"],
        enum: ["待进行", "进行中", "已完成","已取消","未完成"]
    },
    priority: {
        type: String,
        default: ["普通"],
        enum: ["普通", "非常紧急", "紧急"]
    },
    auditType:{
        type:String,
        default: '未审核',
        enum: ['未审核',"已审批", "已驳回", "已延期"]
    }
},{
    timestamps: true
});

TaskSchema.methods.notify = function() {

    if (!this.executor || !this.applicant) {
        L('invalid parameter for task notification');
        return;
    }

    if (this.status == '办理中') {
        User.notify([this.executor], {
            category: '任务',
            source: this.applicant,
            description: '您有新的任务',
            ref: this._id
        });         
    } else if (this.status == '已办理') {
        User.notify([this.applicant], {
            category: '任务',
            source: this.executor,
            description: '任务已办理，等待您的审核',
            ref: this._id
        }); 
    } else if (this.status == '已审核') {
        User.notify([this.executor], {
            category: '任务',
            source: this.applicant,
            description: '您的任务已被审核',
            ref: this._id
        }); 
    }
}

module.exports = mongoose.model('Task', TaskSchema);