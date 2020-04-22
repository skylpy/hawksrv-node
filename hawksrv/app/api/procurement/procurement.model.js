const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const User = require('@user/user.model');

const ProSchema = new Schema({
    name: {
        type: String, //物品名字金额
        required: true
    },
    type: {
        type: String,  //型号和规格
        required: true
    },
    number: {
        type: Number,
        required: true,
    },
    money: {
        type: Number,
        required: true,
    },
    des: {
        type: String,  //备注
        default: ""
    }
})

const ProcurementSchema = new Schema({
    applicant: {
        type: ObjectId, //申请人ID
        required: true
    },
    companyId: {
        type: ObjectId, //公司ID
        required: true
    },

    allmoney: {
        type: String  //采购总金额
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
    schedule:{
        type: [ProSchema]
    },
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

    notes: {          //拒绝理由
        type: String,
        default: ''
    },

    result: {           // 申请理由
        type: String,
        required: true
    },

    time: {            // 交付时间
        type: Date,
        required: true
    }
},{
    timestamps: true
});


module.exports = mongoose.model('Procurement', ProcurementSchema);
