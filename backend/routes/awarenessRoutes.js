const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeAdmin } = require('../middleware/authMiddleware');
const awarenessController = require('../controllers/awarenessController');

// Public routes
router.get('/', awarenessController.getAwarenessPosts);
router.get('/featured', awarenessController.getFeaturedPosts);
router.get('/trending', awarenessController.getTrendingPosts);
router.get('/:id', awarenessController.getAwarenessPostById);

// Private (admin) routes
router.post('/', authenticateToken, authorizeAdmin, awarenessController.addAwarenessPost);
router.put('/:id', authenticateToken, authorizeAdmin, awarenessController.updateAwarenessPost);
router.delete('/:id', authenticateToken, authorizeAdmin, awarenessController.deleteAwarenessPost);

// Engagement routes
router.post('/:id/like', authenticateToken, awarenessController.toggleLike);
router.post('/:id/comment', authenticateToken, awarenessController.addComment);
router.post('/:id/comment/:commentId/reply', authenticateToken, awarenessController.addReply);

module.exports = router;