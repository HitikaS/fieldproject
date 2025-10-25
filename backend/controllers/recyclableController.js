const Recyclable = require('../models/Recyclable');
const User = require('../models/User');
const socketManager = require('../utils/socketManager');

// @desc    Add new recyclable item
// @route   POST /api/recyclables
// @access  Private
const addRecyclable = async (req, res) => {
  try {
    const { 
      title, description, category, condition, images, location, 
      tags, estimatedValue, weight, contactMethod, contactInfo 
    } = req.body;

    const recyclable = new Recyclable({
      user: req.user.id,
      title,
      description,
      category,
      condition,
      images,
      location,
      tags,
      estimatedValue,
      weight,
      contactMethod,
      contactInfo
    });

    await recyclable.save();

    // Award eco points for listing recyclable
    const user = await User.findById(req.user.id);
    user.addEcoPoints(5, 'Listed recyclable item');
    await user.save();

    // Emit real-time events
    socketManager.emitNewRecyclable(user, {
      _id: recyclable._id,
      title: recyclable.title,
      category: recyclable.category,
      location: recyclable.location,
      condition: recyclable.condition
    });

    socketManager.emitLeaderboardUpdate(user, {
      points: 5,
      reason: 'Listed recyclable item'
    });

    res.status(201).json({
      success: true,
      message: 'Recyclable item added successfully',
      recyclable,
      ecoPointsEarned: 5
    });
  } catch (error) {
    console.error('Add recyclable error:', error);
    res.status(500).json({
      message: 'Failed to add recyclable item',
      error: error.message
    });
  }
};

// @desc    Get all recyclables with filtering
// @route   GET /api/recyclables
// @access  Public
const getRecyclables = async (req, res) => {
  try {
    const { 
      category, condition, city, search, 
      limit = 20, page = 1, sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    const query = { isActive: true, availability: 'available' };
    
    if (category) query.category = category;
    if (condition) query.condition = condition;
    if (city) query['location.city'] = new RegExp(city, 'i');
    
    let recyclables;
    
    if (search) {
      recyclables = await Recyclable.searchRecyclables(search)
        .limit(limit * 1)
        .skip((page - 1) * limit);
    } else {
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      recyclables = await Recyclable.find(query)
        .populate('user', 'username fullName location.city')
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit);
    }

    const total = await Recyclable.countDocuments(query);

    res.json({
      recyclables,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get recyclables error:', error);
    res.status(500).json({
      message: 'Failed to get recyclables',
      error: error.message
    });
  }
};

// @desc    Get recyclable by ID
// @route   GET /api/recyclables/:id
// @access  Public
const getRecyclableById = async (req, res) => {
  try {
    const recyclable = await Recyclable.findById(req.params.id)
      .populate('user', 'username fullName profilePicture location.city')
      .populate('interests.user', 'username fullName');

    if (!recyclable || !recyclable.isActive) {
      return res.status(404).json({ message: 'Recyclable item not found' });
    }

    // Increment view count
    recyclable.views += 1;
    await recyclable.save();

    res.json({ recyclable });
  } catch (error) {
    console.error('Get recyclable by ID error:', error);
    res.status(500).json({
      message: 'Failed to get recyclable item',
      error: error.message
    });
  }
};

// @desc    Update recyclable item
// @route   PUT /api/recyclables/:id
// @access  Private
const updateRecyclable = async (req, res) => {
  try {
    const recyclable = await Recyclable.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!recyclable) {
      return res.status(404).json({ message: 'Recyclable item not found' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      recyclable[key] = updates[key];
    });

    await recyclable.save();

    res.json({
      message: 'Recyclable item updated successfully',
      recyclable
    });
  } catch (error) {
    console.error('Update recyclable error:', error);
    res.status(500).json({
      message: 'Failed to update recyclable item',
      error: error.message
    });
  }
};

// @desc    Delete recyclable item
// @route   DELETE /api/recyclables/:id
// @access  Private
const deleteRecyclable = async (req, res) => {
  try {
    const recyclable = await Recyclable.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!recyclable) {
      return res.status(404).json({ message: 'Recyclable item not found' });
    }

    recyclable.isActive = false;
    await recyclable.save();

    res.json({ message: 'Recyclable item deleted successfully' });
  } catch (error) {
    console.error('Delete recyclable error:', error);
    res.status(500).json({
      message: 'Failed to delete recyclable item',
      error: error.message
    });
  }
};

// @desc    Reserve recyclable item
// @route   POST /api/recyclables/:id/reserve
// @access  Private
const reserveRecyclable = async (req, res) => {
  try {
    const recyclable = await Recyclable.findById(req.params.id);

    if (!recyclable || !recyclable.isActive) {
      return res.status(404).json({ message: 'Recyclable item not found' });
    }

    if (recyclable.user.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot reserve your own item' });
    }

    recyclable.reserve(req.user.id);
    await recyclable.save();

    // Populate user data for real-time event
    await recyclable.populate('user', 'username');
    const reserver = await User.findById(req.user.id);

    // Emit real-time event
    socketManager.emitRecyclableClaimed(
      recyclable.user._id,
      reserver,
      {
        _id: recyclable._id,
        title: recyclable.title,
        category: recyclable.category
      }
    );

    res.json({
      message: 'Item reserved successfully',
      recyclable
    });
  } catch (error) {
    console.error('Reserve recyclable error:', error);
    res.status(500).json({
      message: error.message || 'Failed to reserve item',
      error: error.message
    });
  }
};

// @desc    Complete recyclable exchange
// @route   POST /api/recyclables/:id/complete
// @access  Private
const completeExchange = async (req, res) => {
  try {
    const recyclable = await Recyclable.findById(req.params.id);

    if (!recyclable) {
      return res.status(404).json({ message: 'Recyclable item not found' });
    }

    // Only the owner or the person who reserved can complete
    if (recyclable.user.toString() !== req.user.id && 
        recyclable.reservedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to complete this exchange' });
    }

    recyclable.complete();
    await recyclable.save();

    // Award eco points to both users
    const owner = await User.findById(recyclable.user);
    const receiver = await User.findById(recyclable.reservedBy);
    
    owner.addEcoPoints(10, 'Recyclable item exchanged');
    receiver.addEcoPoints(5, 'Received recyclable item');
    
    await owner.save();
    await receiver.save();

    // Emit leaderboard updates for both users
    socketManager.emitLeaderboardUpdate(owner, {
      points: 10,
      reason: 'Recyclable item exchanged'
    });

    socketManager.emitLeaderboardUpdate(receiver, {
      points: 5,
      reason: 'Received recyclable item'
    });

    res.json({
      message: 'Exchange completed successfully',
      recyclable,
      ecoImpact: recyclable.ecoImpact
    });
  } catch (error) {
    console.error('Complete exchange error:', error);
    res.status(500).json({
      message: error.message || 'Failed to complete exchange',
      error: error.message
    });
  }
};

// @desc    Add interest to recyclable item
// @route   POST /api/recyclables/:id/interest
// @access  Private
const addInterest = async (req, res) => {
  try {
    const { message } = req.body;
    const recyclable = await Recyclable.findById(req.params.id);

    if (!recyclable || !recyclable.isActive) {
      return res.status(404).json({ message: 'Recyclable item not found' });
    }

    if (recyclable.user.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot express interest in your own item' });
    }

    recyclable.addInterest(req.user.id, message);
    await recyclable.save();

    res.json({
      message: 'Interest added successfully',
      recyclable
    });
  } catch (error) {
    console.error('Add interest error:', error);
    res.status(500).json({
      message: 'Failed to add interest',
      error: error.message
    });
  }
};

// @desc    Get user's recyclables
// @route   GET /api/recyclables/my-items
// @access  Private
const getUserRecyclables = async (req, res) => {
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

    const recyclables = await Recyclable.find(query)
      .populate('reservedBy', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Recyclable.countDocuments(query);

    res.json({
      recyclables,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user recyclables error:', error);
    res.status(500).json({
      message: 'Failed to get user recyclables',
      error: error.message
    });
  }
};

// @desc    Get trending categories
// @route   GET /api/recyclables/trending
// @access  Public
const getTrendingCategories = async (req, res) => {
  try {
    const trending = await Recyclable.getTrendingCategories();
    res.json({ trending });
  } catch (error) {
    console.error('Get trending categories error:', error);
    res.status(500).json({
      message: 'Failed to get trending categories',
      error: error.message
    });
  }
};

module.exports = {
  addRecyclable,
  getRecyclables,
  getRecyclableById,
  updateRecyclable,
  deleteRecyclable,
  reserveRecyclable,
  completeExchange,
  addInterest,
  getUserRecyclables,
  getTrendingCategories
};