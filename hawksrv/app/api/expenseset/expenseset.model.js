const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const ExpensesetSchema = new Schema({
    companyId: {
        type: ObjectId, //公司ID
        required: true
    },
    type: {
        type: [String],  // 费用报销类型
        default: ['差旅', '交通', '其他']
    }
},{
    timestamps: true
});

module.exports = mongoose.model('Expenseset', ExpensesetSchema);