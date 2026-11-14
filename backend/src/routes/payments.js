const router = require('express').Router();
const c = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.get('/plans', c.plans);
router.post('/order', protect, c.createOrder);
router.post('/verify', protect, c.verify);
router.get('/history', protect, c.history);

module.exports = router;
