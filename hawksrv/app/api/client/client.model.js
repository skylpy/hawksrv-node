const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const User = require('@user/user.model');

const ContactSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    phone: Number,
    major: Boolean,
    gender: {
        type: String,
        default: '男',
        enum: ['男', '女']
    },
    department: String,
    title: String,
    email: String,
    wechat: String,
    qq: String,
    tel: String,
    fax: String,
    birthday: String,
    notes: String
});

const ClientSchema = new Schema({
    companyId: {
        type: ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    number:String,
    serial: String,
    type: String,
    grade: String,
    region: String,
    intention: String,
    location: {
        lng: Number,
        lat: Number,
        name: String,
        address: String,
        text: String
    },
    photo: [String],
    notes: String,
    manager: ObjectId, // 所属用户
    department: String, // 所属部门
    classify: {
        type: String,
        enum: ['客户资料','商家资料'],
        required: true
    },
    private: Boolean, // 是否私有
    contacts: [ContactSchema]
},{
    timestamps: true
});

ClientSchema.methods.notify = function(author) {

    if (this.manager) {
        User.notify([this.manager], {
            category: '客户',
            source: author,
            description: '有新的客户信息',
            ref: this._id
        });
    }
}

module.exports = mongoose.model('Client', ClientSchema);
