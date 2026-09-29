const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const { protect, authorize } = require('../middleware/auth');
const {
  getAllPosts, getPost, createPost, updatePost, deletePost,
  getNearbyNGOs, assignNGO, confirmPickup, getStats,
} = require('../controllers/foodController');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    allowed.test(path.extname(file.originalname).toLowerCase())
      ? cb(null, true)
      : cb(new Error('Only image files are allowed'));
  },
});

router.get  ('/',            getAllPosts);
router.get  ('/stats/summary', getStats);
router.get  ('/:id',         getPost);
router.post ('/',            protect, authorize('donor', 'admin'), upload.array('images', 4), createPost);
router.put  ('/:id',         protect, updatePost);
router.delete('/:id',        protect, deletePost);
router.get  ('/:id/nearby-ngos', protect, getNearbyNGOs);
router.put  ('/:id/assign/:ngoId', protect, authorize('admin', 'donor'), assignNGO);
router.put  ('/:id/pickup',  protect, authorize('ngo', 'volunteer', 'admin'), confirmPickup);

module.exports = router;
