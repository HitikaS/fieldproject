// WebSocket utility functions for controllers
class SocketManager {
  constructor() {
    this.io = null;
  }

  initialize(io) {
    this.io = io;
  }

  // Emit to all authenticated users
  emitToAll(event, data) {
    if (this.io) {
      this.io.of('/').to('general').emit(event, data);
    }
  }

  // Emit to specific user
  emitToUser(userId, event, data) {
    if (this.io) {
      this.io.of('/').to(`user:${userId}`).emit(event, data);
    }
  }

  // Emit to admins only
  emitToAdmins(event, data) {
    if (this.io) {
      this.io.of('/').to('admins').emit(event, data);
    }
  }

  // Emit public event (non-authenticated)
  emitPublic(event, data) {
    if (this.io) {
      this.io.of('/public').emit(event, data);
    }
  }

  // Carbon footprint real-time updates
  emitCarbonUpdate(user, logData) {
    this.emitToAll('globalCarbonUpdate', {
      user: user.username,
      activity: logData.activity,
      amount: logData.amount,
      carbonEmission: logData.carbonEmission,
      timestamp: new Date()
    });
  }

  // Water usage real-time updates
  emitWaterUpdate(user, logData) {
    this.emitToAll('globalWaterUpdate', {
      user: user.username,
      category: logData.category,
      amount: logData.amount,
      timestamp: new Date()
    });
  }

  // Recyclable item updates
  emitNewRecyclable(user, recyclableData) {
    this.emitToAll('newRecyclableItem', {
      id: recyclableData._id,
      title: recyclableData.title,
      category: recyclableData.category,
      condition: recyclableData.condition,
      location: recyclableData.location,
      user: user.username,
      timestamp: new Date()
    });
  }

  emitRecyclableClaimed(ownerId, claimerUser, recyclableData) {
    // Notify owner
    this.emitToUser(ownerId, 'itemClaimed', {
      type: 'recyclable',
      itemTitle: recyclableData.title,
      claimedBy: claimerUser.username,
      message: `Your recyclable "${recyclableData.title}" has been claimed by ${claimerUser.username}!`
    });
    
    // Notify all users
    this.emitToAll('itemUnavailable', {
      type: 'recyclable',
      itemId: recyclableData._id
    });
  }

  // Donation updates
  emitNewDonation(user, donationData) {
    this.emitToAll('newDonation', {
      id: donationData._id,
      title: donationData.title,
      category: donationData.category,
      urgency: donationData.urgency,
      location: donationData.location,
      user: user.username,
      timestamp: new Date()
    });
    
    // Special notification for urgent donations
    if (donationData.urgency === 'urgent') {
      this.emitToAll('urgentDonation', {
        title: donationData.title,
        location: donationData.location.city,
        user: user.username,
        message: '🚨 Urgent donation needs immediate attention!'
      });
    }
  }

  emitDonationClaimed(donorId, claimerUser, donationData) {
    this.emitToUser(donorId, 'donationClaimed', {
      itemTitle: donationData.title,
      claimedBy: claimerUser.username,
      message: `Your donation "${donationData.title}" has been claimed by ${claimerUser.username}!`
    });
  }

  // Awareness post updates (admin only)
  emitNewAwarenessPost(adminUser, postData) {
    this.emitToAll('newAwarenessPost', {
      id: postData._id,
      title: postData.title,
      category: postData.category,
      excerpt: postData.excerpt,
      featured: postData.featured,
      author: adminUser.username,
      timestamp: new Date()
    });
    
    if (postData.featured) {
      this.emitToAll('featuredPost', {
        title: postData.title,
        message: '⭐ New featured post available!'
      });
    }
  }

  // Leaderboard updates
  emitLeaderboardUpdate(user, pointsData) {
    this.emitToAll('leaderboardUpdate', {
      userId: user._id,
      username: user.username,
      newPoints: pointsData.points,
      totalPoints: user.ecoPoints,
      reason: pointsData.reason,
      timestamp: new Date()
    });
  }

  emitAchievementUnlocked(user, achievement) {
    this.emitToAll('achievementUnlocked', {
      user: user.username,
      achievement: achievement,
      message: `🎉 ${user.username} unlocked: ${achievement.name}!`
    });
  }

  // Comment updates
  emitNewComment(user, commentData) {
    this.emitToAll('newComment', {
      postId: commentData.postId,
      postTitle: commentData.postTitle,
      comment: commentData.text,
      user: user.username,
      timestamp: new Date()
    });
  }

  // Admin notifications
  emitAdminNotification(type, message, data = {}) {
    this.emitToAdmins('adminAlert', {
      type: type,
      message: message,
      data: data,
      timestamp: new Date()
    });
  }

  // System statistics for admins
  emitSystemStats() {
    if (this.io) {
      const stats = {
        activeUsers: this.io.of('/').sockets.size,
        adminUsers: Array.from(this.io.of('/').adapter.rooms.get('admins') || []).length,
        generalRoomUsers: Array.from(this.io.of('/').adapter.rooms.get('general') || []).length,
        timestamp: new Date()
      };
      
      this.emitToAdmins('systemStats', stats);
    }
  }
}

// Create singleton instance
const socketManager = new SocketManager();

module.exports = socketManager;