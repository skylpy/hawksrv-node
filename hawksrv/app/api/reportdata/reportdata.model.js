const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const L = require('debug')('app:api');

const ReportDataItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    value: {
        type: Number,
        default:0,
        required: true
    },
    unit: {
        type: String,
        required: true,
    },
});

const ReportDataSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    user: {
        type: ObjectId,
        index: true,
        required: true
    },
    userName: {
        type: String,
        lowercase: true,
        required: true
    },
    department: {
        type: String,
        index: true,
        required: true
    },
    company:{
        type: ObjectId,
        index: true,
        required: true
    },
    template: {
        type: ObjectId,
        index: true,
        required: true
    },
    status:{
        type:String,
        default: "未读",
        enum: ['未读','已读','已驳回','已确认','已撤回']
    },
    remark:{
        type:String,
    },
    items:[ReportDataItemSchema],
    approver: {
        type: Array,
        default: []
    }
},{
    timestamps: true
});










module.exports = mongoose.model('ReportData', ReportDataSchema);