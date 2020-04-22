const L = require('debug')('app:api');
const axios = require('axios');
const errors = require('@lib/errors');
const config = require('config');

module.exports = {
    createOrder,
    getEnterpriseComboList,
    getEnterprisePrice,
}

async function createOrder(req, res, next) {
    L('Calling function createOrder(), params: %s', JSON.stringify(req.body));
    try {
        axios.post(config.get("tradeApiUrl")+"/trade/createOrder",req.body).then(function (response){
                //response 就是请求url 返回的内容
                res.status(200).json(response.data);
            }
        ) .catch(function (error) {
            L(error);
            next(new errors.ServiceUnavailable("创建订单失败"));
        });
    }catch (e) {
        L(e);
        next(new errors.ServiceUnavailable('创建订单失败'));
        return false;

    }


}
async function getEnterpriseComboList(req, res, next) {
    L('Calling function getEnterpriseComboList(), params: %s', JSON.stringify(req.body));
    try {
        axios.get(config.get("tradeApiUrl")+"/trade/getEnterpriseComboList",req.body).then(function (response){
                //response 就是请求url 返回的内容
                res.status(200).json(response.data);
            }
        ) .catch(function (error) {
            L(error);
            next(new errors.ServiceUnavailable("获取企业套餐失败"));
        });
    }catch (e) {
        L(e);
        next(new errors.ServiceUnavailable('获取企业套餐失败'));
        return false;

    }


}
async function getEnterprisePrice(req, res, next) {
    L('Calling function getEnterprisePrice(), params: %s', JSON.stringify(req.body));
    try {
        axios.get(config.get("tradeApiUrl")+"/trade/getEnterprisePrice",req.body).then(function (response){
                //response 就是请求url 返回的内容
                res.status(200).json(response.data);
            }
        ) .catch(function (error) {
            L(error);
            next(new errors.ServiceUnavailable("获取企业套餐单价"));
        });
    }catch (e) {
        L(e);
        next(new errors.ServiceUnavailable('获取企业套餐单价'));
        return false;

    }


}

