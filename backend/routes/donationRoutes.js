const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const donationController = require('../controllers/donationController');

// Public routes
router.get('/', donationController.getDonations);
router.get('/urgent', donationController.getUrgentDonations);
router.get('/location/:city', donationController.getDonationsByLocation);
router.get('/:id', donationController.getDonationById);

// Private routes
router.post('/', authenticateToken, donationController.addDonation);
router.put('/:id', authenticateToken, donationController.updateDonation);
router.delete('/:id', authenticateToken, donationController.deleteDonation);
router.post('/:id/claim', authenticateToken, donationController.claimDonation);
router.post('/:id/complete', authenticateToken, donationController.completeDonation);
router.post('/:id/interest', authenticateToken, donationController.addInterest);
router.get('/my-donations', authenticateToken, donationController.getUserDonations);

module.exports = router;