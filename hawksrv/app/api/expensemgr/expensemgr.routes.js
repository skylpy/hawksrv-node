const router = require('express').Router()
const Expensemgr = require('./expensemgr.controller.js');

module.exports = router;
router.get('/noreadmysender/', Expensemgr.noreadmysenderquery);
router.get('/mysender/', Expensemgr.mysenderquery);
router.get('/mysponsor/', Expensemgr.mysponsorquery);
router.get('/', Expensemgr.query);
router.get('/:id', Expensemgr.getById);
router.post('/', Expensemgr.create);
router.put('/:id', Expensemgr.update);
router.put('/mysender/:id', Expensemgr.updatemysender);