const config = require('config')
const rongcloud = config.get('rongcloud');
var RongSDK = require('rongcloud-sdk')({
    appkey: rongcloud.appkey,
    secret: rongcloud.secret
});
// API 文档: http://www.rongcloud.cn/docs/server/sdk/user/user.html#register
module.exports = RongSDK
