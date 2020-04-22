const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const ScoreRule = require('./scorerule.model');

const ScoreSchema = new Schema({
    user: ObjectId,
    at: Date,
    type: String,
    category: String,
    score: Number,
    detail: String,
    rule: Object,
    quantity: Number,
    status:{
        type:String,
        default:'正常',
        enum:['正常','撤消']
    },
    editor:ObjectId,
    ref: Object,
},{
    timestamps: true
});

module.exports = mongoose.model('Score', ScoreSchema);
