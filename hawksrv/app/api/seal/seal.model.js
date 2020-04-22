const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const SealSchema = new Schema({
    companyId: {
        type: ObjectId, //公司ID
        required: true
    },
    result: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    number: {
        type: String,
        required: true
    },
    photos: {
        type: [],
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

module.exports = mongoose.model('Seal', SealSchema);
