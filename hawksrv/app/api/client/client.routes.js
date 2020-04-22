const router = require('express').Router();
const Client = require('./client.controller');

module.exports = router;

// routes
router.post('/', Client.create);
router.get('/', Client.query);

// router.post('/:cId/contact', Client.addContact);
// router.put('/:cId/contact/:contactId', Client.updateContact);
// router.delete("/:cId/contact/:contactId", Client.removeContact);

router.get('/:id', Client.getById);
router.delete('/:id', Client.remove);
router.put('/:id', Client.update);