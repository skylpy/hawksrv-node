const router = require('express').Router();
const L = require('debug')('app:api');
const trade = require('./trade.controller');

module.exports = router;
router.post('/createOrder', trade.createOrder);
router.get('/getEnterpriseComboList', trade.getEnterpriseComboList);
router.get('/getEnterprisePrice', trade.getEnterprisePrice);
