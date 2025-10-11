const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const recyclableController = require('../controllers/recyclableController');

// Public routes
router.get('/', recyclableController.getRecyclables);
router.get('/trending', recyclableController.getTrendingCategories);
router.get('/:id', recyclableController.getRecyclableById);

// Private routes
router.post('/', authenticateToken, recyclableController.addRecyclable);
router.put('/:id', authenticateToken, recyclableController.updateRecyclable);
router.delete('/:id', authenticateToken, recyclableController.deleteRecyclable);
router.post('/:id/reserve', authenticateToken, recyclableController.reserveRecyclable);
router.post('/:id/complete', authenticateToken, recyclableController.completeExchange);
router.post('/:id/interest', authenticateToken, recyclableController.addInterest);
router.get('/my-items', authenticateToken, recyclableController.getUserRecyclables);

module.exports = router;