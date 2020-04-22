const router = require('express').Router()
const Journalmgr = require('./journalmgr.controller.js');

module.exports = router;

router.get('/bossquery', Journalmgr.bossquery);
router.get('/myreport/', Journalmgr.myquery);
router.get('/', Journalmgr.query);
router.get('/:id', Journalmgr.getById);
router.post('/', Journalmgr.create);
router.put('/:id', Journalmgr.update);
