const mongoose = require('mongoose');

const awarenessPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    minlength: [50, 'Content must be at least 50 characters'],
    maxlength: [2000, 'Content cannot exceed 2000 characters']
  },
  excerpt: {
    type: String,
    trim: true,
    maxlength: [200, 'Excerpt cannot exceed 200 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['tips', 'news', 'education', 'events', 'challenges'],
      message: 'Category must be one of: tips, news, education, events, challenges'
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  featuredImage: {
    url: {
      type: String,
      default: ''
    },
    alt: {
      type: String,
      default: ''
    }
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  coAuthors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: {
    type: Date
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  estimatedReadTime: {
    type: Number, // in minutes
    default: 5
  },
  sources: [{
    title: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    description: String
  }],
  relatedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AwarenessPost'
  }],
  engagement: {
    views: {
      type: Number,
      default: 0
    },
    likes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    shares: {
      type: Number,
      default: 0
    },
    comments: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
      },
      isApproved: {
        type: Boolean,
        default: true
      },
      replies: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        content: {
          type: String,
          required: true,
          trim: true,
          maxlength: 300
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }],
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  seo: {
    metaTitle: {
      type: String,
      maxlength: 60
    },
    metaDescription: {
      type: String,
      maxlength: 160
    },
    keywords: [{
      type: String,
      trim: true,
      lowercase: true
    }]
  },
  actionItems: [{
    text: {
      type: String,
      required: true,
      maxlength: 200
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy'
    },
    estimatedTime: {
      type: String, // e.g., "5 minutes", "1 hour", "1 week"
      default: '5 minutes'
    },
    category: {
      type: String,
      enum: ['immediate', 'daily', 'weekly', 'monthly', 'lifestyle'],
      default: 'immediate'
    }
  }],
  impactMetrics: {
    potentialCO2Reduction: {
      type: Number, // kg CO2 that could be saved if tips are followed
      default: 0
    },
    potentialWaterSaving: {
      type: Number, // liters of water that could be saved
      default: 0
    },
    costSaving: {
      type: Number, // potential cost savings in USD
      default: 0
    }
  },
  featured: {
    type: Boolean,
    default: false
  },
  trending: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for like count
awarenessPostSchema.virtual('likeCount').get(function() {
  return this.engagement.likes.length;
});

// Virtual for comment count
awarenessPostSchema.virtual('commentCount').get(function() {
  return this.engagement.comments.length;
});

// Virtual for engagement score (for ranking posts)
awarenessPostSchema.virtual('engagementScore').get(function() {
  const views = this.engagement.views || 0;
  const likes = this.engagement.likes.length || 0;
  const comments = this.engagement.comments.length || 0;
  const shares = this.engagement.shares || 0;
  
  // Weighted engagement score
  return (views * 0.1) + (likes * 2) + (comments * 3) + (shares * 5);
});

// Virtual for reading difficulty badge
awarenessPostSchema.virtual('difficultyBadge').get(function() {
  const badges = {
    beginner: { color: 'green', text: 'Beginner Friendly', icon: '🌱' },
    intermediate: { color: 'blue', text: 'Intermediate', icon: '🌿' },
    advanced: { color: 'purple', text: 'Advanced', icon: '🌳' }
  };
  return badges[this.difficulty] || badges.beginner;
});

// Virtual for category icon
awarenessPostSchema.virtual('categoryIcon').get(function() {
  const icons = {
    tips: '💡',
    news: '📰',
    education: '📚',
    events: '📅',
    challenges: '🎯'
  };
  return icons[this.category] || icons.tips;
});

// Pre-save middleware to generate excerpt and calculate read time
awarenessPostSchema.pre('save', function(next) {
  // Auto-generate excerpt if not provided
  if (!this.excerpt && this.content) {
    this.excerpt = this.content.substring(0, 150) + '...';
  }
  
  // Calculate estimated read time (average 200 words per minute)
  if (this.content) {
    const wordCount = this.content.split(' ').length;
    this.estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));
  }
  
  // Set published date when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Auto-generate SEO fields if not provided
  if (!this.seo.metaTitle) {
    this.seo.metaTitle = this.title.substring(0, 60);
  }
  
  if (!this.seo.metaDescription) {
    this.seo.metaDescription = this.excerpt.substring(0, 160);
  }
  
  next();
});

// Instance method to like/unlike post
awarenessPostSchema.methods.toggleLike = function(userId) {
  const likeIndex = this.engagement.likes.findIndex(
    like => like.user.toString() === userId.toString()
  );
  
  if (likeIndex > -1) {
    this.engagement.likes.splice(likeIndex, 1);
    return false; // unliked
  } else {
    this.engagement.likes.push({ user: userId });
    return true; // liked
  }
};

// Instance method to add comment
awarenessPostSchema.methods.addComment = function(userId, content) {
  this.engagement.comments.push({
    user: userId,
    content: content
  });
  return this.engagement.comments[this.engagement.comments.length - 1];
};

// Instance method to add reply to comment
awarenessPostSchema.methods.addReply = function(commentId, userId, content) {
  const comment = this.engagement.comments.id(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }
  
  comment.replies.push({
    user: userId,
    content: content
  });
  
  return comment.replies[comment.replies.length - 1];
};

// Instance method to increment view count
awarenessPostSchema.methods.incrementViews = function() {
  this.engagement.views += 1;
  return this.save();
};

// Static method to get trending posts
awarenessPostSchema.statics.getTrendingPosts = function(limit = 5) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        status: 'published',
        publishedAt: { $gte: weekAgo }
      }
    },
    {
      $addFields: {
        engagementScore: {
          $add: [
            { $multiply: ['$engagement.views', 0.1] },
            { $multiply: [{ $size: '$engagement.likes' }, 2] },
            { $multiply: [{ $size: '$engagement.comments' }, 3] },
            { $multiply: ['$engagement.shares', 5] }
          ]
        }
      }
    },
    {
      $sort: { engagementScore: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

// Static method to get featured posts
awarenessPostSchema.statics.getFeaturedPosts = function(limit = 3) {
  return this.find({
    status: 'published',
    featured: true
  }).populate('author', 'username fullName')
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// Static method to search posts
awarenessPostSchema.statics.searchPosts = function(query) {
  const searchRegex = new RegExp(query, 'i');
  
  return this.find({
    status: 'published',
    $or: [
      { title: searchRegex },
      { content: searchRegex },
      { tags: { $in: [searchRegex] } },
      { excerpt: searchRegex }
    ]
  }).populate('author', 'username fullName')
    .sort({ publishedAt: -1 });
};

// Static method to get posts by category
awarenessPostSchema.statics.getPostsByCategory = function(category, limit = 10) {
  return this.find({
    status: 'published',
    category: category
  }).populate('author', 'username fullName')
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// Static method to get related posts
awarenessPostSchema.statics.getRelatedPosts = function(postId, tags, limit = 3) {
  return this.find({
    _id: { $ne: postId },
    status: 'published',
    tags: { $in: tags }
  }).populate('author', 'username fullName')
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// Indexes for performance
awarenessPostSchema.index({ status: 1, publishedAt: -1 });
awarenessPostSchema.index({ category: 1, publishedAt: -1 });
awarenessPostSchema.index({ author: 1 });
awarenessPostSchema.index({ tags: 1 });
awarenessPostSchema.index({ featured: 1, publishedAt: -1 });
awarenessPostSchema.index({ 'engagement.views': -1 });
awarenessPostSchema.index({ title: 'text', content: 'text', excerpt: 'text' });

module.exports = mongoose.model('AwarenessPost', awarenessPostSchema);