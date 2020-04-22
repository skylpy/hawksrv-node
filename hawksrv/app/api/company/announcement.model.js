const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const L = require('debug')('app:api');
const User = require('@user/user.model');

const AnnouncementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    photo: {
        type: [String],
    },
    receiver: {
        type: [ObjectId],
        default: []
    },
    deadline: {
        type: Date
    },
    draft: {
        type: Boolean,
        default: true
    },
    creator: {
        type: String
    }
}, {
    timestamps: true
});

AnnouncementSchema.methods.notify = function(author) {

    if (!this.draft) {
        User.notify(this.receiver, {
            category: '通知',
            source: author,
            description: '您收到一个新通知: ' + this.title,
            ref: this._id
        });
    }
}

module.exports = AnnouncementSchema;