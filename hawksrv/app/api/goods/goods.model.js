const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const GoodsSchema = new Schema({
    companyId: {
        type: ObjectId, //公司ID
        required: true
    },
    use: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    number: {
        type: String,
        required: true
    },
    photos: {
        type: [],
        required: true
    },
    approver: {
        type: String,
        required: true
    },
    sendover: {
        type: [],
        required: true
    },
    status: {
        type: String,
        required: true
    },
    creator: {
        type: String,
        required: true
    },
    comment: {
        type: String,
        default: ''
    }
},{
    timestamps: true
});

module.exports = mongoose.model('Goods', GoodsSchema);
