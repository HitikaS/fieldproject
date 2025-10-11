const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const footprintController = require('../controllers/footprintController');

// Private routes
router.post('/', authenticateToken, footprintController.addFootprintLog);
router.get('/', authenticateToken, footprintController.getFootprintLogs);
router.get('/stats', authenticateToken, footprintController.getFootprintStats);
router.get('/analytics/monthly', authenticateToken, footprintController.getMonthlyAnalytics);
router.get('/insights', authenticateToken, footprintController.getInsights);
router.get('/:id', authenticateToken, footprintController.getFootprintLogById);
router.put('/:id', authenticateToken, footprintController.updateFootprintLog);
router.delete('/:id', authenticateToken, footprintController.deleteFootprintLog);

module.exports = router;