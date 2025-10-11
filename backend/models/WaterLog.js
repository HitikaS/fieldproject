const mongoose = require('mongoose');

const waterLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['shower', 'dishes', 'laundry', 'garden', 'drinking', 'other'],
      message: 'Category must be one of: shower, dishes, laundry, garden, drinking, other'
    }
  },
  activity: {
    type: String,
    required: [true, 'Activity description is required'],
    trim: true,
    maxlength: [100, 'Activity description cannot exceed 100 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: {
      values: ['liters', 'gallons'],
      message: 'Unit must be either liters or gallons'
    }
  },
  duration: {
    type: Number, // in minutes
    min: 0,
    default: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [300, 'Notes cannot exceed 300 characters']
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  ecoPointsEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  efficiency: {
    type: String,
    enum: ['excellent', 'good', 'average', 'poor'],
    default: 'average'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for water usage in liters (standardized)
waterLogSchema.virtual('amountInLiters').get(function() {
  if (this.unit === 'gallons') {
    return Math.round(this.amount * 3.78541 * 100) / 100; // Convert gallons to liters
  }
  return this.amount;
});

// Virtual for usage level
waterLogSchema.virtual('usageLevel').get(function() {
  const liters = this.amountInLiters;
  
  // Different thresholds based on category
  const thresholds = {
    shower: { low: 40, medium: 80, high: 120 },
    dishes: { low: 10, medium: 25, high: 40 },
    laundry: { low: 50, medium: 100, high: 150 },
    garden: { low: 20, medium: 50, high: 100 },
    drinking: { low: 2, medium: 4, high: 6 },
    other: { low: 10, medium: 30, high: 60 }
  };
  
  const categoryThreshold = thresholds[this.category] || thresholds.other;
  
  if (liters <= categoryThreshold.low) return 'Low';
  if (liters <= categoryThreshold.medium) return 'Medium';
  if (liters <= categoryThreshold.high) return 'High';
  return 'Very High';
});

// Static method to calculate eco points based on water efficiency
waterLogSchema.statics.calculateEcoPoints = function(category, amountInLiters, duration) {
  // Baseline efficient usage (liters)
  const efficientUsage = {
    shower: { perMinute: 6, baseline: 30 }, // 6L/min, 30L for 5-min shower
    dishes: { perMinute: 3, baseline: 15 }, // 3L/min, 15L for hand washing
    laundry: { perMinute: 0, baseline: 60 }, // 60L per load
    garden: { perMinute: 5, baseline: 30 }, // 5L/min, 30L for 6 minutes
    drinking: { perMinute: 0, baseline: 3 }, // 3L per day
    other: { perMinute: 2, baseline: 15 }
  };
  
  const categoryData = efficientUsage[category] || efficientUsage.other;
  let baseline = categoryData.baseline;
  
  // Adjust baseline if duration is provided
  if (duration > 0 && categoryData.perMinute > 0) {
    baseline = Math.max(baseline, duration * categoryData.perMinute);
  }
  
  // Calculate efficiency ratio
  const efficiency = baseline / amountInLiters;
  
  let points = 0;
  if (efficiency >= 1.5) {
    points = 10; // Excellent efficiency - 50% less than baseline
  } else if (efficiency >= 1.2) {
    points = 7; // Good efficiency - 20% less than baseline
  } else if (efficiency >= 1.0) {
    points = 5; // At baseline
  } else if (efficiency >= 0.8) {
    points = 3; // Slightly above baseline
  } else if (efficiency >= 0.6) {
    points = 1; // Above baseline but not efficient
  }
  // No points for very inefficient usage
  
  return points;
};

// Static method to determine efficiency rating
waterLogSchema.statics.calculateEfficiency = function(category, amountInLiters, duration) {
  const efficientUsage = {
    shower: { excellent: 25, good: 35, average: 50 },
    dishes: { excellent: 10, good: 18, average: 30 },
    laundry: { excellent: 50, good: 70, average: 100 },
    garden: { excellent: 20, good: 35, average: 60 },
    drinking: { excellent: 2, good: 3, average: 4 },
    other: { excellent: 10, good: 20, average: 35 }
  };
  
  const thresholds = efficientUsage[category] || efficientUsage.other;
  
  if (amountInLiters <= thresholds.excellent) return 'excellent';
  if (amountInLiters <= thresholds.good) return 'good';
  if (amountInLiters <= thresholds.average) return 'average';
  return 'poor';
};

// Pre-save middleware to calculate eco points and efficiency
waterLogSchema.pre('save', function(next) {
  if (this.isNew || this.isModified(['category', 'amount', 'unit', 'duration'])) {
    const amountInLiters = this.unit === 'gallons' ? this.amount * 3.78541 : this.amount;
    
    this.ecoPointsEarned = this.constructor.calculateEcoPoints(
      this.category,
      amountInLiters,
      this.duration
    );
    
    this.efficiency = this.constructor.calculateEfficiency(
      this.category,
      amountInLiters,
      this.duration
    );
  }
  next();
});

// Static method to get user's monthly water usage
waterLogSchema.statics.getMonthlyUsage = function(userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$category',
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
        count: { $sum: 1 },
        avgEfficiency: { $avg: { 
          $cond: {
            if: { $eq: ['$efficiency', 'excellent'] }, then: 4,
            else: {
              $cond: {
                if: { $eq: ['$efficiency', 'good'] }, then: 3,
                else: {
                  $cond: {
                    if: { $eq: ['$efficiency', 'average'] }, then: 2,
                    else: 1
                  }
                }
              }
            }
          }
        }}
      }
    }
  ]);
};

// Static method to get water saving tips
waterLogSchema.statics.getWaterSavingTips = function(category) {
  const tips = {
    shower: [
      'Take shorter showers (aim for 5 minutes or less)',
      'Install a low-flow showerhead',
      'Turn off water while shampooing',
      'Consider taking baths occasionally - they can use less water'
    ],
    dishes: [
      'Only run dishwasher with full loads',
      'Scrape plates instead of pre-rinsing',
      'Use a basin for hand washing dishes',
      'Fix any leaky faucets immediately'
    ],
    laundry: [
      'Only wash full loads',
      'Use cold water when possible',
      'Choose high-efficiency washing machines',
      'Reuse towels and jeans multiple times'
    ],
    garden: [
      'Water early morning or evening to reduce evaporation',
      'Use drip irrigation or soaker hoses',
      'Collect rainwater for garden use',
      'Choose drought-resistant plants'
    ],
    drinking: [
      'Use a reusable water bottle',
      'Keep water in the fridge instead of running tap',
      'Fix any leaky pipes',
      'Install water-efficient fixtures'
    ]
  };
  
  return tips[category] || tips.drinking;
};

// Indexes for performance
waterLogSchema.index({ user: 1, date: -1 });
waterLogSchema.index({ category: 1 });
waterLogSchema.index({ date: -1 });
waterLogSchema.index({ efficiency: 1 });

module.exports = mongoose.model('WaterLog', waterLogSchema);