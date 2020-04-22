const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const PerformanceSchema = new Schema({
    companyId: {
        type: ObjectId, //公司ID
        required: true
    },
    lastContent: {
        type: String,
        required: true
    },
    lastSchedule: {
        type: String,
        required: true
    },
    finishing: {
        type: String,
        required: true
    },
    selfAssessment: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    plan: {
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

module.exports = mongoose.model('Performance', PerformanceSchema);
