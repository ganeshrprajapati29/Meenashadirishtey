const router = require('express').Router();
const c = require('../controllers/profileController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.get('/meta', c.meta);
router.get('/featured', c.featured);

router.use(protect);
router.get('/dashboard', c.dashboard);
router.get('/me', c.getMine);
router.post('/me', validate(c.schemas.profile), c.createMine);
router.put('/me', validate(c.schemas.profileUpdate), c.updateMine);
router.post('/me/photos', upload.array('photos', 6), c.uploadPhotos);
router.delete('/me/photos/:photoId', c.deletePhoto);
router.patch('/me/photos/:photoId/primary', c.setPrimaryPhoto);

router.get('/search', c.search);
router.get('/recommendations', c.recommendations);
router.get('/shortlist', c.shortlist);
router.get('/visitors', c.visitors);
router.get('/blocked', c.blockedList);

router.get('/:id', c.getOne);
router.get('/:id/contact', c.contact);
router.post('/:id/shortlist', c.toggleShortlist);
router.post('/:id/block', c.block);
router.post('/:id/report', c.report);

module.exports = router;
