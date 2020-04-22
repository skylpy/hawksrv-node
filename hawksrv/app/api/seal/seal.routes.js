const router = require('express').Router()
const Seal = require('./seal.controller.js');

module.exports = router;

router.get('/type', Seal.queryType);
router.put('/type', Seal.createType);
router.post('/type', Seal.updateType);
router.get('/', Seal.query);
router.put('/', Seal.create);
router.post('/', Seal.update);
