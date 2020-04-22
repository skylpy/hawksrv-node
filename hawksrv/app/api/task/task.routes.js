const router = require('express').Router();
const Task = require('./task.controller');

module.exports = router;

// routes
router.get('/taskmanager/', Task.taskManager);
router.get('/:id', Task.getById);
router.get('/auth/:id', Task.auth);
router.get('/', Task.query);

router.delete('/:id', Task.remove);
router.post('/', Task.create);
router.put('/updateStatus', Task.updateStatus);
router.put('/updateAuditType', Task.updateAuditType);
router.put('/:id', Task.update);
