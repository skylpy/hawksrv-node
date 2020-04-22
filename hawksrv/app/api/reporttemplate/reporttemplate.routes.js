const router = require('express').Router();
const ReportTemplates = require('./reporttemplate.controller');

module.exports = router;

// routes
router.get('/', ReportTemplates.query);
router.post('/', ReportTemplates.add);
router.delete('/:id', ReportTemplates.remove);
router.put('/:id', ReportTemplates.update);