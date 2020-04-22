const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const ClockInSchema = new Schema({
    location: {
        type: Map,
        // required: function() {
        //     return this.location.lng && this.location.lat && this.location.address;
        // }
    },
    time: {
        type: String, /* HH:MM:SS */
        default: "",
    },
    offset: Number,
    photo: {
        type: [String],
        default: [],
        required: true
    },
    type:{
        type:String,
        enum: [
            '上班',
            '下班',
            '迟到',
            '早退',
            '漏卡',
            '外勤',
            '加班',
            '实时',
            '打卡'
        ]
    },
    workTime:ObjectId,
    detail: {
        type: String,
        default: ""
    },
    auditing: {
        //-1：待审核， 0审核失败，1人工审核通过，2自动审核通过
        type: String,
        default: '2',
    }
})

const TimeRecordSchema = new Schema({
    userId: {
        type: ObjectId,
        required: true
    },
    date: {
        type: String,
        required: function() {
            return /^\d\d\d\d-\d\d-\d\d$/.test(this.date);
        }
    },
    records: {
        type: [ClockInSchema],
        required: true
    }
},{
    timestamps: true
});

module.exports = mongoose.model('TimeRecord', TimeRecordSchema);