const router = require('express').Router();
const Sys = require('./sys.controller');

module.exports = router;

// routes
router.get('/', Sys.getInfo);