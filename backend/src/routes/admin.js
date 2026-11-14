const router = require('express').Router();
const c = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(protect, adminOnly);

router.get('/stats', c.stats);

router.get('/users', c.users);
router.patch('/users/:id/status', c.setUserStatus);
router.post('/users/:id/premium', c.givePremium);
router.delete('/users/:id/premium', c.removePremium);

router.get('/profiles', c.profiles);
router.get('/profiles/:id', c.profile);
router.patch('/profiles/:id', c.moderateProfile);
router.delete('/profiles/:id/photos/:photoId', c.deletePhoto);

const bannerUpload = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'mobileImage', maxCount: 1 }]);
const flattenFiles = (req, res, next) => {
  if (req.files && !Array.isArray(req.files)) req.files = Object.values(req.files).flat();
  next();
};
router.get('/banners', c.banners.list);
router.post('/banners', bannerUpload, flattenFiles, c.banners.create);
router.put('/banners/:id', bannerUpload, flattenFiles, c.banners.update);
router.delete('/banners/:id', c.banners.remove);

router.get('/plans', c.plans.list);
router.post('/plans', c.plans.create);
router.put('/plans/:id', c.plans.update);
router.delete('/plans/:id', c.plans.remove);

const storyUpload = upload.fields([{ name: 'image', maxCount: 1 }]);
router.get('/stories', c.stories.list);
router.post('/stories', storyUpload, flattenFiles, c.stories.create);
router.put('/stories/:id', storyUpload, flattenFiles, c.stories.update);
router.delete('/stories/:id', c.stories.remove);

router.get('/payments', c.payments);
router.get('/reports', c.reports);
router.patch('/reports/:id', c.updateReport);
router.get('/enquiries', c.enquiries);
router.patch('/enquiries/:id', c.updateEnquiry);

router.get('/settings', c.getSettings);
router.put('/settings', c.updateSettings);
router.post('/broadcast', c.broadcast);

module.exports = router;
