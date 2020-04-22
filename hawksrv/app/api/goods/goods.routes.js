const router = require('express').Router()
const Goods = require('./goods.controller.js');

module.exports = router;

router.get('/', Goods.query);
router.put('/', Goods.create);
router.post('/', Goods.update);
