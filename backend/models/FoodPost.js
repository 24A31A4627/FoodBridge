const mongoose = require('mongoose');

const FoodPostSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Food title is required'],
    trim: true,
    maxlength: [100, 'Title too long'],
  },
  description: { type: String, trim: true, maxlength: [500, 'Description too long'] },

  foodType: {
    type: String,
    required: true,
    enum: ['rice', 'curry', 'bread', 'snacks', 'fruits', 'vegetables', 'sweets', 'beverages', 'other'],
  },
  quantity: {
    vessels: { type: Number, required: true, min: 1 },
    unit: { type: String, enum: ['vessels', 'kg', 'litres', 'packets'], default: 'vessels' },
    estimatedServings: { type: Number, default: 0 }, // auto-calculated
  },

  // Freshness tracking
  cookedAt: { type: Date, required: true },
  safeHours: { type: Number, default: 6 }, // auto-set from foodType
  expiresAt: { type: Date }, // auto-calculated
  freshnessStatus: {
    type: String,
    enum: ['safe', 'warning', 'unsafe'],
    default: 'safe',
  },

  // AI Fields
  freshnessScore: { type: Number, default: 100, min: 0, max: 100 },
  priorityLevel:  { type: String, enum: ['low', 'medium', 'high', 'emergency'], default: 'medium' },
  suggestedNGOType: { type: String, default: '' },

  // Location
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
    address: { type: String, trim: true },
  },

  // Images
  images: [{ type: String }],
  imageFlagged: { type: Boolean, default: false },
  imageHash: { type: String, default: '' },

  // Status
  status: {
    type: String,
    enum: ['available', 'assigned', 'picked_up', 'expired', 'cancelled'],
    default: 'available',
  },
  assignedNGO:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedAt:      { type: Date },
  pickedUpAt:      { type: Date },
  autoReassignAt:  { type: Date }, // 10 min after assignment

  // Tags
  isEmergency: { type: Boolean, default: false },
  isVegetarian:{ type: Boolean, default: true  },

  createdAt: { type: Date, default: Date.now },
});

FoodPostSchema.index({ location: '2dsphere' });
FoodPostSchema.index({ status: 1, createdAt: -1 });

// Safe hours map per food type
const SAFE_HOURS_MAP = {
  rice: 6, curry: 5, bread: 8, snacks: 12,
  fruits: 24, vegetables: 12, sweets: 10, beverages: 6, other: 6,
};

// Servings estimate per vessel
const SERVINGS_MAP = {
  rice: 40, curry: 35, bread: 20, snacks: 15,
  fruits: 25, vegetables: 30, sweets: 20, beverages: 10, other: 20,
};

FoodPostSchema.pre('save', function (next) {
  // Set safe hours
  this.safeHours = SAFE_HOURS_MAP[this.foodType] || 6;

  // Calculate expiry
  this.expiresAt = new Date(this.cookedAt.getTime() + this.safeHours * 60 * 60 * 1000);

  // Calculate servings
  this.quantity.estimatedServings = (SERVINGS_MAP[this.foodType] || 20) * this.quantity.vessels;

  // Calculate freshness status
  const now = new Date();
  const elapsedHours = (now - this.cookedAt) / (1000 * 60 * 60);
  const remaining = this.safeHours - elapsedHours;
  if (remaining <= 0)                         this.freshnessStatus = 'unsafe';
  else if (remaining <= this.safeHours * 0.25) this.freshnessStatus = 'warning';
  else                                         this.freshnessStatus = 'safe';

  next();
});

module.exports = mongoose.model('FoodPost', FoodPostSchema);
