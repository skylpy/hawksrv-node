const router = require('express').Router()
const Car = require('./car.controller.js');

module.exports = router;

// 车辆类型
router.get('/type', Car.queryType);
router.put('/type', Car.createType);
router.post('/type', Car.updateType);

// 用车
router.get('/', Car.query);
router.put('/', Car.create);
router.post('/', Car.update);
