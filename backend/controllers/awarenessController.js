const AwarenessPost = require('../models/AwarenessPost');
const User = require('../models/User');
const socketManager = require('../utils/socketManager');
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// @desc    Handle chatbot messages
// @route   POST /api/awareness/chat
// @access  Public
const handleChatMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    let response;

    // Try to use OpenAI if API key is available
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are EcoBot, a helpful sustainability assistant. Provide accurate, helpful information about environmental topics, recycling, carbon footprints, water conservation, and sustainable living. Keep responses concise but informative. Always encourage positive environmental actions."
            },
            {
              role: "user",
              content: message
            }
          ],
          max_tokens: 300,
          temperature: 0.7
        });

        response = completion.choices[0].message.content.trim();
      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError);
        // Fallback to local response generator
        response = generateChatResponse(message.trim().toLowerCase());
      }
    } else {
      // Use local response generator if no API key
      response = generateChatResponse(message.trim().toLowerCase());
    }

    res.json({
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({
      error: 'Failed to process chat message',
      details: error.message
    });
  }
};

// Simple response generator - can be replaced with AI API
const generateChatResponse = (message) => {
  const responses = {
    'recycling': 'Recycling helps reduce waste and conserve resources. Sort your plastics, paper, and metals properly. Did you know that recycling one ton of plastic saves enough energy to power a home for 2-3 months?',
    
    'carbon footprint': 'Your carbon footprint is the total greenhouse gases you produce. Track it in our app and reduce by using public transport, eating less meat, and conserving energy. Small changes like unplugging devices can make a big difference!',
    
    'water conservation': 'Save water by taking shorter showers, fixing leaks, and using water-efficient appliances. Every drop counts - the average person uses 80-100 gallons of water per day!',
    
    'sustainable living': 'Live sustainably by reducing waste, conserving energy, eating plant-based meals, and supporting green products. Start small: use reusable bags, bike instead of drive, and compost food waste.',
    
    'climate change': 'Climate change is caused by greenhouse gases trapping heat in our atmosphere. We can combat it through renewable energy, reforestation, and reducing emissions. Your actions today shape tomorrow\'s world.',
    
    'eco tips': 'Here are some quick eco tips: 1) Use LED bulbs, 2) Walk or bike for short trips, 3) Reduce meat consumption, 4) Use reusable water bottles, 5) Plant trees or support reforestation. Check our Awareness Hub for more detailed guides!',
    
    'renewable energy': 'Renewable energy comes from sources like solar, wind, and hydro power. Switching to renewables can significantly reduce your carbon footprint. Many countries are now generating over 50% of their electricity from renewables!',
    
    'plastic pollution': 'Plastic pollution affects oceans and wildlife. Reduce plastic use by choosing reusable alternatives, avoiding single-use plastics, and properly recycling. Microplastics are now found in 90% of bottled water!',
    
    'deforestation': 'Deforestation contributes to climate change and biodiversity loss. Support sustainable forestry, reduce paper use, and plant trees. We lose 18.7 million acres of forest each year.',
    
    'green technology': 'Green technology includes solar panels, electric vehicles, and energy-efficient appliances. These innovations help us live sustainably while maintaining modern conveniences.'
  };

  // Check for keywords in the message
  for (const [keyword, response] of Object.entries(responses)) {
    if (message.includes(keyword)) {
      return response;
    }
  }

  // Default responses for common greetings and questions
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    return 'Hello! I\'m EcoBot, your sustainability assistant. Ask me anything about eco-friendly living, recycling, carbon footprints, or environmental topics!';
  }

  if (message.includes('help') || message.includes('what can you do')) {
    return 'I can help you with: recycling tips, carbon footprint reduction, water conservation, sustainable living advice, climate change information, and eco-friendly practices. What would you like to know?';
  }

  if (message.includes('thank')) {
    return 'You\'re welcome! Remember, every small action contributes to a healthier planet. Keep up the great work!';
  }

  // Fallback response
  return "I'm here to help with sustainability questions! Try asking about recycling, carbon footprints, water conservation, or eco-tips. What specific topic interests you?";
};

// @desc    Add new awareness post (admin only)
// @route   POST /api/awareness
// @access  Private (Admin)
const addAwarenessPost = async (req, res) => {
  try {
    const { title, content, category, tags, featuredImage, difficulty, actionItems, impactMetrics, featured, trending } = req.body;

    const post = new AwarenessPost({
      title,
      content,
      category,
      tags,
      featuredImage,
      author: req.user.id,
      difficulty,
      actionItems,
      impactMetrics,
      featured,
      trending
    });

    await post.save();

    // Populate author for real-time event
    await post.populate('author', 'username');

    // Emit real-time events
    socketManager.emitNewAwarenessPost({
      title: post.title,
      category: post.category,
      author: post.author.username,
      featured: post.featured,
      trending: post.trending
    });

    // If it's a featured post, emit special notification
    if (post.featured) {
      socketManager.emitFeaturedPost({
        title: post.title,
        category: post.category,
        message: `🌟 New featured post: "${post.title}" - Check it out for important sustainability insights!`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Awareness post added successfully',
      post
    });
  } catch (error) {
    console.error('Add awareness post error:', error);
    res.status(500).json({
      message: 'Failed to add awareness post',
      error: error.message
    });
  }
};

// @desc    Get all awareness posts
// @route   GET /api/awareness
// @access  Public
const getAwarenessPosts = async (req, res) => {
  try {
    const { category, search, limit = 20, page = 1, sortBy = 'publishedAt', sortOrder = 'desc' } = req.query;

    const query = { status: 'published' };
    if (category) query.category = category;

    let posts;
    if (search) {
      posts = await AwarenessPost.searchPosts(search)
        .limit(limit * 1)
        .skip((page - 1) * limit);
    } else {
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      posts = await AwarenessPost.find(query)
        .populate('author', 'username fullName')
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit);
    }

    const total = await AwarenessPost.countDocuments(query);

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get awareness posts error:', error);
    res.status(500).json({
      message: 'Failed to get awareness posts',
      error: error.message
    });
  }
};

// @desc    Get awareness post by ID
// @route   GET /api/awareness/:id
// @access  Public
const getAwarenessPostById = async (req, res) => {
  try {
    const post = await AwarenessPost.findById(req.params.id)
      .populate('author', 'username fullName profilePicture')
      .populate('engagement.comments.user', 'username fullName profilePicture');

    if (!post || post.status !== 'published') {
      return res.status(404).json({ message: 'Awareness post not found' });
    }

    // Increment view count
    await post.incrementViews();

    res.json({ post });
  } catch (error) {
    console.error('Get awareness post by ID error:', error);
    res.status(500).json({
      message: 'Failed to get awareness post',
      error: error.message
    });
  }
};

// @desc    Update awareness post (admin only)
// @route   PUT /api/awareness/:id
// @access  Private (Admin)
const updateAwarenessPost = async (req, res) => {
  try {
    const post = await AwarenessPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Awareness post not found' });
    }

    // Only admin or author can update
    if (req.user.role !== 'admin' && post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      post[key] = updates[key];
    });

    await post.save();

    res.json({
      message: 'Awareness post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update awareness post error:', error);
    res.status(500).json({
      message: 'Failed to update awareness post',
      error: error.message
    });
  }
};

// @desc    Delete awareness post (admin only)
// @route   DELETE /api/awareness/:id
// @access  Private (Admin)
const deleteAwarenessPost = async (req, res) => {
  try {
    const post = await AwarenessPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Awareness post not found' });
    }

    // Only admin or author can delete
    if (req.user.role !== 'admin' && post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    post.status = 'archived';
    await post.save();

    res.json({ message: 'Awareness post deleted successfully' });
  } catch (error) {
    console.error('Delete awareness post error:', error);
    res.status(500).json({
      message: 'Failed to delete awareness post',
      error: error.message
    });
  }
};

// @desc    Like/unlike awareness post
// @route   POST /api/awareness/:id/like
// @access  Private
const toggleLike = async (req, res) => {
  try {
    const post = await AwarenessPost.findById(req.params.id);

    if (!post || post.status !== 'published') {
      return res.status(404).json({ message: 'Awareness post not found' });
    }

    const liked = post.toggleLike(req.user.id);
    await post.save();

    res.json({
      message: liked ? 'Post liked' : 'Post unliked',
      likeCount: post.likeCount
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      message: 'Failed to like/unlike post',
      error: error.message
    });
  }
};

// @desc    Add comment to awareness post
// @route   POST /api/awareness/:id/comment
// @access  Private
const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const post = await AwarenessPost.findById(req.params.id);

    if (!post || post.status !== 'published') {
      return res.status(404).json({ message: 'Awareness post not found' });
    }

    const comment = post.addComment(req.user.id, content);
    await post.save();

    // Get user data for real-time event
    const user = await User.findById(req.user.id);

    // Emit real-time event
    socketManager.emitNewComment({
      postId: post._id,
      postTitle: post.title,
      user: user.username,
      comment: content,
      commentCount: post.commentCount
    });

    res.json({
      message: 'Comment added successfully',
      comment,
      commentCount: post.commentCount
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      message: 'Failed to add comment',
      error: error.message
    });
  }
};

// @desc    Add reply to comment
// @route   POST /api/awareness/:id/comment/:commentId/reply
// @access  Private
const addReply = async (req, res) => {
  try {
    const { content } = req.body;
    const post = await AwarenessPost.findById(req.params.id);

    if (!post || post.status !== 'published') {
      return res.status(404).json({ message: 'Awareness post not found' });
    }

    const reply = post.addReply(req.params.commentId, req.user.id, content);
    await post.save();

    res.json({
      message: 'Reply added successfully',
      reply
    });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({
      message: 'Failed to add reply',
      error: error.message
    });
  }
};

// @desc    Get featured posts
// @route   GET /api/awareness/featured
// @access  Public
const getFeaturedPosts = async (req, res) => {
  try {
    const { limit = 3 } = req.query;
    const featured = await AwarenessPost.getFeaturedPosts(parseInt(limit));
    res.json({ featured });
  } catch (error) {
    console.error('Get featured posts error:', error);
    res.status(500).json({
      message: 'Failed to get featured posts',
      error: error.message
    });
  }
};

// @desc    Get trending posts
// @route   GET /api/awareness/trending
// @access  Public
const getTrendingPosts = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const trending = await AwarenessPost.getTrendingPosts(parseInt(limit));
    res.json({ trending });
  } catch (error) {
    console.error('Get trending posts error:', error);
    res.status(500).json({
      message: 'Failed to get trending posts',
      error: error.message
    });
  }
};

module.exports = {
  handleChatMessage,
  addAwarenessPost,
  getAwarenessPosts,
  getAwarenessPostById,
  updateAwarenessPost,
  deleteAwarenessPost,
  toggleLike,
  addComment,
  addReply,
  getFeaturedPosts,
  getTrendingPosts
};
