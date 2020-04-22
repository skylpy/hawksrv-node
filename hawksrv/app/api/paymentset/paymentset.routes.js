const router = require('express').Router()
const Paymentset = require('./paymentset.controller.js');

module.exports = router;
router.get('/', Paymentset.query);
router.put('/', Paymentset.create);
router.post('/', Paymentset.update);
