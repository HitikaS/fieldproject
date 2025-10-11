const mongoose = require('mongoose');

const footprintLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['transport', 'energy', 'food', 'travel', 'shopping'],
      message: 'Category must be one of: transport, energy, food, travel, shopping'
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
      values: ['km', 'kwh', 'kg', 'liters', 'hours'],
      message: 'Unit must be one of: km, kwh, kg, liters, hours'
    }
  },
  carbonEmission: {
    type: Number,
    required: true,
    min: 0
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for carbon emission category
footprintLogSchema.virtual('emissionLevel').get(function() {
  if (this.carbonEmission <= 1) return 'Low';
  if (this.carbonEmission <= 5) return 'Medium';
  if (this.carbonEmission <= 10) return 'High';
  return 'Very High';
});

// Static method to calculate carbon emission based on activity
footprintLogSchema.statics.calculateCarbonEmission = function(category, activity, amount, unit) {
  // Carbon emission factors (kg CO2 per unit)
  const emissionFactors = {
    transport: {
      'car': { km: 0.21 },
      'bus': { km: 0.08 },
      'train': { km: 0.06 },
      'flight': { km: 0.25 },
      'bike': { km: 0 },
      'walk': { km: 0 }
    },
    energy: {
      'electricity': { kwh: 0.5 },
      'gas': { kwh: 0.2 },
      'heating': { kwh: 0.3 }
    },
    food: {
      'meat': { kg: 6.5 },
      'dairy': { kg: 3.2 },
      'vegetables': { kg: 0.4 },
      'processed': { kg: 2.1 }
    },
    travel: {
      'hotel': { hours: 0.5 },
      'flight': { km: 0.25 }
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
        factor = unit === 'km' ? 0.15 : 0;
        break;
      case 'energy':
        factor = unit === 'kwh' ? 0.4 : 0;
        break;
      case 'food':
        factor = unit === 'kg' ? 2.0 : 0;
        break;
      case 'travel':
        factor = unit === 'km' ? 0.2 : unit === 'hours' ? 0.3 : 0;
        break;
      case 'shopping':
        factor = unit === 'kg' ? 3.0 : 0;
        break;
    }
  }

  return Math.round((amount * factor) * 100) / 100;
};

// Static method to calculate eco points based on emission
footprintLogSchema.statics.calculateEcoPoints = function(carbonEmission, category) {
  // Award points for low-emission activities
  let points = 0;
  
  if (carbonEmission === 0) {
    points = 10; // Zero emission activities get 10 points
  } else if (carbonEmission <= 1) {
    points = 5; // Low emission activities get 5 points
  } else if (carbonEmission <= 3) {
    points = 2; // Medium-low emission activities get 2 points
  }
  
  // Bonus points for specific categories
  if (category === 'transport' && carbonEmission === 0) {
    points += 5; // Bonus for walking/biking
  }
  
  return points;
};

// Pre-save middleware to calculate carbon emission and eco points
footprintLogSchema.pre('save', function(next) {
  if (this.isNew || this.isModified(['category', 'activity', 'amount', 'unit'])) {
    this.carbonEmission = this.constructor.calculateCarbonEmission(
      this.category, 
      this.activity, 
      this.amount, 
      this.unit
    );
    
    this.ecoPointsEarned = this.constructor.calculateEcoPoints(
      this.carbonEmission, 
      this.category
    );
  }
  next();
});

// Static method to get user's monthly footprint
footprintLogSchema.statics.getMonthlyFootprint = function(userId, year, month) {
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
        totalEmission: { $sum: '$carbonEmission' },
        totalPoints: { $sum: '$ecoPointsEarned' },
        count: { $sum: 1 }
      }
    }
  ]);
};

// Indexes for performance
footprintLogSchema.index({ user: 1, date: -1 });
footprintLogSchema.index({ category: 1 });
footprintLogSchema.index({ date: -1 });

module.exports = mongoose.model('FootprintLog', footprintLogSchema);