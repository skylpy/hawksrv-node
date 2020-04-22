const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const L = require('debug')('app:api');

const MakerSchema = new Schema({
    userId: {
        type: ObjectId,
        required: true
    },
    lng: {
        type: Number,
        required: true
    },
    lat: {
        type: Number,
        required: true
    },
    address: {
        type: String
    },
    at: {
        type: Date,
        required: true
    },
    content: {
        type: String,
        required: true
    },
});


module.exports = mongoose.model('Maker', MakerSchema);
