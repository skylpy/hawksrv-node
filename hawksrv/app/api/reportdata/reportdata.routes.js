const router = require('express').Router();
const ReportDatas = require('./reportdata.controller');

module.exports = router;

// routes
router.get('/', ReportDatas.query);
router.get('/getByUserInPeriod', ReportDatas.getByUserInPeriod);
router.get('/statistics', ReportDatas.statistics);
router.get('/:id', ReportDatas.getById);
router.get('/read/:id', ReportDatas.read);
router.get('/auth/:id', ReportDatas.auth);
router.post('/', ReportDatas.add);
router.post('/submitReport', ReportDatas.submitReport);
router.delete('/:id', ReportDatas.remove);
router.put('/:id', ReportDatas.update);