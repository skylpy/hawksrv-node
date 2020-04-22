const jwt = require('express-jwt');
const config = require('config');
const L = require('debug')('app:init');

module.exports = function (server) {
    const s = config.get('secret');
    server.use(jwt({secret: s}).unless({
        path: [
            '/api/user/login',
            '/api/utils/vericode',
            '/api/company/register',
            '/api/chat/online',
            '/api/utils/getCitys',
            '/api/chat/heartbeat',
        ]
    }));

    L('jwt installed.');
}

