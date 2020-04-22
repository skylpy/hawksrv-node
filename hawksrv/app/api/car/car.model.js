const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const CarSchema = new Schema({
    companyId: {
        type: ObjectId, //公司ID
        required: true
    },
    result: {
        type: String,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    approver: {
        type: String,
        required: true
    },
    sendover: {
        type: [],
        required: true
    },
    status: {
        type: String,
        required: true
    },
    creator: {
        type: String,
        required: true
    },
    comment: {
        type: String,
        default: ''
    }
},{
    timestamps: true
});

module.exports = mongoose.model('Car', CarSchema);
