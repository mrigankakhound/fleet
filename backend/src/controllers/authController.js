const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const env = require('../config/env');

const generateToken = (userId, username) => {
  return jwt.sign({ id: userId, username }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
};

const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'strict',
  maxAge: 8 * 60 * 60 * 1000, // 8 hours
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username: username.toLowerCase().trim() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Use updateOne to avoid triggering the pre-save hook (bcrypt re-hash) and reduce write overhead
    const loginTime = new Date();
    await User.updateOne({ _id: user._id }, { $set: { lastLogin: loginTime } });

    const token = generateToken(user._id, user.username);

    // Set httpOnly cookie
    res.cookie('fleet_token', token, cookieOptions);

    // Fire-and-forget activity log (don't await — keeps response fast)
    ActivityLog.create({
      action: 'admin_login',
      details: `Admin ${user.username} logged in`,
      performedBy: user.username,
    }).catch((err) => console.error('[Auth] Failed to write activity log:', err.message));

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          lastLogin: loginTime,
          mustChangePassword: user.mustChangePassword,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    res.clearCookie('fleet_token');
    await ActivityLog.create({
      action: 'admin_logout',
      details: `Admin ${req.user?.username || 'unknown'} logged out`,
      performedBy: req.user?.username || 'unknown',
    });
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.passwordHash = newPassword;
    user.mustChangePassword = false;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, logout, getMe, changePassword };
