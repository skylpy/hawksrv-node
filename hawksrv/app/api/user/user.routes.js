const router = require('express').Router();
const User = require('./user.controller');

module.exports = router;

// routes
router.get('/current', User.getCurrent);
router.get('/count', User.count);
router.get('/getDirectlyUsers', User.getDirectlyUsers);
router.get('/notification', User.getNotification);

router.put('/updateRongToken', User.updateRongToken);
router.post('/login', User.login);
router.post('/logout', User.logout);
router.post('/', User.create);

router.get('/getSalary/:id', User.getSalary);
router.put('/setSalary/:id', User.setSalary)
router.delete('/notification/:nId', User.removeNotification);
router.get('/:id', User.getById);
router.put('/:id', User.update);
router.delete('/:id', User.remove);

router.post('/pushGpsMsg', User.pushGpsMsg);
router.post('/getTrack', User.getTrack);
