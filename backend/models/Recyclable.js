const mongoose = require('mongoose');

const recyclableSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['electronics', 'clothing', 'furniture', 'books', 'toys', 'appliances', 'other'],
      message: 'Category must be one of: electronics, clothing, furniture, books, toys, appliances, other'
    }
  },
  condition: {
    type: String,
    required: [true, 'Condition is required'],
    enum: {
      values: ['excellent', 'good', 'fair', 'poor'],
      message: 'Condition must be one of: excellent, good, fair, poor'
    }
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    }
  }],
  location: {
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },
  availability: {
    type: String,
    enum: ['available', 'reserved', 'taken'],
    default: 'available'
  },
  reservedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reservedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  estimatedValue: {
    type: Number,
    min: 0,
    default: 0
  },
  weight: {
    value: {
      type: Number,
      min: 0
    },
    unit: {
      type: String,
      enum: ['kg', 'lbs'],
      default: 'kg'
    }
  },
  contactMethod: {
    type: String,
    enum: ['message', 'phone', 'email'],
    default: 'message'
  },
  contactInfo: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    preferredTime: {
      type: String,
      trim: true
    }
  },
  views: {
    type: Number,
    default: 0
  },
  interests: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: {
      type: String,
      trim: true,
      maxlength: 300
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  ecoImpact: {
    carbonSaved: {
      type: Number,
      default: 0 // kg CO2 saved by recycling instead of disposing
    },
    materialsRecycled: {
      type: Number,
      default: 0 // kg of materials recycled
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for time since posted
recyclableSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Virtual for condition badge color
recyclableSchema.virtual('conditionBadge').get(function() {
  const badges = {
    excellent: { color: 'green', text: 'Excellent' },
    good: { color: 'blue', text: 'Good' },
    fair: { color: 'yellow', text: 'Fair' },
    poor: { color: 'red', text: 'Poor' }
  };
  return badges[this.condition] || badges.fair;
});

// Static method to calculate eco impact
recyclableSchema.statics.calculateEcoImpact = function(category, weight = 1) {
  // Carbon savings by recycling vs disposal (kg CO2 per kg)
  const carbonSavings = {
    electronics: 3.5,
    clothing: 2.8,
    furniture: 1.2,
    books: 0.9,
    toys: 2.1,
    appliances: 4.2,
    other: 1.5
  };
  
  const factor = carbonSavings[category] || carbonSavings.other;
  return {
    carbonSaved: Math.round(weight * factor * 100) / 100,
    materialsRecycled: weight
  };
};

// Pre-save middleware to calculate eco impact
recyclableSchema.pre('save', function(next) {
  if (this.isNew || this.isModified(['category', 'weight'])) {
    const weightValue = this.weight.value || 1;
    const impact = this.constructor.calculateEcoImpact(this.category, weightValue);
    this.ecoImpact = impact;
  }
  next();
});

// Instance method to reserve item
recyclableSchema.methods.reserve = function(userId) {
  if (this.availability !== 'available') {
    throw new Error('Item is not available for reservation');
  }
  
  this.availability = 'reserved';
  this.reservedBy = userId;
  this.reservedAt = new Date();
  
  // Auto-release reservation after 48 hours if not completed
  setTimeout(() => {
    if (this.availability === 'reserved') {
      this.availability = 'available';
      this.reservedBy = undefined;
      this.reservedAt = undefined;
      this.save();
    }
  }, 48 * 60 * 60 * 1000); // 48 hours
};

// Instance method to complete exchange
recyclableSchema.methods.complete = function() {
  if (this.availability !== 'reserved') {
    throw new Error('Item must be reserved before completion');
  }
  
  this.availability = 'taken';
  this.completedAt = new Date();
  this.isActive = false;
};

// Instance method to add interest
recyclableSchema.methods.addInterest = function(userId, message = '') {
  const existingInterest = this.interests.find(
    interest => interest.user.toString() === userId.toString()
  );
  
  if (existingInterest) {
    existingInterest.message = message;
    existingInterest.createdAt = new Date();
  } else {
    this.interests.push({
      user: userId,
      message: message
    });
  }
};

// Static method to get trending categories
recyclableSchema.statics.getTrendingCategories = function(limit = 5) {
  return this.aggregate([
    {
      $match: { 
        isActive: true,
        availability: 'available',
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgViews: { $avg: '$views' }
      }
    },
    {
      $sort: { count: -1, avgViews: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

// Static method to search recyclables
recyclableSchema.statics.searchRecyclables = function(query) {
  const searchRegex = new RegExp(query, 'i');
  
  return this.find({
    isActive: true,
    availability: 'available',
    $or: [
      { title: searchRegex },
      { description: searchRegex },
      { tags: { $in: [searchRegex] } },
      { category: searchRegex }
    ]
  }).populate('user', 'username fullName')
    .sort({ createdAt: -1 });
};

// Static method to get nearby recyclables
recyclableSchema.statics.getNearbyRecyclables = function(latitude, longitude, maxDistance = 50) {
  return this.find({
    isActive: true,
    availability: 'available',
    'location.coordinates.latitude': { $exists: true },
    'location.coordinates.longitude': { $exists: true }
  }).populate('user', 'username fullName')
    .sort({ createdAt: -1 });
    // Note: For production, implement proper geospatial queries with MongoDB 2dsphere index
};

// Indexes for performance
recyclableSchema.index({ category: 1, availability: 1 });
recyclableSchema.index({ 'location.city': 1 });
recyclableSchema.index({ createdAt: -1 });
recyclableSchema.index({ availability: 1, isActive: 1 });
recyclableSchema.index({ user: 1 });
recyclableSchema.index({ tags: 1 });
recyclableSchema.index({ 'location.coordinates': '2dsphere' }); // For geospatial queries

module.exports = mongoose.model('Recyclable', recyclableSchema);