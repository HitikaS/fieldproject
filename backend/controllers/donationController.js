const Donation = require('../models/Donation');
const User = require('../models/User');
const socketManager = require('../utils/socketManager');

// @desc    Add new donation
// @route   POST /api/donations
// @access  Private
const addDonation = async (req, res) => {
  try {
    const { 
      title, description, category, quantity, unit, images, location, 
      urgency, expiryDate, tags, contactMethod, contactInfo, 
      targetRecipients, conditions 
    } = req.body;

    const donation = new Donation({
      user: req.user.id,
      title,
      description,
      category,
      quantity,
      unit,
      images,
      location,
      urgency,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      tags,
      contactMethod,
      contactInfo,
      targetRecipients,
      conditions
    });

    await donation.save();

    // Award eco points for donation listing
    const user = await User.findById(req.user.id);
    const points = urgency === 'urgent' ? 15 : urgency === 'high' ? 10 : 5;
    user.addEcoPoints(points, 'Listed donation');
    await user.save();

    // Emit real-time donation update
    socketManager.emitNewDonation(user, donation);
    
    // Emit leaderboard update for eco points
    socketManager.emitLeaderboardUpdate(user, {
      points: points,
      reason: 'Listed donation'
    });

    res.status(201).json({
      success: true,
      message: 'Donation added successfully',
      donation,
      ecoPointsEarned: points,
      socialImpact: donation.socialImpact
    });
  } catch (error) {
    console.error('Add donation error:', error);
    res.status(500).json({
      message: 'Failed to add donation',
      error: error.message
    });
  }
};

// @desc    Get all donations with filtering
// @route   GET /api/donations
// @access  Public
const getDonations = async (req, res) => {
  try {
    const { 
      category, urgency, city, search, 
      limit = 20, page = 1, sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    const query = { isActive: true, availability: 'available' };
    
    if (category) query.category = category;
    if (urgency) query.urgency = urgency;
    if (city) query['location.city'] = new RegExp(city, 'i');
    
    let donations;
    
    if (search) {
      donations = await Donation.searchDonations(search)
        .limit(limit * 1)
        .skip((page - 1) * limit);
    } else {
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      // Priority sorting: urgent first, then by sort criteria
      const prioritySort = { urgency: -1 };
      if (sortBy !== 'urgency') {
        prioritySort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      }
      
      donations = await Donation.find(query)
        .populate('user', 'username fullName location.city')
        .sort(prioritySort)
        .limit(limit * 1)
        .skip((page - 1) * limit);
    }

    const total = await Donation.countDocuments(query);

    res.json({
      donations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({
      message: 'Failed to get donations',
      error: error.message
    });
  }
};

// @desc    Get donation by ID
// @route   GET /api/donations/:id
// @access  Public
const getDonationById = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('user', 'username fullName profilePicture location.city')
      .populate('interests.user', 'username fullName')
      .populate('claimedBy', 'username fullName');

    if (!donation || !donation.isActive) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Increment view count
    donation.views += 1;
    await donation.save();

    res.json({ donation });
  } catch (error) {
    console.error('Get donation by ID error:', error);
    res.status(500).json({
      message: 'Failed to get donation',
      error: error.message
    });
  }
};

// @desc    Update donation
// @route   PUT /api/donations/:id
// @access  Private
const updateDonation = async (req, res) => {
  try {
    const donation = await Donation.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.availability === 'claimed') {
      return res.status(400).json({ message: 'Cannot update claimed donation' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (key === 'expiryDate' && updates[key]) {
        donation[key] = new Date(updates[key]);
      } else {
        donation[key] = updates[key];
      }
    });

    await donation.save();

    res.json({
      message: 'Donation updated successfully',
      donation
    });
  } catch (error) {
    console.error('Update donation error:', error);
    res.status(500).json({
      message: 'Failed to update donation',
      error: error.message
    });
  }
};

// @desc    Delete donation
// @route   DELETE /api/donations/:id
// @access  Private
const deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    donation.isActive = false;
    await donation.save();

    res.json({ message: 'Donation deleted successfully' });
  } catch (error) {
    console.error('Delete donation error:', error);
    res.status(500).json({
      message: 'Failed to delete donation',
      error: error.message
    });
  }
};

// @desc    Claim donation
// @route   POST /api/donations/:id/claim
// @access  Private
const claimDonation = async (req, res) => {
  try {
    const { organization, message, contactInfo } = req.body;
    const donation = await Donation.findById(req.params.id);

    if (!donation || !donation.isActive) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.user.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot claim your own donation' });
    }

    const organizationInfo = { organization, message, contactInfo };
    donation.claim(req.user.id, organizationInfo);
    await donation.save();

    res.json({
      message: 'Donation claimed successfully',
      donation
    });
  } catch (error) {
    console.error('Claim donation error:', error);
    res.status(500).json({
      message: error.message || 'Failed to claim donation',
      error: error.message
    });
  }
};

// @desc    Complete donation
// @route   POST /api/donations/:id/complete
// @access  Private
const completeDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Only the owner or the person who claimed can complete
    if (donation.user.toString() !== req.user.id && 
        donation.claimedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to complete this donation' });
    }

    donation.complete();
    await donation.save();

    // Award eco points to both users
    const donor = await User.findById(donation.user);
    const recipient = await User.findById(donation.claimedBy);
    
    const donorPoints = donation.urgency === 'urgent' ? 20 : 
                      donation.urgency === 'high' ? 15 : 10;
    
    donor.addEcoPoints(donorPoints, 'Donation completed');
    recipient.addEcoPoints(5, 'Received donation');
    
    await donor.save();
    await recipient.save();

    res.json({
      message: 'Donation completed successfully',
      donation,
      socialImpact: donation.socialImpact,
      ecoPointsAwarded: { donor: donorPoints, recipient: 5 }
    });
  } catch (error) {
    console.error('Complete donation error:', error);
    res.status(500).json({
      message: error.message || 'Failed to complete donation',
      error: error.message
    });
  }
};

// @desc    Add interest to donation
// @route   POST /api/donations/:id/interest
// @access  Private
const addInterest = async (req, res) => {
  try {
    const { message, organization, contactInfo } = req.body;
    const donation = await Donation.findById(req.params.id);

    if (!donation || !donation.isActive) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.user.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot express interest in your own donation' });
    }

    const organizationInfo = { organization, contactInfo };
    donation.addInterest(req.user.id, message, organizationInfo);
    await donation.save();

    res.json({
      message: 'Interest added successfully',
      donation
    });
  } catch (error) {
    console.error('Add interest error:', error);
    res.status(500).json({
      message: 'Failed to add interest',
      error: error.message
    });
  }
};

// @desc    Get user's donations
// @route   GET /api/donations/my-donations
// @access  Private
const getUserDonations = async (req, res) => {
  try {
    const { status = 'all', limit = 20, page = 1 } = req.query;
    
    const query = { user: req.user.id };
    if (status !== 'all') {
      if (status === 'active') {
        query.isActive = true;
        query.availability = 'available';
      } else {
        query.availability = status;
      }
    }

    const donations = await Donation.find(query)
      .populate('claimedBy', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Donation.countDocuments(query);

    res.json({
      donations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user donations error:', error);
    res.status(500).json({
      message: 'Failed to get user donations',
      error: error.message
    });
  }
};

// @desc    Get urgent donations
// @route   GET /api/donations/urgent
// @access  Public
const getUrgentDonations = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const urgentDonations = await Donation.getUrgentDonations(parseInt(limit));
    
    res.json({ urgentDonations });
  } catch (error) {
    console.error('Get urgent donations error:', error);
    res.status(500).json({
      message: 'Failed to get urgent donations',
      error: error.message
    });
  }
};

// @desc    Get donations by location
// @route   GET /api/donations/location/:city
// @access  Public
const getDonationsByLocation = async (req, res) => {
  try {
    const { city } = req.params;
    const { limit = 20 } = req.query;
    
    const donations = await Donation.getDonationsByLocation(city)
      .limit(parseInt(limit));
    
    res.json({ donations, city });
  } catch (error) {
    console.error('Get donations by location error:', error);
    res.status(500).json({
      message: 'Failed to get donations by location',
      error: error.message
    });
  }
};

module.exports = {
  addDonation,
  getDonations,
  getDonationById,
  updateDonation,
  deleteDonation,
  claimDonation,
  completeDonation,
  addInterest,
  getUserDonations,
  getUrgentDonations,
  getDonationsByLocation
};