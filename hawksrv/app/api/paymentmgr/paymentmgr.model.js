const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const User = require('@user/user.model');

const PaymentmgrSchema = new Schema({
    applicant: {
        type: ObjectId, //申请人ID
        required: true
    },
    companyId: {
        type: ObjectId, //公司ID
        required: true
    },
    result: {
        type: String,
        required: true
    },
    allmoney: {       // 报销总金额
        type: String,
        required: true
    },
    types: {
        type: String,
        required: true
    },
    time: {
        type: Date,
        required: true
    },
    payee: {
        type: String,
        required: true
    },
    blank: {
        type: String,
        required: true
    },
    openingBank: {
        type: String,
        required: true
    },
    des: {
        type: String,
        default: ''
    },
    photo: {
        type: [String],  //图片
        default: []
    },
    approver: [{
        uid: ObjectId,
        status: String,
        coment: String,
        createtime:Date
    }],
    sendover:[],
    comment: {
        type: String   //评论
    },
    isread: {
        type: String,   //是否已读
        default: '0',
    },
    readIds: {
        type: [String],
        default: []
    },
    status: {
        type: String,   //状态
        default: '待审批',
        enum: ['待审批', '审批通过', '已拒绝']
    },
    notes: {
        type: String,
        default: ''
    }
},{
    timestamps: true
});

module.exports = mongoose.model('paymentmgr', PaymentmgrSchema);
