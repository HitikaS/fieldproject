const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeAdmin } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// Public routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/refresh-token', userController.refreshToken);
router.get('/leaderboard', userController.getLeaderboard);

// Protected routes
router.post('/logout', authenticateToken, userController.logoutUser);
router.get('/verify-token', authenticateToken, userController.verifyTokenEndpoint);
router.get('/profile', authenticateToken, userController.getUserProfile);
router.put('/profile', authenticateToken, userController.updateUserProfile);
router.put('/change-password', authenticateToken, userController.changePassword);
router.get('/stats', authenticateToken, userController.getUserStats);

// Admin-only routes
router.post('/create-admin', authenticateToken, authorizeAdmin, userController.createAdminUser);
router.get('/search', authenticateToken, authorizeAdmin, userController.searchUsers);

module.exports = router;