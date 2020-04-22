const router = require('express').Router();
const Visit = require('./visit.controller');

module.exports = router;

// routes
router.get('/searcher', Visit.searcher);
router.post('/', Visit.create);
router.get('/', Visit.query);
router.get('/chart', Visit.chart);

router.get('/:id', Visit.getById);
router.delete('/:id', Visit.remove);
router.put('/:id', Visit.update);


