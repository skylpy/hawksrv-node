const router = require('express').Router()
const TimeRecord = require('./timerecord.controller.js');

module.exports = router;

router.post('/', TimeRecord.add);
router.get('/', TimeRecord.query);
router.put('/', TimeRecord.edit);

