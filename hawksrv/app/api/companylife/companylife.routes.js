const router = require('express').Router()
const CompanyLife = require('./companylife.controller.js');

module.exports = router;

router.get('/getByCompanyId', CompanyLife.getByCompanyId);


