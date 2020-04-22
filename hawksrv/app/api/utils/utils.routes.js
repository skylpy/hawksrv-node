const router = require('express').Router();
const L = require('debug')('app:api');
const utils = require('./utils.controller');

module.exports = router;
router.post('/vericode', utils.sendCode);
router.get('/ossrole', utils.getOssRole);
router.get('/getCitys', utils.getCitys);
router.get('/preview/:filename', utils.getPreviewFile);