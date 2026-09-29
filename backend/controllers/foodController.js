const FoodPost = require('../models/FoodPost');
const User     = require('../models/User');

// Haversine distance in km
const haversine = ([lng1, lat1], [lng2, lat2]) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// @route  GET /api/food
exports.getAllPosts = async (req, res) => {
  try {
    const { status, foodType, priority, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (status)   filter.status    = status;
    if (foodType) filter.foodType  = foodType;
    if (priority) filter.priorityLevel = priority;

    const posts = await FoodPost.find(filter)
      .populate('donor', 'name trustScore starRating isVerified role')
      .populate('assignedNGO', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await FoodPost.countDocuments(filter);
    res.json({ success: true, count: posts.length, total, posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route  GET /api/food/:id
exports.getPost = async (req, res) => {
  try {
    const post = await FoodPost.findById(req.params.id)
      .populate('donor', 'name email phone trustScore isVerified')
      .populate('assignedNGO', 'name email phone');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route  POST /api/food
exports.createPost = async (req, res) => {
  try {
    const { title, description, foodType, vessels, unit, cookedAt,
            lat, lng, address, isEmergency, isVegetarian } = req.body;

    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    const post = await FoodPost.create({
      donor: req.user.id,
      title, description, foodType,
      quantity: { vessels: Number(vessels), unit: unit || 'vessels' },
      cookedAt: new Date(cookedAt),
      location: { coordinates: [parseFloat(lng), parseFloat(lat)], address },
      images,
      isEmergency: isEmergency === 'true',
      isVegetarian: isVegetarian !== 'false',
    });

    res.status(201).json({ success: true, post });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @route  PUT /api/food/:id
exports.updatePost = async (req, res) => {
  try {
    let post = await FoodPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.donor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    post = await FoodPost.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route  DELETE /api/food/:id
exports.deletePost = async (req, res) => {
  try {
    const post = await FoodPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.donor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await post.deleteOne();
    res.json({ success: true, message: 'Post removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route  GET /api/food/:id/nearby-ngos
// Returns top 5 NGOs sorted by distance + trust score
exports.getNearbyNGOs = async (req, res) => {
  try {
    const post = await FoodPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const ngos = await User.find({ role: 'ngo', isRestricted: false })
      .select('name email phone trustScore starRating isVerified location address');

    const [pLng, pLat] = post.location.coordinates;
    const ranked = ngos
      .map(ngo => ({
        ...ngo.toObject(),
        distanceKm: haversine([pLng, pLat], ngo.location.coordinates),
      }))
      .filter(n => n.distanceKm <= 20) // within 20km
      .sort((a, b) => {
        // Score = lower distance + higher trust
        const scoreA = a.distanceKm - a.trustScore * 0.1;
        const scoreB = b.distanceKm - b.trustScore * 0.1;
        return scoreA - scoreB;
      })
      .slice(0, 5);

    res.json({ success: true, ngos: ranked });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route  PUT /api/food/:id/assign/:ngoId
exports.assignNGO = async (req, res) => {
  try {
    const post = await FoodPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    post.status      = 'assigned';
    post.assignedNGO = req.params.ngoId;
    post.assignedAt  = new Date();
    post.autoReassignAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await post.save();

    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route  PUT /api/food/:id/pickup
exports.confirmPickup = async (req, res) => {
  try {
    const post = await FoodPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    post.status    = 'picked_up';
    post.pickedUpAt = new Date();
    await post.save();

    // Update donor trust + meals saved
    const donor = await User.findById(post.donor);
    if (donor) {
      donor.mealsSaved += post.quantity.estimatedServings;
      donor.updateTrustScore('success');
      await donor.save();
    }

    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route  GET /api/food/stats/summary
exports.getStats = async (req, res) => {
  try {
    const total       = await FoodPost.countDocuments();
    const available   = await FoodPost.countDocuments({ status: 'available' });
    const pickedUp    = await FoodPost.countDocuments({ status: 'picked_up' });
    const mealsSavedAgg = await FoodPost.aggregate([
      { $match: { status: 'picked_up' } },
      { $group: { _id: null, total: { $sum: '$quantity.estimatedServings' } } },
    ]);
    const mealsSaved = mealsSavedAgg[0]?.total || 0;
    res.json({ success: true, stats: { total, available, pickedUp, mealsSaved } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
