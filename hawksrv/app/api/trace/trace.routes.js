const router = require('express').Router()
const Trace = require('./trace.controller.js');

module.exports = router;

router.post('/', Trace.add);
router.get('/current', Trace.getCurrentPosition);
router.get('/', Trace.query);
router.post('/create', Trace.create);
router.get('/maker', Trace.findMaker);
