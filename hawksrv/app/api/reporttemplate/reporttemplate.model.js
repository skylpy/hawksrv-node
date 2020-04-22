const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const L = require('debug')('app:api');
const User = require('@user/user.model');

const ruleSchema = new mongoose.Schema({
    rule:String,
    unitValue:Number,
    valueType:{
        type: String,
        default: 'sub',
        enum: ['add', 'sub']
    },
    value:Number
})
const ReportTemplateItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    unit: {
        type: String,
        required: true,
    },
    targetValue:{
        type: Number,
        required: true
    },
    score:[ruleSchema],
});
const ReportTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    days:
        {
            type: [String],
            default: [],
            lowercase: true
        },
    startTimeOfWeek:
        {
            type: [String],
            default: [],
            lowercase: true
        },
    endTimeOfWeek:
        {
            type: [String],
            default: [],
            lowercase: true
        },
    startTimeOfMonth:
        {
            type: [String],
            default: [],
            lowercase: true
        },
    endTimeOfMonth:
        {
            type: [String],
            default: [],
            lowercase: true
        },
    startTime:
        {
            type: String,
            default: '',
            lowercase: true
        },
    endTime:
        {
            type: String,
            default: '',
            lowercase: true
        },
    isRemind:
        {
            type: Boolean,
            default: true,
            lowercase: true
        },
    remindTime:
        {
            type: Number,
            default: 0,
            lowercase: true
        },
    remindContent:
        {
            type: String,
            default: '',
            lowercase: true
        },
    period:
        {
            type: String,
            default: 'day',
            enum: ['day','week','month'],
            lowercase: true
        },
    department:{
        type: String,
        required: true,
        unique: true,
    },
    company:{
        type: ObjectId,
        required: true,
    },
    items:[ReportTemplateItemSchema]
},{
    timestamps: true
});



ReportTemplateSchema.methods.notify = function(userId) {
    User.notify([userId], {
        category: "汇报",
        source: userId,
        description: `您今天的汇报还没提交，请记得准时提交哦`,
        ref: this._id
    });

}






module.exports = mongoose.model('ReportTemplate', ReportTemplateSchema);;