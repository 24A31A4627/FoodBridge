const User = require('../models/User');
const jwt  = require('jsonwebtoken');

// Generate JWT
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  user.password = undefined; // strip password
  res.status(statusCode).json({ success: true, token, user });
};

// @route  POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, role, phone, address });
    sendToken(user, 201, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route  POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isRestricted) {
      return res.status(403).json({ success: false, message: 'Account restricted due to trust violations' });
    }

    sendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route  GET /api/auth/me
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, user });
};

// @route  PUT /api/auth/updateprofile
exports.updateProfile = async (req, res) => {
  try {
    const fields = { name: req.body.name, phone: req.body.phone, address: req.body.address };
    const user = await User.findByIdAndUpdate(req.user.id, fields, { new: true, runValidators: true });
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
