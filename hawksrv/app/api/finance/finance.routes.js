const router = require('express').Router();
const Finance = require('./finance.controller');

module.exports = router;

// routes
router.post('/transaction', Finance.add);
router.put('/transaction/:id', Finance.update);
router.get('/transaction', Finance.query);
router.get('/transaction/info', Finance.info);
router.get('/transaction/audit', Finance.audit);
