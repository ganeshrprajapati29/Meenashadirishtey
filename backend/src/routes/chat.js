const router = require('express').Router();
const c = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/conversations', c.conversations);
router.get('/:userId/messages', c.messages);
router.post('/:userId/messages', c.send);

module.exports = router;
