const router = require('express').Router()
const Invitation = require('./invitation.controller.js');

module.exports = router;

router.get('/', Invitation.query);
router.put('/', Invitation.create);
router.post('/', Invitation.update);
