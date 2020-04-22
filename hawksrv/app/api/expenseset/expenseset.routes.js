const router = require('express').Router()
const Expensemgr = require('./expenseset.controller.js');

module.exports = router;
router.get('/', Expensemgr.query);
router.put('/', Expensemgr.create);
router.post('/', Expensemgr.update);