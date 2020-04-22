const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const User = require('@user/user.model');


const JournalmgrSchema = new Schema({
    applicant: {
        type: ObjectId, //申请人ID
        required: true
    },
    companyId: {
        type: ObjectId, //公司ID
        required: true
    },
    department: {
        type: String,
        required: true
    },
    photos: {
        type: [String],  //图片
        default: []
    },
    approver: [],

    content:{
        type: String   //内容

    },

    comment: {
        type: String   //评论
    },
    rtype: {
        type: String,   //日报类型
        default: '日报',
        enum: ['日报', '周报', '月报','年报']
    },
    status: {
        type: String,   //状态
        default: '未读',
        enum: ['未读', '已读', '已驳回','已确认']
    },
    plan: {
        type: String,
        default: ''
    },
    approver: {
        type: Array,
        default: []
    }
},{
    timestamps: true
});

JournalmgrSchema.methods.notify = function() {

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

module.exports = mongoose.model('Journalmgr', JournalmgrSchema);
