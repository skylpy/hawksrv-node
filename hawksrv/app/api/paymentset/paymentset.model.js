const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const PaymentsetSchema = new Schema({
    companyId: {
        type: ObjectId, //公司ID
        required: true
    },
    type: {
        type: [String],  // 费用报销类型
        default: ['银行卡', '现金', '汇票', '电汇', '贷记', '支票', '其他']
    }
},{
    timestamps: true
});

module.exports = mongoose.model('Paymentset', PaymentsetSchema);
