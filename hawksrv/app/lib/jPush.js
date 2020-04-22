var JPush = require("jpush-async").JPushAsync;
const config = require('config');

const jpushConfig = config.get('jpush');
var client = JPush.buildClient(jpushConfig.key, jpushConfig.secret)

function pushById(id,notification){
    // full push.
    if (!id){
        return;
    }
    let push = client.push().setPlatform(JPush.ALL)
        .setAudience(JPush.registration_id(id))
        .setNotification(JPush.ios(notification.content,'default',1,true,{msgId:notification._id}), JPush.android(notification.content, notification.title, 1,{msgId:notification._id}))
        .setMessage(notification.content,notification.title,notification.category);
    if(notification.scheduleTime){
        push.setSingleSchedule(notification.scheduleTime)
            .setSchedule(notification.title, true, function (err, res) {
                if (err) {
                    console.error(err.message)
                }
            })
    }else{
        push.send(function (err, res) {
            if (err) {
                console.error(err.message)
            }
        })
    }
};

module.exports = {
    pushById,
};