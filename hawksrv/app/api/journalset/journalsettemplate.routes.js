const router = require('express').Router();
const Journalsettemplates = require('./journalsettemplate.controller');

module.exports = router;

// routes
router.get('/', Journalsettemplates.query);
router.post('/', Journalsettemplates.add);
router.delete('/:id', Journalsettemplates.remove);
router.put('/:id', Journalsettemplates.update);