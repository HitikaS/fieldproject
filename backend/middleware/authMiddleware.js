const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Access token required',
        error: 'NO_TOKEN'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check token structure
    if (!decoded.userId) {
      return res.status(401).json({ 
        message: 'Invalid token structure',
        error: 'INVALID_TOKEN_STRUCTURE'
      });
    }

    // Find user and exclude password
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid token - user not found',
        error: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Account deactivated',
        error: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    let errorResponse = {
      message: 'Token verification failed',
      error: 'TOKEN_ERROR'
    };

    if (error.name === 'JsonWebTokenError') {
      errorResponse.message = 'Invalid token';
      errorResponse.error = 'INVALID_TOKEN';
    } else if (error.name === 'TokenExpiredError') {
      errorResponse.message = 'Token expired';
      errorResponse.error = 'TOKEN_EXPIRED';
    } else if (error.name === 'NotBeforeError') {
      errorResponse.message = 'Token not active';
      errorResponse.error = 'TOKEN_NOT_ACTIVE';
    }

    res.status(401).json(errorResponse);
  }
};

// Check for admin role
const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

module.exports = {
  authenticateToken,
  authorizeAdmin,
  optionalAuth
};