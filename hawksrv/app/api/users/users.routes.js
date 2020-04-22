const router = require('express').Router();
const Users = require('./users.controller');

module.exports = router;

// routes
router.get('/', Users.queryAll);
router.put('/', Users.update);
router.delete('/', Users.remove);
router.get('/getSalary/', Users.getSalary);