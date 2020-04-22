const router = require('express').Router()
const Company = require('./company.controller.js');

module.exports = router;
router.get('/getannounce', Company.getAnnounce);

router.post('/register', Company.register);

router.post('/visit', Company.addVisitSet);
router.put('/visit/:id', Company.updateVisitSet);
router.delete('/visit/:id', Company.deleteVisitSet);

router.get('/', Company.getById);
router.get('/balance', Company.getBalance);
router.put('/', Company.update);

router.post('/timecard', Company.addTimeCard);
router.put('/timecard/:id', Company.updateTimeCard);
router.delete('/timecard/:id', Company.deleteTimeCard);

router.post('/announce', Company.addAnnounce);
router.put('/announce/:id', Company.updateAnnounce);
router.delete('/announce/:id', Company.deleteAnnounce);


