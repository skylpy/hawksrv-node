const router = require('express').Router()
const Performance = require('./performance.controller.js');

module.exports = router;

router.get('/', Performance.query);
router.put('/', Performance.create);
router.post('/', Performance.update);
