const Xinge = require('./xgPushLib');


const config = require('config')
const xgpushConfig = config.get('xgpush');


let xingeApp = new Xinge.XingeApp(xgpushConfig);

module.exports = {
    pushById: xingeApp.pushById,
};
