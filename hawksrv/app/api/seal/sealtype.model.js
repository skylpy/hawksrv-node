const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const SealTypeSchema = new Schema({
    companyId: {
        type: ObjectId, //公司ID
        required: true
    },
    type: {
        type: [String],  // 印章类型
        default: ['公章', '合同章', '法人章', '其他']
    }
},{
    timestamps: true
});

module.exports = mongoose.model('SealType', SealTypeSchema);
