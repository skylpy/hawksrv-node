const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const ContractSchema = new Schema({
    companyId: {
        type: ObjectId, //公司ID
        required: true
    },
    contract: {
        type: String,
        required: true
    },
    contractNo: {
        type: String,
        required: true
    },
    time: {
        type: Date,
        required: true
    },
    myCompanyName: {
        type: String,
        default: ''
    },
    myUserName: {
        type: String,
        default: ''
    },
    otherCompanyName: {
        type: String,
        default: ''
    },
    otherUserName: {
        type: String,
        default: ''
    },
    files: {
        type: Array,
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

module.exports = mongoose.model('Contract', ContractSchema);
