const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const User = require('@user/user.model');

const ExpSchema = new Schema({
    money: {
        type: Number, //报销金额
        required: true
    },
    types: {
        type: String,  //报销类型
        required: true
    },
    des: {
        type: String,  //费用明细
        default: ""
    }
})

const ExpensemgrSchema = new Schema({
    applicant: {
        type: ObjectId, //申请人ID
        required: true
    },
    companyId: {
        type: ObjectId, //公司ID
        required: true
    },

    allmoney: {
        type: String  //报销总金额
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
        type: [ExpSchema]
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

    notes: {
        type: String,
        default: ''
    }
},{
    timestamps: true
});

ExpensemgrSchema.methods.notify = function() {

    // if (this.status == '待审批') {
    //     User.notify([this.approver], {
    //         category: this.category,
    //         source: this.applicant,
    //         description: `有新的${this.category}申请在等待审批`,
    //         ref: this._id
    //     });
    // } else {
    //     User.notify([this.applicant], {
    //         category: this.category,
    //         source: this.approver,
    //         description: `您的${this.category}申请${this.status}`,
    //         ref: this._id
    //     });
    // }

}

module.exports = mongoose.model('Expensemgr', ExpensemgrSchema);