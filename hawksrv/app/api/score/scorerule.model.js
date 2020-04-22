const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

// 一个比较长的时间
const to = new Date(2550000000000)
const ruleSchema = new Schema({
    title:String,
    rule:String,

    unit:String,
    unitValue:Number,

    valueType:String,
    value:Number,

    more: mongoose.Schema.Types.Object
})
const ScoreRuleSchema = new Schema({
    title: String,
    run: Boolean,
    status: String,
    users: [ObjectId], //应用的用户组
    date: { // 时间应用范围
        from: {type: Date, default: Date.now()},
        to: {type: Date, default: to}
    },
    ruleModule: String,// 对应的规则模块
    tag:String,
    company: ObjectId,// 所属企业
    rules: [
        ruleSchema
    ]
}, {
    timestamps: true
})
module.exports = mongoose.model('ScoreRule', ScoreRuleSchema);
