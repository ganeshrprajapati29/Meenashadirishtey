const router = require('express').Router();
const c = require('../controllers/interestController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', c.list);
router.post('/', c.send);
router.patch('/:id', c.respond);
router.delete('/:id', c.cancel);

module.exports = router;
