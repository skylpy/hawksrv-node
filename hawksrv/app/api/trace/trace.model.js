const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const L = require('debug')('app:api');

const TraceSchema = new Schema({
    userId: {
        type: ObjectId,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    current: {
        type: Map,
        required: true
    },
    records: [Map],
    lastTraceDate:{
        type: Date,
        required: true
    },
},{
    timestamps: true
});

TraceSchema.index({userId: 1, date: -1});

TraceSchema.statics.removeOutdated = function() {

    const oneMonth = 30*24*3600*1000; // in millisec
    let past = new Date(Date.now() - oneMonth);

    this.deleteMany({ date: { $lt: past } }, function(err) {
        L('failed to clear outdated trace records');
        L(err);
    })
}

module.exports = mongoose.model('Trace', TraceSchema);