const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [50, 'Full name cannot exceed 50 characters']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  profilePicture: {
    type: String,
    default: ''
  },
  location: {
    city: {
      type: String,
      trim: true,
      default: ''
    },
    country: {
      type: String,
      trim: true,
      default: ''
    }
  },
  ecoPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  carbonFootprint: {
    total: {
      type: Number,
      default: 0
    },
    monthlyAverage: {
      type: Number,
      default: 0
    }
  },
  waterUsage: {
    total: {
      type: Number,
      default: 0
    },
    monthlyAverage: {
      type: Number,
      default: 0
    }
  },
  achievements: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    earnedAt: {
      type: Date,
      default: Date.now
    },
    icon: String
  }],
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      showProfile: {
        type: Boolean,
        default: true
      },
      showStats: {
        type: Boolean,
        default: true
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for user's rank based on eco points
userSchema.virtual('rank').get(function() {
  if (this.ecoPoints >= 1000) return 'Eco Champion';
  if (this.ecoPoints >= 500) return 'Green Guardian';
  if (this.ecoPoints >= 200) return 'Earth Friend';
  if (this.ecoPoints >= 50) return 'Eco Explorer';
  return 'Green Beginner';
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to add eco points
userSchema.methods.addEcoPoints = function(points, reason = 'Activity completed') {
  this.ecoPoints += points;
  
  // Add achievement if milestone reached
  const milestones = [
    { points: 50, name: 'First Steps', description: 'Earned your first 50 eco points!', icon: '🌱' },
    { points: 200, name: 'Eco Explorer', description: 'Reached 200 eco points!', icon: '🌿' },
    { points: 500, name: 'Green Guardian', description: 'Achieved 500 eco points!', icon: '🌳' },
    { points: 1000, name: 'Eco Champion', description: 'Incredible! 1000 eco points!', icon: '🏆' }
  ];
  
  milestones.forEach(milestone => {
    if (this.ecoPoints >= milestone.points && 
        !this.achievements.some(achievement => achievement.name === milestone.name)) {
      this.achievements.push({
        name: milestone.name,
        description: milestone.description,
        icon: milestone.icon
      });
    }
  });
};

// Static method to get leaderboard
userSchema.statics.getLeaderboard = function(limit = 10) {
  return this.find({ isActive: true })
    .select('username fullName ecoPoints carbonFootprint.total waterUsage.total location.city')
    .sort({ ecoPoints: -1 })
    .limit(limit);
};

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ ecoPoints: -1 });
userSchema.index({ 'location.city': 1 });

module.exports = mongoose.model('User', userSchema);