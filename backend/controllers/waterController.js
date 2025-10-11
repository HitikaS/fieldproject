const WaterLog = require('../models/WaterLog');
const User = require('../models/User');
const socketManager = require('../utils/socketManager');

// @desc    Add new water usage log
// @route   POST /api/water
// @access  Private
const addWaterLog = async (req, res) => {
  try {
    const { category, activity, amount, unit, duration, notes, date } = req.body;

    const waterLog = new WaterLog({
      user: req.user.id,
      category,
      activity,
      amount,
      unit,
      duration,
      notes,
      date: date ? new Date(date) : new Date()
    });

    await waterLog.save();

    // Update user's water usage and add eco points
    const user = await User.findById(req.user.id);
    const amountInLiters = unit === 'gallons' ? amount * 3.78541 : amount;
    user.waterUsage.total += amountInLiters;
    user.addEcoPoints(waterLog.ecoPointsEarned, 'Water usage logged');
    await user.save();

    // Emit real-time events
    socketManager.emitWaterLogAdded({
      user: user.username,
      activity: waterLog.activity,
      amount: amountInLiters,
      category: waterLog.category,
      efficiency: waterLog.efficiency
    });

    socketManager.emitEcoPointsEarned({
      userId: user._id,
      username: user.username,
      points: waterLog.ecoPointsEarned,
      reason: 'Water usage logged',
      newTotal: user.ecoPoints
    });

    res.status(201).json({
      success: true,
      message: 'Water log added successfully',
      log: waterLog,
      ecoPointsEarned: waterLog.ecoPointsEarned,
      efficiency: waterLog.efficiency
    });
  } catch (error) {
    console.error('Add water log error:', error);
    res.status(500).json({
      message: 'Failed to add water log',
      error: error.message
    });
  }
};

// @desc    Get user's water logs
// @route   GET /api/water
// @access  Private
const getWaterLogs = async (req, res) => {
  try {
    const { 
      category, 
      efficiency,
      startDate, 
      endDate, 
      limit = 20, 
      page = 1,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const query = { user: req.user.id };
    
    if (category) query.category = category;
    if (efficiency) query.efficiency = efficiency;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const logs = await WaterLog.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await WaterLog.countDocuments(query);

    // Calculate summary statistics
    const summary = await WaterLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalUsage: { 
            $sum: {
              $cond: {
                if: { $eq: ['$unit', 'gallons'] },
                then: { $multiply: ['$amount', 3.78541] },
                else: '$amount'
              }
            }
          },
          totalPoints: { $sum: '$ecoPointsEarned' },
          avgUsage: { 
            $avg: {
              $cond: {
                if: { $eq: ['$unit', 'gallons'] },
                then: { $multiply: ['$amount', 3.78541] },
                else: '$amount'
              }
            }
          },
          count: { $sum: 1 },
          efficiencyBreakdown: {
            $push: '$efficiency'
          }
        }
      }
    ]);

    res.json({
      logs,
      summary: summary[0] || { totalUsage: 0, totalPoints: 0, avgUsage: 0, count: 0 },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get water logs error:', error);
    res.status(500).json({
      message: 'Failed to get water logs',
      error: error.message
    });
  }
};

// @desc    Get water log by ID
// @route   GET /api/water/:id
// @access  Private
const getWaterLogById = async (req, res) => {
  try {
    const log = await WaterLog.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!log) {
      return res.status(404).json({ message: 'Water log not found' });
    }

    res.json({ log });
  } catch (error) {
    console.error('Get water log by ID error:', error);
    res.status(500).json({
      message: 'Failed to get water log',
      error: error.message
    });
  }
};

// @desc    Update water log
// @route   PUT /api/water/:id
// @access  Private
const updateWaterLog = async (req, res) => {
  try {
    const { category, activity, amount, unit, duration, notes, date } = req.body;

    const log = await WaterLog.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!log) {
      return res.status(404).json({ message: 'Water log not found' });
    }

    const oldAmountInLiters = log.unit === 'gallons' ? log.amount * 3.78541 : log.amount;
    const oldPoints = log.ecoPointsEarned;

    // Update fields
    if (category) log.category = category;
    if (activity) log.activity = activity;
    if (amount) log.amount = amount;
    if (unit) log.unit = unit;
    if (duration !== undefined) log.duration = duration;
    if (notes) log.notes = notes;
    if (date) log.date = new Date(date);

    await log.save();

    // Update user's water usage
    const user = await User.findById(req.user.id);
    const newAmountInLiters = log.unit === 'gallons' ? log.amount * 3.78541 : log.amount;
    user.waterUsage.total = user.waterUsage.total - oldAmountInLiters + newAmountInLiters;
    user.ecoPoints = user.ecoPoints - oldPoints + log.ecoPointsEarned;
    await user.save();

    res.json({
      message: 'Water log updated successfully',
      log
    });
  } catch (error) {
    console.error('Update water log error:', error);
    res.status(500).json({
      message: 'Failed to update water log',
      error: error.message
    });
  }
};

// @desc    Delete water log
// @route   DELETE /api/water/:id
// @access  Private
const deleteWaterLog = async (req, res) => {
  try {
    const log = await WaterLog.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!log) {
      return res.status(404).json({ message: 'Water log not found' });
    }

    // Update user's water usage before deletion
    const user = await User.findById(req.user.id);
    const amountInLiters = log.unit === 'gallons' ? log.amount * 3.78541 : log.amount;
    user.waterUsage.total -= amountInLiters;
    user.ecoPoints -= log.ecoPointsEarned;
    await user.save();

    await WaterLog.findByIdAndDelete(req.params.id);

    res.json({ message: 'Water log deleted successfully' });
  } catch (error) {
    console.error('Delete water log error:', error);
    res.status(500).json({
      message: 'Failed to delete water log',
      error: error.message
    });
  }
};

// @desc    Get monthly water usage analytics
// @route   GET /api/water/analytics/monthly
// @access  Private
const getMonthlyAnalytics = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;

    const analytics = await WaterLog.getMonthlyUsage(req.user.id, parseInt(year), parseInt(month));

    // Get comparison with previous month
    const prevMonth = month > 1 ? month - 1 : 12;
    const prevYear = month > 1 ? year : year - 1;
    const prevAnalytics = await WaterLog.getMonthlyUsage(req.user.id, parseInt(prevYear), parseInt(prevMonth));

    const comparison = analytics.map(current => {
      const previous = prevAnalytics.find(p => p._id === current._id);
      return {
        category: current._id,
        current: current.totalUsage,
        previous: previous ? previous.totalUsage : 0,
        change: previous ? ((current.totalUsage - previous.totalUsage) / previous.totalUsage) * 100 : 0,
        pointsEarned: current.totalPoints,
        avgEfficiency: current.avgEfficiency
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

// @desc    Get water usage statistics
// @route   GET /api/water/stats
// @access  Private
const getWaterStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's logs
    const logs = await WaterLog.find({ user: userId });

    // Calculate aggregate stats
    const aggregateStats = await WaterLog.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalUsage: {
            $sum: {
              $cond: {
                if: { $eq: ['$unit', 'gallons'] },
                then: { $multiply: ['$amount', 3.78541] },
                else: '$amount'
              }
            }
          },
          totalPoints: { $sum: '$ecoPointsEarned' },
          avgUsage: {
            $avg: {
              $cond: {
                if: { $eq: ['$unit', 'gallons'] },
                then: { $multiply: ['$amount', 3.78541] },
                else: '$amount'
              }
            }
          },
          count: { $sum: 1 },
          efficiencyBreakdown: { $push: '$efficiency' }
        }
      }
    ]);

    const stats = aggregateStats[0] || {
      totalUsage: 0,
      totalPoints: 0,
      avgUsage: 0,
      count: 0,
      efficiencyBreakdown: []
    };

    // Calculate category breakdown
    const categoryTotals = logs.reduce((acc, log) => {
      const amountInLiters = log.unit === 'gallons' ? log.amount * 3.78541 : log.amount;
      acc[log.category] = (acc[log.category] || 0) + amountInLiters;
      return acc;
    }, {});

    // Calculate efficiency distribution
    const efficiencyStats = stats.efficiencyBreakdown.reduce((acc, efficiency) => {
      acc[efficiency] = (acc[efficiency] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      stats: {
        totalUsage: Math.round(stats.totalUsage),
        averageUsage: Math.round(stats.avgUsage),
        totalEntries: stats.count,
        ecoPointsEarned: stats.totalPoints,
        categoryBreakdown: categoryTotals,
        efficiencyDistribution: efficiencyStats,
        lastUpdate: logs.length > 0 ? logs[logs.length - 1].date : null
      }
    });
  } catch (error) {
    console.error('Get water stats error:', error);
    res.status(500).json({
      message: 'Failed to get water statistics',
      error: error.message
    });
  }
};

// @desc    Get water usage insights and tips
// @route   GET /api/water/insights
// @access  Private
const getInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's logs from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const logs = await WaterLog.find({
      user: userId,
      date: { $gte: thirtyDaysAgo }
    });

    // Calculate insights
    const categoryTotals = logs.reduce((acc, log) => {
      const amountInLiters = log.unit === 'gallons' ? log.amount * 3.78541 : log.amount;
      acc[log.category] = (acc[log.category] || 0) + amountInLiters;
      return acc;
    }, {});

    const totalUsage = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
    const efficiencyStats = logs.reduce((acc, log) => {
      acc[log.efficiency] = (acc[log.efficiency] || 0) + 1;
      return acc;
    }, {});

    const highestCategory = Object.keys(categoryTotals).reduce((a, b) => 
      categoryTotals[a] > categoryTotals[b] ? a : b, 'shower'
    );

    const insights = {
      totalUsage,
      averageDaily: totalUsage / 30,
      highestCategory,
      categoryBreakdown: Object.entries(categoryTotals).map(([category, usage]) => ({
        category,
        usage,
        percentage: (usage / totalUsage) * 100
      })),
      efficiencyStats,
      tips: WaterLog.getWaterSavingTips(highestCategory),
      recommendations: [
        {
          category: highestCategory,
          suggestion: `Focus on ${highestCategory} efficiency - your highest usage category`,
          potentialSaving: `${Math.round(categoryTotals[highestCategory] * 0.2)} liters per month`
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

// @desc    Get water saving tips by category
// @route   GET /api/water/tips/:category
// @access  Public
const getWaterSavingTips = async (req, res) => {
  try {
    const { category } = req.params;
    const tips = WaterLog.getWaterSavingTips(category);
    
    res.json({
      category,
      tips
    });
  } catch (error) {
    console.error('Get water saving tips error:', error);
    res.status(500).json({
      message: 'Failed to get water saving tips',
      error: error.message
    });
  }
};

module.exports = {
  addWaterLog,
  getWaterLogs,
  getWaterLogById,
  updateWaterLog,
  deleteWaterLog,
  getWaterStats,
  getMonthlyAnalytics,
  getInsights,
  getWaterSavingTips
};