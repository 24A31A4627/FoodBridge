const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET /api/users/ngos — list all NGOs (for matching)
router.get('/ngos', protect, async (req, res) => {
  try {
    const ngos = await User.find({ role: 'ngo', isRestricted: false })
      .select('name email phone trustScore starRating isVerified location address');
    res.json({ success: true, ngos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
