const router = require('express').Router()
const Paymentmgr = require('./paymentmgr.controller.js');

module.exports = router;
router.get('/noreadmysender/', Paymentmgr.noreadmysenderquery);
router.get('/mysender/', Paymentmgr.mysenderquery);
router.get('/mysponsor/', Paymentmgr.mysponsorquery);
router.get('/', Paymentmgr.query);
router.get('/:id', Paymentmgr.getById);
router.post('/', Paymentmgr.create);
router.put('/:id', Paymentmgr.update);
router.put('/mysender/:id', Paymentmgr.updatemysender);
