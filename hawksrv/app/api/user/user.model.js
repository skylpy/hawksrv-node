const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const L = require('debug')('app:api');

const NotificationSchema = new Schema({
    category: {
        type: String,
        required: true
    },
    source: {
        type: ObjectId,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    ref: {
        type: ObjectId,
        required: true
    },
    status: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const UserSchema = new Schema({
    companyId: {
        type: ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    gender: String,
    hash: {
        type: String
    },
    phone: {
        type: String,
        required: true,
        // unique: true,
        // index: true
    },

    email: String,
    avatar: String,
    job: String,
    workNumber: String,
    onBoardAt: String,
    location: String,
    phoneHidden: Boolean,
    superadmin: Boolean,
    status: {
        type:Boolean,
        default:true
    },
    privilege: [String],
    privilegeTemp: Map, // { permissions, from, to }

    // remove this item
    role: {
        type: String,
        lowercase: true,
        default: 'employee',
        enum: ['admin', 'employee', 'accountant', 'manager']
    },

    deviceLock: {
        type: String, // "": not lock; *: ready to lock; uuid: locked
        default: ""
    },
    appversion: {
        type: String,
        default: "unknown"
    },
    notification: {
        type: [NotificationSchema],
        default: []
    },
    jpushId: String,
    xgpushId: String,
    rongCloud: String,
    online: {
        type: String,
        default: 'logout',
        enum: ['online', 'offline', 'logout']
    },
    salary: {
        type: Number,
        default: 0
    },
    isDelete: {
        type: Boolean,
        default: false
    },
    uuid: String,
    sid: Number,
    tid: Number,
    tName: String,
    trid: Number
}, {
    timestamps: true
});

UserSchema.statics.notify = function (uIdList, notification) {

    L('generating new notification, category = ', notification.category);

    this.find({_id: {$in: uIdList}}, function (err, users) {
        if (err) {
            L(err);
            return;
        }

        users.forEach(u => {
            u.notification.push(notification);

            u.save(function (err, u) {
                if (err) L(err);
            });
        })
    });
}


module.exports = mongoose.model('User', UserSchema);
