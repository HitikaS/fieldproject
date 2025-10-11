const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
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
      values: ['food', 'clothing', 'books', 'toys', 'household', 'medical', 'other'],
      message: 'Category must be one of: food, clothing, books, toys, household, medical, other'
    }
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unit: {
    type: String,
    default: 'items',
    trim: true
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
      required: [true, 'Address is required'],
      trim: true,
      minlength: [5, 'Address must be at least 5 characters']
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
    enum: ['available', 'claimed', 'expired'],
    default: 'available'
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  expiryDate: {
    type: Date,
    required: function() {
      return this.category === 'food';
    }
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  claimedAt: {
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
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: 300
    }
  },
  targetRecipients: [{
    type: String,
    enum: ['individuals', 'families', 'seniors', 'children', 'homeless', 'ngos', 'any'],
    default: 'any'
  }],
  conditions: {
    type: String,
    trim: true,
    maxlength: 200
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
    organization: {
      type: String,
      trim: true
    },
    message: {
      type: String,
      trim: true,
      maxlength: 300
    },
    contactInfo: {
      phone: String,
      email: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  socialImpact: {
    peopleHelped: {
      type: Number,
      default: 0
    },
    co2Saved: {
      type: Number,
      default: 0 // CO2 saved by donating instead of throwing away
    },
    wasteReduced: {
      type: Number,
      default: 0 // kg of waste reduced
    }
  },
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: {
      type: Date
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

// Virtual for time remaining until expiry
donationSchema.virtual('timeUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  
  const now = new Date();
  const diff = this.expiryDate - now;
  
  if (diff <= 0) return 'Expired';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`;
  return 'Expires soon';
});

// Virtual for urgency badge
donationSchema.virtual('urgencyBadge').get(function() {
  const badges = {
    urgent: { color: 'red', text: 'URGENT', icon: '🚨' },
    high: { color: 'orange', text: 'High Priority', icon: '⚡' },
    medium: { color: 'yellow', text: 'Medium', icon: '📋' },
    low: { color: 'green', text: 'Low Priority', icon: '📝' }
  };
  return badges[this.urgency] || badges.medium;
});

// Virtual for category icon
donationSchema.virtual('categoryIcon').get(function() {
  const icons = {
    food: '🍽️',
    clothing: '👕',
    books: '📚',
    toys: '🧸',
    household: '🏠',
    medical: '🏥',
    other: '📦'
  };
  return icons[this.category] || icons.other;
});

// Static method to calculate social impact
donationSchema.statics.calculateSocialImpact = function(category, quantity) {
  // Impact factors per item/unit
  const impactFactors = {
    food: {
      peopleHelped: 0.5, // 2 items can help 1 person
      co2Saved: 2.1, // kg CO2 per kg of food not wasted
      wasteReduced: 1.0 // 1:1 ratio for food
    },
    clothing: {
      peopleHelped: 0.3, // 3-4 items can help 1 person
      co2Saved: 8.1, // kg CO2 per garment
      wasteReduced: 0.5 // average weight per garment
    },
    books: {
      peopleHelped: 1.0, // 1 book can help 1 person learn
      co2Saved: 4.2, // kg CO2 per book
      wasteReduced: 0.3 // average weight per book
    },
    toys: {
      peopleHelped: 0.5, // 2 toys can help 1 child
      co2Saved: 3.5, // kg CO2 per toy
      wasteReduced: 0.4 // average weight per toy
    },
    household: {
      peopleHelped: 0.2, // 5 items can help 1 household
      co2Saved: 5.7, // kg CO2 per household item
      wasteReduced: 1.2 // average weight per item
    },
    medical: {
      peopleHelped: 2.0, // Medical items can help multiple people
      co2Saved: 1.8, // kg CO2 per medical item
      wasteReduced: 0.1 // medical items are usually light
    },
    other: {
      peopleHelped: 0.5,
      co2Saved: 2.5,
      wasteReduced: 0.8
    }
  };
  
  const factor = impactFactors[category] || impactFactors.other;
  
  return {
    peopleHelped: Math.ceil(quantity * factor.peopleHelped),
    co2Saved: Math.round(quantity * factor.co2Saved * 100) / 100,
    wasteReduced: Math.round(quantity * factor.wasteReduced * 100) / 100
  };
};

// Pre-save middleware to calculate social impact
donationSchema.pre('save', function(next) {
  if (this.isNew || this.isModified(['category', 'quantity'])) {
    const impact = this.constructor.calculateSocialImpact(this.category, this.quantity);
    this.socialImpact = impact;
  }
  
  // Auto-expire food items that are past expiry
  if (this.category === 'food' && this.expiryDate && new Date() > this.expiryDate) {
    this.availability = 'expired';
  }
  
  next();
});

// Instance method to claim donation
donationSchema.methods.claim = function(userId, organizationInfo = {}) {
  if (this.availability !== 'available') {
    throw new Error('Donation is not available for claiming');
  }
  
  this.availability = 'claimed';
  this.claimedBy = userId;
  this.claimedAt = new Date();
  
  // Add to interests with organization info if provided
  if (organizationInfo.organization) {
    this.addInterest(userId, organizationInfo.message || '', organizationInfo);
  }
};

// Instance method to complete donation
donationSchema.methods.complete = function() {
  if (this.availability !== 'claimed') {
    throw new Error('Donation must be claimed before completion');
  }
  
  this.completedAt = new Date();
  this.isActive = false;
};

// Instance method to add interest
donationSchema.methods.addInterest = function(userId, message = '', organizationInfo = {}) {
  const existingInterest = this.interests.find(
    interest => interest.user.toString() === userId.toString()
  );
  
  if (existingInterest) {
    existingInterest.message = message;
    existingInterest.organization = organizationInfo.organization || existingInterest.organization;
    existingInterest.contactInfo = organizationInfo.contactInfo || existingInterest.contactInfo;
    existingInterest.createdAt = new Date();
  } else {
    this.interests.push({
      user: userId,
      message: message,
      organization: organizationInfo.organization || '',
      contactInfo: organizationInfo.contactInfo || {}
    });
  }
};

// Static method to get urgent donations
donationSchema.statics.getUrgentDonations = function(limit = 10) {
  const now = new Date();
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Next 24 hours
  
  return this.find({
    isActive: true,
    availability: 'available',
    $or: [
      { urgency: 'urgent' },
      { urgency: 'high' },
      { 
        category: 'food',
        expiryDate: { $lte: soon }
      }
    ]
  }).populate('user', 'username fullName')
    .sort({ urgency: -1, expiryDate: 1, createdAt: -1 })
    .limit(limit);
};

// Static method to search donations
donationSchema.statics.searchDonations = function(query) {
  const searchRegex = new RegExp(query, 'i');
  
  return this.find({
    isActive: true,
    availability: 'available',
    $or: [
      { title: searchRegex },
      { description: searchRegex },
      { tags: { $in: [searchRegex] } },
      { category: searchRegex },
      { 'location.city': searchRegex }
    ]
  }).populate('user', 'username fullName')
    .sort({ urgency: -1, createdAt: -1 });
};

// Static method to get donations by location
donationSchema.statics.getDonationsByLocation = function(city, radius = 25) {
  return this.find({
    isActive: true,
    availability: 'available',
    'location.city': new RegExp(city, 'i')
  }).populate('user', 'username fullName')
    .sort({ urgency: -1, createdAt: -1 });
};

// Auto-expire donations after 30 days or on food expiry
donationSchema.pre('save', function(next) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Auto-expire old donations
  if (this.createdAt < thirtyDaysAgo && this.availability === 'available') {
    this.availability = 'expired';
    this.isActive = false;
  }
  
  // Auto-expire food past expiry date
  if (this.category === 'food' && this.expiryDate && now > this.expiryDate) {
    this.availability = 'expired';
  }
  
  next();
});

// Indexes for performance
donationSchema.index({ category: 1, availability: 1 });
donationSchema.index({ 'location.city': 1 });
donationSchema.index({ urgency: -1, createdAt: -1 });
donationSchema.index({ availability: 1, isActive: 1 });
donationSchema.index({ user: 1 });
donationSchema.index({ expiryDate: 1 });
donationSchema.index({ tags: 1 });
donationSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('Donation', donationSchema);