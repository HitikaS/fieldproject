const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT token with proper expiry
const generateToken = (userId) => {
  return jwt.sign(
    { 
      userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
    }, 
    process.env.JWT_SECRET,
    { algorithm: 'HS256' }
  );
};

// Generate refresh token (longer expiry)
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw error;
  }
};

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password, fullName, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email 
          ? 'User with this email already exists' 
          : 'Username already taken'
      });
    }

    // Only allow admin registration if it's the first user or requested by existing admin
    let userRole = 'user'; // Default role
    
    if (role === 'admin') {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        // First user can be admin
        userRole = 'admin';
      } else {
        // Only existing admins can create new admins
        return res.status(403).json({
          message: 'Admin registration requires existing admin authorization'
        });
      }
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      fullName,
      role: userRole
    });

    await user.save();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      message: `${userRole === 'admin' ? 'Admin' : 'User'} registered successfully`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        ecoPoints: user.ecoPoints,
        rank: user.rank
      },
      token,
      refreshToken,
      expiresIn: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Registration failed',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        ecoPoints: user.ecoPoints,
        rank: user.rank,
        profilePicture: user.profilePicture,
        location: user.location
      },
      token,
      refreshToken,
      expiresIn: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Login failed',
      error: error.message
    });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('achievements');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        profilePicture: user.profilePicture,
        location: user.location,
        ecoPoints: user.ecoPoints,
        rank: user.rank,
        carbonFootprint: user.carbonFootprint,
        waterUsage: user.waterUsage,
        achievements: user.achievements,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      message: 'Failed to get user profile',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const {
      fullName,
      profilePicture,
      location,
      preferences
    } = req.body;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (fullName) user.fullName = fullName;
    if (profilePicture) user.profilePicture = profilePicture;
    if (location) user.location = { ...user.location, ...location };
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        profilePicture: user.profilePicture,
        location: user.location,
        ecoPoints: user.ecoPoints,
        rank: user.rank,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      message: 'Failed to change password',
      error: error.message
    });
  }
};

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
// @access  Public
const getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const users = await User.getLeaderboard(limit);

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      ecoPoints: user.ecoPoints,
      carbonFootprint: user.carbonFootprint.total,
      waterUsage: user.waterUsage.total,
      location: user.location.city,
      userRank: user.rank
    }));

    res.json({
      leaderboard,
      totalUsers: await User.countDocuments({ isActive: true })
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      message: 'Failed to get leaderboard',
      error: error.message
    });
  }
};

// @desc    Get user stats
// @route   GET /api/users/stats
// @access  Private
const getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's rank position
    const usersWithHigherPoints = await User.countDocuments({
      ecoPoints: { $gt: user.ecoPoints },
      isActive: true
    });
    const userPosition = usersWithHigherPoints + 1;

    // Calculate this month's stats (you can expand this with actual calculations from logs)
    const thisMonth = new Date();
    const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
    
    const stats = {
      ecoPoints: user.ecoPoints,
      rank: user.rank,
      position: userPosition,
      carbonFootprint: {
        total: user.carbonFootprint.total,
        thisMonth: user.carbonFootprint.monthlyAverage
      },
      waterUsage: {
        total: user.waterUsage.total,
        thisMonth: user.waterUsage.monthlyAverage
      },
      achievements: {
        total: user.achievements.length,
        recent: user.achievements.slice(-3)
      },
      joinedDate: user.createdAt,
      activeDays: Math.floor((new Date() - user.createdAt) / (1000 * 60 * 60 * 24))
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      message: 'Failed to get user stats',
      error: error.message
    });
  }
};

// @desc    Search users (admin only)
// @route   GET /api/users/search
// @access  Private (Admin)
const searchUsers = async (req, res) => {
  try {
    const { q, role, city, limit = 20, page = 1 } = req.query;
    
    const query = { isActive: true };
    
    if (q) {
      query.$or = [
        { username: new RegExp(q, 'i') },
        { fullName: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') }
      ];
    }
    
    if (role) query.role = role;
    if (city) query['location.city'] = new RegExp(city, 'i');

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ ecoPoints: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      message: 'Failed to search users',
      error: error.message
    });
  }
};

// @desc    Refresh JWT token
// @route   POST /api/users/refresh-token
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Find user
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      message: 'Token refreshed successfully',
      token: newToken,
      refreshToken: newRefreshToken,
      expiresIn: 30 * 24 * 60 * 60 * 1000
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
    res.status(500).json({ message: 'Token refresh failed' });
  }
};

// @desc    Logout user (invalidate token)
// @route   POST /api/users/logout
// @access  Private
const logoutUser = async (req, res) => {
  try {
    // In a production app, you might want to blacklist the token
    // For now, we'll just send a success response
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed' });
  }
};

// @desc    Verify token validity
// @route   GET /api/users/verify-token
// @access  Private
const verifyTokenEndpoint = async (req, res) => {
  try {
    // If middleware passes, token is valid
    res.json({
      valid: true,
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    res.status(401).json({ valid: false, message: 'Invalid token' });
  }
};

// @desc    Create admin user (admin only)
// @route   POST /api/users/create-admin
// @access  Private (Admin)
const createAdminUser = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email 
          ? 'User with this email already exists' 
          : 'Username already taken'
      });
    }

    // Create new admin user
    const adminUser = new User({
      username,
      email,
      password,
      fullName,
      role: 'admin'
    });

    await adminUser.save();

    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        fullName: adminUser.fullName,
        role: adminUser.role,
        ecoPoints: adminUser.ecoPoints,
        rank: adminUser.rank
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      message: 'Failed to create admin user',
      error: error.message
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  verifyTokenEndpoint,
  createAdminUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  getLeaderboard,
  getUserStats,
  searchUsers
};