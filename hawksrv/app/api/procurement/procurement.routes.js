const router = require('express').Router()
const Procurement = require('./procurement.controller.js');

module.exports = router;
router.get('/noreadmysender/', Procurement.noreadmysenderquery);
router.get('/mysender/', Procurement.mysenderquery);
router.get('/mysponsor/', Procurement.mysponsorquery);
router.get('/', Procurement.query);
router.get('/:id', Procurement.getById);
router.post('/', Procurement.create);
router.put('/:id', Procurement.update);
router.put('/mysender/:id', Procurement.updatemysender);
