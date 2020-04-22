const router = require('express').Router()
const Application = require('./application.controller.js');

module.exports = router;

router.get('/', Application.query);
router.get('/:id', Application.getById);
router.post('/', Application.create);
router.put('/:id', Application.update);
