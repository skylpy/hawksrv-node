const router = require('express').Router();
const Chat = require('./chat.controller');

module.exports = router;

// routes
router.post('/', Chat.create);
router.get('/', Chat.query);
router.get('/heartbeat', Chat.heartbeat);
router.put('/', Chat.update);
router.post('/online', Chat.online);
router.put('/updateLastTime', Chat.updateLastTime);
