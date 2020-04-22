const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const InvitationSchema = new Schema({
    companyId: {
        type: ObjectId, //公司ID
        required: true
    },
    name: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    contactName: {
        type: String,
        required: true
    },
    invitation: {
        type: String,
        required: true
    },
    time: {
        type: Date,
        required: true
    },
    des: {
        type: String,
        default: ''
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

module.exports = mongoose.model('Invitation', InvitationSchema);
