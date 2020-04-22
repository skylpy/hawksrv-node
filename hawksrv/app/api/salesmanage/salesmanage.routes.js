const router = require('express').Router()
const Salesmanage = require('./salesmanage.controller.js');

module.exports = router;

router.get('/', Salesmanage.query);
router.put('/', Salesmanage.create);
router.post('/', Salesmanage.update);
