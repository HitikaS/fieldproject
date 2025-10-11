const jwt = require('jsonwebtoken');
const User = require('../models/User');

// WebSocket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return next(new Error('Invalid token - user not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
};

module.exports = (io) => {
  // Main namespace for authenticated users
  const mainNamespace = io.of('/');
  
  // Use authentication middleware
  mainNamespace.use(authenticateSocket);

  mainNamespace.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.username} (${socket.id})`);
    
    // Join user to their personal room and general rooms
    socket.join(`user:${socket.user._id}`);
    socket.join('general');
    
    // Join admin room if user is admin
    if (socket.user.role === 'admin') {
      socket.join('admins');
      console.log(`👑 Admin ${socket.user.username} joined admin room`);
    }

    // Send welcome message
    socket.emit('connected', {
      message: 'Welcome to Sustainable Lifestyle!',
      user: {
        id: socket.user._id,
        username: socket.user.username,
        role: socket.user.role
      }
    });

    // 🌱 CARBON FOOTPRINT REAL-TIME UPDATES
    socket.on('carbonLogAdded', (data) => {
      // Notify all users about environmental impact
      mainNamespace.to('general').emit('globalCarbonUpdate', {
        user: socket.user.username,
        activity: data.activity,
        amount: data.amount,
        carbonEmission: data.carbonEmission,
        timestamp: new Date()
      });
      
      // Update user's personal stats
      socket.to(`user:${socket.user._id}`).emit('personalStatsUpdate', {
        type: 'carbon',
        data: data
      });
    });

    // 💧 WATER USAGE REAL-TIME UPDATES
    socket.on('waterLogAdded', (data) => {
      mainNamespace.to('general').emit('globalWaterUpdate', {
        user: socket.user.username,
        category: data.category,
        amount: data.amount,
        timestamp: new Date()
      });
    });

    // ♻️ RECYCLABLE ITEM REAL-TIME UPDATES
    socket.on('recyclableAdded', (data) => {
      // Notify all users about new recyclable item
      mainNamespace.to('general').emit('newRecyclableItem', {
        id: data.id,
        title: data.title,
        category: data.category,
        condition: data.condition,
        location: data.location,
        user: socket.user.username,
        timestamp: new Date()
      });
    });

    socket.on('recyclableClaimed', (data) => {
      // Notify the item owner
      mainNamespace.to(`user:${data.ownerId}`).emit('itemClaimed', {
        type: 'recyclable',
        itemTitle: data.title,
        claimedBy: socket.user.username,
        message: `Your recyclable "${data.title}" has been claimed!`
      });
      
      // Notify all users that item is no longer available
      mainNamespace.to('general').emit('itemUnavailable', {
        type: 'recyclable',
        itemId: data.id
      });
    });

    // 🤝 DONATION REAL-TIME UPDATES
    socket.on('donationAdded', (data) => {
      // Notify all users about new donation
      mainNamespace.to('general').emit('newDonation', {
        id: data.id,
        title: data.title,
        category: data.category,
        urgency: data.urgency,
        location: data.location,
        user: socket.user.username,
        timestamp: new Date()
      });
      
      // Special notification for urgent donations
      if (data.urgency === 'urgent') {
        mainNamespace.to('general').emit('urgentDonation', {
          title: data.title,
          location: data.location.city,
          user: socket.user.username,
          message: '🚨 Urgent donation needs immediate attention!'
        });
      }
    });

    socket.on('donationClaimed', (data) => {
      // Notify the donor
      mainNamespace.to(`user:${data.donorId}`).emit('donationClaimed', {
        itemTitle: data.title,
        claimedBy: socket.user.username,
        message: `Your donation "${data.title}" has been claimed!`
      });
    });

    // 📚 AWARENESS POST REAL-TIME UPDATES (Admin only)
    socket.on('awarenessPostAdded', (data) => {
      if (socket.user.role === 'admin') {
        // Notify all users about new awareness post
        mainNamespace.to('general').emit('newAwarenessPost', {
          id: data.id,
          title: data.title,
          category: data.category,
          excerpt: data.excerpt,
          featured: data.featured,
          author: socket.user.username,
          timestamp: new Date()
        });
        
        // Special notification for featured posts
        if (data.featured) {
          mainNamespace.to('general').emit('featuredPost', {
            title: data.title,
            message: '⭐ New featured post available!'
          });
        }
      }
    });

    // 🏆 LEADERBOARD REAL-TIME UPDATES
    socket.on('ecoPointsEarned', (data) => {
      // Update leaderboard for all users
      mainNamespace.to('general').emit('leaderboardUpdate', {
        userId: socket.user._id,
        username: socket.user.username,
        newPoints: data.points,
        totalPoints: data.totalPoints,
        reason: data.reason,
        timestamp: new Date()
      });
      
      // Achievement notifications
      if (data.achievement) {
        mainNamespace.to('general').emit('achievementUnlocked', {
          user: socket.user.username,
          achievement: data.achievement,
          message: `🎉 ${socket.user.username} unlocked: ${data.achievement.name}!`
        });
      }
    });

    // 👥 USER ACTIVITY REAL-TIME UPDATES
    socket.on('userJoined', () => {
      socket.broadcast.emit('userActivity', {
        type: 'joined',
        user: socket.user.username,
        timestamp: new Date()
      });
    });

    // 💬 COMMENT REAL-TIME UPDATES
    socket.on('commentAdded', (data) => {
      // Notify users interested in the post
      mainNamespace.to('general').emit('newComment', {
        postId: data.postId,
        postTitle: data.postTitle,
        comment: data.comment,
        user: socket.user.username,
        timestamp: new Date()
      });
    });

    // 🔔 ADMIN NOTIFICATIONS
    socket.on('adminNotification', (data) => {
      if (socket.user.role === 'admin') {
        mainNamespace.to('admins').emit('adminAlert', {
          type: data.type,
          message: data.message,
          data: data.data,
          timestamp: new Date()
        });
      }
    });

    // 📊 SYSTEM STATS REAL-TIME UPDATES
    socket.on('requestSystemStats', () => {
      if (socket.user.role === 'admin') {
        // Send real-time system statistics to admin
        socket.emit('systemStats', {
          activeUsers: mainNamespace.sockets.size,
          adminUsers: Array.from(mainNamespace.adapter.rooms.get('admins') || []).length,
          generalRoomUsers: Array.from(mainNamespace.adapter.rooms.get('general') || []).length,
          timestamp: new Date()
        });
      }
    });

    // 🔄 TYPING INDICATORS (for comments)
    socket.on('typing', (data) => {
      socket.to('general').emit('userTyping', {
        user: socket.user.username,
        postId: data.postId
      });
    });

    socket.on('stopTyping', (data) => {
      socket.to('general').emit('userStoppedTyping', {
        user: socket.user.username,
        postId: data.postId
      });
    });

    // 🔐 SECURITY EVENTS
    socket.on('suspiciousActivity', (data) => {
      mainNamespace.to('admins').emit('securityAlert', {
        user: socket.user.username,
        activity: data.activity,
        severity: data.severity,
        timestamp: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User disconnected: ${socket.user.username} (${reason})`);
      
      // Notify others about user leaving
      socket.broadcast.emit('userActivity', {
        type: 'left',
        user: socket.user.username,
        timestamp: new Date()
      });
    });
  });

  // Public namespace for non-authenticated real-time updates
  const publicNamespace = io.of('/public');
  
  publicNamespace.on('connection', (socket) => {
    console.log('🌐 Public client connected:', socket.id);
    
    // Send public statistics
    socket.emit('publicStats', {
      message: 'Welcome to Sustainable Lifestyle!',
      totalUsers: 'Contact us to join the community',
      timestamp: new Date()
    });

    socket.on('disconnect', () => {
      console.log('🌐 Public client disconnected:', socket.id);
    });
  });

  return { mainNamespace, publicNamespace };
};