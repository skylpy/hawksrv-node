const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const User = require('@user/user.model');

const ApplicationSchema = new Schema({
    applicant: {
        type: ObjectId,
        required: true
    },
    companyId: {
        type: ObjectId,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    content: {
        type: Map,
        required: true
    },
    approver: {
        type: ObjectId,
        required: true
    },
    comment: {
        type: String
    },
    status: {
        type: String,
        default: '待审批',
        enum: ['待审批', '已通过', '已拒绝']
    }
},{
    timestamps: true
});

ApplicationSchema.methods.notify = function() {

    if (this.status == '待审批') {
        User.notify([this.approver], {
            category: this.category,
            source: this.applicant,
            description: `有新的${this.category}申请在等待审批`,
            ref: this._id
        });        
    } else {
        User.notify([this.applicant], {
            category: this.category,
            source: this.approver,
            description: `您的${this.category}申请${this.status}`,
            ref: this._id
        });
    }

}

module.exports = mongoose.model('Application', ApplicationSchema);