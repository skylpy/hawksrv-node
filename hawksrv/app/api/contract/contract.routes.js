const router = require('express').Router()
const Contract = require('./contract.controller.js');

module.exports = router;

// 合同审批
router.get('/', Contract.query);
router.put('/', Contract.create);
router.post('/', Contract.update);
