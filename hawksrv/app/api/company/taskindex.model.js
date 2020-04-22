const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const L = require('debug')('app:api');

const TaskIndexSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    benchmarks: {
        type: [{
            ratio: Number,
            penalty: Number
        }],
    }
});

TaskIndexSchema.methods.calculate = function(ratio/* 0-100 */) {
    if (ratio < 0 || ratio > 100) return;
    let bm = this.benchmarks.slice(0);
    bm.sort((a, b) => { return a.ratio < b.ratio ? -1 : 1});
    let index = bm.findIndex(b => (ratio <= b.ratio));

    if (index < 0) return 0;
    if (ratio == bm[index].ratio) return bm[index].penalty;
    if (ratio < bm[index].ratio && index > 0) return bm[index-1].penalty;
    return 0;
}

module.exports = TaskIndexSchema;