const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const logger = require('../config/logger');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Register new user
router.post('/register', validate(schemas.register), async (req, res) => {
  try {
    const { name, email, password, role, phoneNumber, dateOfBirth } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
      phoneNumber,
      dateOfBirth,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    logger.info(`New user registered: ${email} (${role})`);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    logger.info(`User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        profile: user.profile,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phoneNumber: req.user.phoneNumber,
        dateOfBirth: req.user.dateOfBirth,
        profile: req.user.profile,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    logger.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticate, validate(schemas.updateProfile), async (req, res) => {
  try {
    const allowedUpdates = ['name', 'phoneNumber', 'dateOfBirth', 'fcmToken', 'profile'];
    const updates = {};

    // Only include allowed fields
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    logger.info(`Profile updated for user: ${user.email}`);

    res.json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    logger.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update FCM token for push notifications
router.post('/fcm-token', authenticate, async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ error: 'FCM token is required' });
    }

    await User.findByIdAndUpdate(req.user._id, { fcmToken });

    logger.info(`FCM token updated for user: ${req.user.email}`);

    res.json({ message: 'FCM token updated successfully' });
  } catch (error) {
    logger.error('FCM token update error:', error);
    res.status(500).json({ error: 'Failed to update FCM token' });
  }
});

// Logout (client-side only, but we can log it)
router.post('/logout', authenticate, (req, res) => {
  logger.info(`User logged out: ${req.user.email}`);
  res.json({ message: 'Logout successful' });
});

// Refresh token
router.post('/refresh', authenticate, (req, res) => {
  try {
    const token = generateToken(req.user._id);
    res.json({ token });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

module.exports = router;