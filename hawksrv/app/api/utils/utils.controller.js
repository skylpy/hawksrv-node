const L = require('debug')('app:api');
const aliyun = require('@lib/aliyun');
const errors = require('@lib/errors');
const Utils = require('@utils/utils.model');
module.exports = {
    sendCode,
    getOssRole,
    getPreviewFile,
    getCitys
}

async function sendCode(req, res, next) {
    L('Calling function sendCode(), params: %s', JSON.stringify(req.body));
    let phone = req.body.phone;
    
    if (!phone) {
        L('invalid input for vericode API, phone=%s', phone);
        next(new errors.BadRequest());
        return false;
    }
    let code = ''

    try {
        if (req.app.get('env') == 'development') {
            code = '1234';
        } else {
            for(let i=0; i<4; i++){
                code+=Math.floor(Math.random()*10)
            }
            await aliyun.sendVeriCode(phone, code);
        }

        await Utils.create({
            phone: phone,
            code: code
        });
        res.status(200).end();
    } catch (error) {
        L(error);
        next(new errors.ServiceUnavailable('fails to get vericode'));
    }
}

async function getOssRole(req, res, next) {

    let who = req.user.sub;
    L('(uid=%s) is asking for oss role', who);

    try {
        let credentials = await aliyun.getOssRole(who);
        let config = aliyun.getOssConfig();
        res.status(200).send({
            'credentials': credentials,
            'oss': {
                'region': config.region,
                'bucket': config.bucket
            }
        });
    } catch (err) {
        L(err);
        next(new errors.ServiceUnavailable('fails to get oss role'));
    }

}

async function getPreviewFile(req, res, next) {

    let filename = req.params.filename;
    L('fetching preview url for', filename);

    try {
        if (!filename) {
            throw new Error('invalid parameters');
        }

        let result = await aliyun.getPreviewUrl(filename);
        res.status(200).json(result);

    } catch (err) {
        L(err);
        next(new errors.BadRequest(err.message));
    }
}

async function getCitys(req, res, next) {
    L('Calling API query');

    try {

        res.status(200).sendFile(__dirname+'/city.json');
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}