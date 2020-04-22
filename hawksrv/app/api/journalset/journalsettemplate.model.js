const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const L = require('debug')('app:api');
const User = require('@user/user.model');

const JournalsettemplateItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    unit: {
        type: String,
        required: true,
    },
});
const JournalsettemplateSchema = new mongoose.Schema({

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
            lowercase: true
        },
    department:{
        type: String,
        required: true,
        unique: true,
    }
},{
    timestamps: true
});



JournalsettemplateSchema.methods.notify = function(userId) {
    User.notify([userId], {
        category: "日报",
        source: userId,
        description: `您今天的日报还没提交，请记得准时提交哦`,
        ref: this._id
    });

}






module.exports = mongoose.model('Journalsettemplate', JournalsettemplateSchema);