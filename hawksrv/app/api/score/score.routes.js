const router = require('express').Router();
const Score = require('./score.controller');

module.exports = router;

// routes
router.get('/', Score.query);
router.get('/scoreRule', Score.scoreRuleList);
router.post('/scoreRule', Score.scoreRuleSave);
router.delete('/scoreRule/:id', Score.scoreRuleDelete);
router.get('/scoreRuleType', Score.scoreRuleType);
router.put('/scoreStatus/:id', Score.scoreStatus);
router.get('/downExcel', Score.downExcel);
