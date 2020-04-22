const router = require('express').Router();
const Logs = require('./logs.controller');

module.exports = router;

// routes
router.get('/', Logs.query);
router.post('/', Logs.add);
router.delete('/:id', Logs.remove);