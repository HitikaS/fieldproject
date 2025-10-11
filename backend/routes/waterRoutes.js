const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const waterController = require('../controllers/waterController');

// Private routes
router.post('/', authenticateToken, waterController.addWaterLog);
router.get('/', authenticateToken, waterController.getWaterLogs);
router.get('/stats', authenticateToken, waterController.getWaterStats);
router.get('/analytics/monthly', authenticateToken, waterController.getMonthlyAnalytics);
router.get('/insights', authenticateToken, waterController.getInsights);
router.get('/tips/:category', waterController.getWaterSavingTips);
router.get('/:id', authenticateToken, waterController.getWaterLogById);
router.put('/:id', authenticateToken, waterController.updateWaterLog);
router.delete('/:id', authenticateToken, waterController.deleteWaterLog);

module.exports = router;