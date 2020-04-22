const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const CarTypeSchema = new Schema({
    companyId: {
        type: ObjectId, //公司ID
        required: true
    },
    type: {
        type: [String],  // 车辆类型
        default: ['车型一', '车型二', '车型三', '其他']
    }
},{
    timestamps: true
});

module.exports = mongoose.model('CarType', CarTypeSchema);
