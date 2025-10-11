const FootprintLog = require('../models/FootprintLog');
const User = require('../models/User');
const socketManager = require('../utils/socketManager');

// Helper functions for carbon emission calculation
const calculateCarbonEmission = (category, activity, amount, unit) => {
  // Emission factors (kg CO2 per unit)
  const emissionFactors = {
    transport: {
      'car': { km: 0.12, miles: 0.19 },
      'bus': { km: 0.05, miles: 0.08 },
      'train': { km: 0.04, miles: 0.06 },
      'motorcycle': { km: 0.08, miles: 0.13 },
      'bicycle': { km: 0, miles: 0 }
    },
    energy: {
      'electricity': { kwh: 0.4 },
      'gas': { kwh: 0.2, therms: 5.3 },
      'heating': { kwh: 0.3 },
      'cooling': { kwh: 0.5 }
    },
    food: {
      'meat': { kg: 6.9 },
      'dairy': { kg: 1.9 },
      'vegetables': { kg: 0.4 },
      'processed': { kg: 2.1 }
    },
    travel: {
      'flight': { km: 0.25, miles: 0.4 },
      'hotel': { hours: 0.5 }
    },
    shopping: {
      'clothing': { kg: 5.7 },
      'electronics': { kg: 15.2 },
      'general': { kg: 2.1 }
    }
  };

  const categoryFactors = emissionFactors[category];
  if (!categoryFactors) return 0;

  // Try to find exact activity match first
  let factor = 0;
  const activityLower = activity.toLowerCase();
  
  Object.keys(categoryFactors).forEach(key => {
    if (activityLower.includes(key)) {
      const unitFactor = categoryFactors[key][unit];
      if (unitFactor !== undefined) {
        factor = unitFactor;
      }
    }
  });

  // Default factors if no specific match
  if (factor === 0) {
    switch (category) {
      case 'transport':
        factor = unit === 'km' ? 0.15 : unit === 'miles' ? 0.24 : 0;
        break;
      case 'energy':
        factor = unit === 'kwh' ? 0.4 : unit === 'therms' ? 5.3 : 0;
        break;
      case 'food':
        factor = unit === 'kg' ? 2.0 : 0;
        break;
      case 'travel':
        factor = unit === 'km' ? 0.2 : unit === 'miles' ? 0.32 : unit === 'hours' ? 0.3 : 0;
        break;
      case 'shopping':
        factor = unit === 'kg' ? 3.0 : 0;
        break;
    }
  }

  return parseFloat((amount * factor).toFixed(2));
};

const calculateEcoPoints = (carbonEmission, category) => {
  // Base points calculation (lower emissions = more points)
  let points = Math.max(0, 10 - Math.floor(carbonEmission / 2));
  
  // Category multipliers
  const categoryMultipliers = {
    transport: 1.2,
    energy: 1.0,
    food: 1.1,
    travel: 0.8,
    shopping: 0.9
  };
  
  points *= (categoryMultipliers[category] || 1.0);
  
  return Math.round(points);
};

// @desc    Add new footprint log
// @route   POST /api/footprint
// @access  Private
const addFootprintLog = async (req, res) => {
  try {
    const { category, activity, amount, unit, notes, date } = req.body;

    console.log('Received footprint data:', { category, activity, amount, unit, notes, date });

    // Calculate carbon emission manually
    const carbonEmission = calculateCarbonEmission(category, activity, parseFloat(amount), unit);
    const ecoPoints = calculateEcoPoints(carbonEmission, category);

    console.log('Calculated values:', { carbonEmission, ecoPoints });

    const footprintLog = new FootprintLog({
      user: req.user.id,
      category,
      activity,
      amount: parseFloat(amount),
      unit,
      carbonEmission,
      ecoPointsEarned: ecoPoints,
      notes,
      date: date ? new Date(date) : new Date()
    });

    console.log('FootprintLog object before save:', footprintLog);

    await footprintLog.save();

    // Update user's carbon footprint and add eco points
    const user = await User.findById(req.user.id);
    user.carbonFootprint.total += footprintLog.carbonEmission;
    user.addEcoPoints(footprintLog.ecoPointsEarned, 'Carbon footprint logged');
    await user.save();

    // Emit real-time carbon footprint update
    socketManager.emitCarbonUpdate(user, footprintLog);
    
    // Emit leaderboard update for eco points
    socketManager.emitLeaderboardUpdate(user, {
      points: footprintLog.ecoPointsEarned,
      reason: 'Carbon footprint logged'
    });

    res.status(201).json({
      success: true,
      message: 'Footprint log added successfully',
      log: footprintLog,
      ecoPointsEarned: footprintLog.ecoPointsEarned
    });
  } catch (error) {
    console.error('Add footprint log error:', error);
    res.status(500).json({
      message: 'Failed to add footprint log',
      error: error.message
    });
  }
};

// @desc    Get user's footprint logs
// @route   GET /api/footprint
// @access  Private
const getFootprintLogs = async (req, res) => {
  try {
    const { 
      category, 
      startDate, 
      endDate, 
      limit = 20, 
      page = 1,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const query = { user: req.user.id };
    
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const logs = await FootprintLog.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await FootprintLog.countDocuments(query);

    // Calculate summary statistics
    const summary = await FootprintLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalEmissions: { $sum: '$carbonEmission' },
          totalPoints: { $sum: '$ecoPointsEarned' },
          avgEmission: { $avg: '$carbonEmission' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      logs,
      summary: summary[0] || { totalEmissions: 0, totalPoints: 0, avgEmission: 0, count: 0 },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get footprint logs error:', error);
    res.status(500).json({
      message: 'Failed to get footprint logs',
      error: error.message
    });
  }
};

// @desc    Get footprint log by ID
// @route   GET /api/footprint/:id
// @access  Private
const getFootprintLogById = async (req, res) => {
  try {
    const log = await FootprintLog.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!log) {
      return res.status(404).json({ message: 'Footprint log not found' });
    }

    res.json({ log });
  } catch (error) {
    console.error('Get footprint log by ID error:', error);
    res.status(500).json({
      message: 'Failed to get footprint log',
      error: error.message
    });
  }
};

// @desc    Update footprint log
// @route   PUT /api/footprint/:id
// @access  Private
const updateFootprintLog = async (req, res) => {
  try {
    const { category, activity, amount, unit, notes, date } = req.body;

    const log = await FootprintLog.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!log) {
      return res.status(404).json({ message: 'Footprint log not found' });
    }

    const oldEmission = log.carbonEmission;
    const oldPoints = log.ecoPointsEarned;

    // Update fields
    if (category) log.category = category;
    if (activity) log.activity = activity;
    if (amount) log.amount = amount;
    if (unit) log.unit = unit;
    if (notes) log.notes = notes;
    if (date) log.date = new Date(date);

    await log.save();

    // Update user's carbon footprint
    const user = await User.findById(req.user.id);
    user.carbonFootprint.total = user.carbonFootprint.total - oldEmission + log.carbonEmission;
    user.ecoPoints = user.ecoPoints - oldPoints + log.ecoPointsEarned;
    await user.save();

    res.json({
      message: 'Footprint log updated successfully',
      log
    });
  } catch (error) {
    console.error('Update footprint log error:', error);
    res.status(500).json({
      message: 'Failed to update footprint log',
      error: error.message
    });
  }
};

// @desc    Delete footprint log
// @route   DELETE /api/footprint/:id
// @access  Private
const deleteFootprintLog = async (req, res) => {
  try {
    const log = await FootprintLog.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!log) {
      return res.status(404).json({ message: 'Footprint log not found' });
    }

    // Update user's carbon footprint before deletion
    const user = await User.findById(req.user.id);
    user.carbonFootprint.total -= log.carbonEmission;
    user.ecoPoints -= log.ecoPointsEarned;
    await user.save();

    await FootprintLog.findByIdAndDelete(req.params.id);

    res.json({ message: 'Footprint log deleted successfully' });
  } catch (error) {
    console.error('Delete footprint log error:', error);
    res.status(500).json({
      message: 'Failed to delete footprint log',
      error: error.message
    });
  }
};

// @desc    Get monthly footprint analytics
// @route   GET /api/footprint/analytics/monthly
// @access  Private
const getMonthlyAnalytics = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;

    const analytics = await FootprintLog.getMonthlyFootprint(req.user.id, parseInt(year), parseInt(month));

    // Get comparison with previous month
    const prevMonth = month > 1 ? month - 1 : 12;
    const prevYear = month > 1 ? year : year - 1;
    const prevAnalytics = await FootprintLog.getMonthlyFootprint(req.user.id, parseInt(prevYear), parseInt(prevMonth));

    const comparison = analytics.map(current => {
      const previous = prevAnalytics.find(p => p._id === current._id);
      return {
        category: current._id,
        current: current.totalEmission,
        previous: previous ? previous.totalEmission : 0,
        change: previous ? ((current.totalEmission - previous.totalEmission) / previous.totalEmission) * 100 : 0,
        pointsEarned: current.totalPoints
      };
    });

    res.json({
      analytics: comparison,
      period: { year: parseInt(year), month: parseInt(month) }
    });
  } catch (error) {
    console.error('Get monthly analytics error:', error);
    res.status(500).json({
      message: 'Failed to get monthly analytics',
      error: error.message
    });
  }
};

// @desc    Get carbon footprint statistics
// @route   GET /api/footprint/stats
// @access  Private
const getFootprintStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's logs
    const logs = await FootprintLog.find({ user: userId });

    // Calculate aggregate stats
    const aggregateStats = await FootprintLog.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalEmissions: { $sum: '$carbonEmission' },
          totalPoints: { $sum: '$ecoPointsEarned' },
          avgEmission: { $avg: '$carbonEmission' },
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = aggregateStats[0] || {
      totalEmissions: 0,
      totalPoints: 0,
      avgEmission: 0,
      count: 0
    };

    // Calculate category breakdown
    const categoryTotals = logs.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + log.carbonEmission;
      return acc;
    }, {});

    // Calculate recent trend (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    
    const recentLogs = logs.filter(log => log.date >= thirtyDaysAgo);
    const previousLogs = logs.filter(log => log.date >= sixtyDaysAgo && log.date < thirtyDaysAgo);
    
    const recentTotal = recentLogs.reduce((sum, log) => sum + log.carbonEmission, 0);
    const previousTotal = previousLogs.reduce((sum, log) => sum + log.carbonEmission, 0);
    
    const trendPercentage = previousTotal > 0 ? ((recentTotal - previousTotal) / previousTotal) * 100 : 0;

    res.json({
      success: true,
      stats: {
        totalEmissions: Math.round(stats.totalEmissions * 100) / 100,
        averageEmission: Math.round(stats.avgEmission * 100) / 100,
        totalEntries: stats.count,
        ecoPointsEarned: stats.totalPoints,
        categoryBreakdown: categoryTotals,
        recentTrend: {
          current30Days: Math.round(recentTotal * 100) / 100,
          previous30Days: Math.round(previousTotal * 100) / 100,
          changePercentage: Math.round(trendPercentage * 100) / 100
        },
        lastUpdate: logs.length > 0 ? logs[logs.length - 1].date : null
      }
    });
  } catch (error) {
    console.error('Get footprint stats error:', error);
    res.status(500).json({
      message: 'Failed to get footprint statistics',
      error: error.message
    });
  }
};

// @desc    Get carbon footprint insights and recommendations
// @route   GET /api/footprint/insights
// @access  Private
const getInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's logs from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const logs = await FootprintLog.find({
      user: userId,
      date: { $gte: thirtyDaysAgo }
    });

    // Calculate insights
    const categoryTotals = logs.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + log.carbonEmission;
      return acc;
    }, {});

    const totalEmissions = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
    
    const insights = {
      totalEmissions,
      averageDaily: totalEmissions / 30,
      highestCategory: Object.keys(categoryTotals).reduce((a, b) => 
        categoryTotals[a] > categoryTotals[b] ? a : b, 'transport'
      ),
      categoryBreakdown: Object.entries(categoryTotals).map(([category, emission]) => ({
        category,
        emission,
        percentage: (emission / totalEmissions) * 100
      })),
      recommendations: [
        {
          category: 'transport',
          suggestion: 'Consider walking, biking, or using public transport for short trips',
          potentialSaving: '2-5 kg CO2 per week'
        },
        {
          category: 'energy',
          suggestion: 'Switch to LED bulbs and unplug devices when not in use',
          potentialSaving: '10-20% energy reduction'
        }
      ]
    };

    res.json({ insights });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({
      message: 'Failed to get insights',
      error: error.message
    });
  }
};

module.exports = {
  addFootprintLog,
  getFootprintLogs,
  getFootprintLogById,
  updateFootprintLog,
  deleteFootprintLog,
  getFootprintStats,
  getMonthlyAnalytics,
  getInsights
};