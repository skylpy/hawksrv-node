const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const L = require('debug')('app:api');
const Company = require('@company/company.model');

const TransactionSchema = new Schema({
    companyId: {
        type: ObjectId,
        required: true,
    },
    code: {
        type: String,
        required: true,
    },
    amount: Number,
    payment: String,
    price: Number,
    quantity: Number,
    docWord: String,
    docNumber: String,
    category: String,
    date: String,
    business: String,
    bookkeeping: String,
    keyword: String,
    photo: [String],
    merchant: String,

    agent: String, // 经办人
    lister: String, // 制表人

    reviewer: String, // 审核人
    approver: String, // 审批人
    bookkeeper: String,// 出纳人

    summary: String,
    subject: String,
    status:{
        type:String,
        default:'待审核',
        enum:['审核驳回','审批驳回','收付驳回','撤回中','待审核','已审核','已审批','收付款','已完成']
    },
    codeType: String,
    objection:String
}, {
    timestamps: true
});

TransactionSchema.index({companyId: 1, date: -1});

TransactionSchema.methods.setBalance = function (previous_amount) {
    if (!this.companyId) return;
    if (!this.code.startsWith('S') && !this.code.startsWith('Z')) return;

    let netValue = this.code.startsWith('S') ? this.amount : (0 - this.amount);
    if (previous_amount) netValue -= this.code.startsWith('S') ? previous_amount : (0 - previous_amount);

    Company.findById(this.companyId, (err, company) => {
        if (err) {
            L(err);
            return;
        }

        let balance = company.balance || 0;
        balance += netValue;

        Company.findByIdAndUpdate(this.companyId, {balance}, (err, c) => {
            if (err) L(err);
        })
    });
}

module.exports = mongoose.model('Transaction', TransactionSchema);