const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['donor', 'ngo', 'volunteer', 'admin'],
    default: 'donor',
  },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },
  avatar: { type: String, default: '' },

  // Trust & verification
  trustScore: { type: Number, default: 50, min: 0, max: 100 },
  isVerified: { type: Boolean, default: false },
  isRestricted: { type: Boolean, default: false },
  starRating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },

  // Stats
  successfulPickups: { type: Number, default: 0 },
  failedPickups:     { type: Number, default: 0 },
  mealsSaved:        { type: Number, default: 0 },

  // Badges
  badges: {
    type: [String],
    enum: ['Saver', 'Hero', 'Hunger Warrior'],
    default: [],
  },

  createdAt: { type: Date, default: Date.now },
});

// Index for geolocation queries
UserSchema.index({ location: '2dsphere' });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update trust score and badges
UserSchema.methods.updateTrustScore = function (type) {
  if (type === 'success') {
    this.trustScore = Math.min(100, this.trustScore + 10);
    this.successfulPickups += 1;
  } else if (type === 'fail') {
    this.trustScore = Math.max(0, this.trustScore - 5);
    this.failedPickups += 1;
    if (this.failedPickups >= 3) this.isRestricted = true;
  } else if (type === 'verify') {
    this.trustScore = Math.min(100, this.trustScore + 5);
    this.isVerified = true;
  }

  // Award badges
  if (this.mealsSaved >= 10  && !this.badges.includes('Saver'))         this.badges.push('Saver');
  if (this.mealsSaved >= 100 && !this.badges.includes('Hero'))          this.badges.push('Hero');
  if (this.mealsSaved >= 500 && !this.badges.includes('Hunger Warrior')) this.badges.push('Hunger Warrior');
};

module.exports = mongoose.model('User', UserSchema);
