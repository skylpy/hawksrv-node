const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const L = require('debug')('app:api');

const DepartmentSchema = new mongoose.Schema({
    departmentId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
    },
    sub: {
        type: [this],
        default: [],
        required: true
    },
    employees: {
        type: [ObjectId],
        default: [],
        required: true
    },
    admin: {
        type: [ObjectId],
        default: [],
        required: true
    }
})

module.exports = DepartmentSchema;