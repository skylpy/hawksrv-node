const router = require('express').Router();
const Notification = require('./notification.controller');

module.exports = router;

// routes
router.delete('/removeall/:userId', Notification.removeall);
router.delete('/:id', Notification.remove);
router.get('/getUnreadMessageCount',Notification.getUnreadMessageCount)
router.get('/', Notification.query);
router.put('/uploadRegistrationID', Notification.uploadRegistrationID);
router.put('/status', Notification.status);
router.get('/:id', Notification.getById);
