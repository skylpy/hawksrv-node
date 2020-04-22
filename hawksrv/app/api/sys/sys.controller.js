const L = require('debug')('app:api');
const config = require('config');

module.exports = {
    getInfo
};

function getInfo(req, res, next) {
    L('calling sys.getInfo');

    let info = {};

    info.config = {};
    ['db', 'port', 'aliyun', 'version'].forEach(i => {
        info.config[i] = config.get(i);
    })

    res.json(info);
}