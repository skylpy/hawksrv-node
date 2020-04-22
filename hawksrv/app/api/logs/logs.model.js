const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const LogsSchema = new Schema({
    user: ObjectId,
    phone: String,
    version: String,
    records: [[String]]
},{
    timestamps: true
});

module.exports = mongoose.model('Logs', LogsSchema);