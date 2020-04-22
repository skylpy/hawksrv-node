const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const UtilsSchema = new Schema({
    phone: {
        type: String,
        require: true
    },
    code: {
        type: String,
        require: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Utils', UtilsSchema);
