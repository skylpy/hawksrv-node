const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const L = require('debug')('app:api');

const ReportTemplateItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    unit: {
        type: String,
        required: true,
    },
});

const ReportItemTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    items:[ReportTemplateItemSchema]
});


module.exports = ReportItemTemplateSchema;