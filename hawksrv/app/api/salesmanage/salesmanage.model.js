const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const SalesmanageSchema = new Schema({
    companyId: {
        type: ObjectId, //公司ID
        required: true
    },
    sale: {
        type: Number,
        required: true
    },
    tsale: {
        type: Number,
        default: ''
    },
    msale: {
        type: Number,
        required: true
    },
    summary: {
        type: String,
        required: true
    },
    plan: {
        type: String,
        required: true
    },
    files: {
        type: [],
        default: []
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

module.exports = mongoose.model('Salesmanage', SalesmanageSchema);
