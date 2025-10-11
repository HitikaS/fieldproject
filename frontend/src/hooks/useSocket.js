import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token && !socketRef.current) {
      // Connect to main namespace with authentication
      const newSocket = io('http://localhost:5000', {
        auth: {
          token: token
        }
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Connection events
      newSocket.on('connect', () => {
        console.log('🔌 Connected to WebSocket server');
        setConnected(true);
      });

      newSocket.on('connected', (data) => {
        console.log('Welcome message:', data.message);
        addNotification('success', `Welcome back, ${data.user.username}!`);
      });

      newSocket.on('disconnect', () => {
        console.log('🔌 Disconnected from WebSocket server');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setConnected(false);
      });

      // Real-time event listeners
      
      // 🌱 Carbon footprint updates
      newSocket.on('globalCarbonUpdate', (data) => {
        addNotification('info', `${data.user} logged ${data.activity} (${data.carbonEmission}kg CO₂)`);
      });

      // 💧 Water usage updates
      newSocket.on('globalWaterUpdate', (data) => {
        addNotification('info', `${data.user} logged ${data.amount}L water usage`);
      });

      // ♻️ Recyclable updates
      newSocket.on('newRecyclableItem', (data) => {
        addNotification('success', `${data.user} listed "${data.title}" for recycling`);
      });

      newSocket.on('itemClaimed', (data) => {
        addNotification('success', data.message);
      });

      newSocket.on('itemUnavailable', (data) => {
        // Update UI to show item as unavailable
      });

      // 🤝 Donation updates
      newSocket.on('newDonation', (data) => {
        addNotification('success', `${data.user} made a new donation: "${data.title}"`);
      });

      newSocket.on('urgentDonation', (data) => {
        addNotification('warning', data.message, true); // Priority notification
      });

      newSocket.on('donationClaimed', (data) => {
        addNotification('success', data.message);
      });

      // 📚 Awareness posts
      newSocket.on('newAwarenessPost', (data) => {
        addNotification('info', `New awareness post: "${data.title}"`);
      });

      newSocket.on('featuredPost', (data) => {
        addNotification('warning', data.message, true);
      });

      // 🏆 Leaderboard updates
      newSocket.on('leaderboardUpdate', (data) => {
        addNotification('success', `${data.username} earned ${data.newPoints} eco points for ${data.reason}`);
      });

      newSocket.on('achievementUnlocked', (data) => {
        addNotification('success', data.message, true);
      });

      // 💬 Comments
      newSocket.on('newComment', (data) => {
        addNotification('info', `${data.user} commented on "${data.postTitle}"`);
      });

      // 👥 User activity
      newSocket.on('userActivity', (data) => {
        if (data.type === 'joined') {
          addNotification('info', `${data.user} joined the community`);
        }
      });

      // 🔔 Admin notifications (for admin users)
      newSocket.on('adminAlert', (data) => {
        addNotification('warning', `Admin Alert: ${data.message}`, true);
      });

      newSocket.on('systemStats', (data) => {
        console.log('System stats:', data);
      });

      // 🔐 Security alerts
      newSocket.on('securityAlert', (data) => {
        addNotification('error', `Security Alert: ${data.activity}`, true);
      });

      // Typing indicators
      newSocket.on('userTyping', (data) => {
        // Show typing indicator for specific post
      });

      newSocket.on('userStoppedTyping', (data) => {
        // Hide typing indicator
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
    };
  }, []);

  // Add notification helper
  const addNotification = (type, message, priority = false) => {
    const notification = {
      id: Date.now() + Math.random(),
      type,
      message,
      priority,
      timestamp: new Date()
    };

    setNotifications(prev => {
      const newNotifications = priority 
        ? [notification, ...prev] 
        : [...prev, notification];
      
      // Keep only last 50 notifications
      return newNotifications.slice(0, 50);
    });

    // Auto-remove non-priority notifications after 5 seconds
    if (!priority) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    }
  };

  // WebSocket event emitters
  const emitEvent = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
    }
  };

  const emitCarbonLogAdded = (logData) => {
    emitEvent('carbonLogAdded', logData);
  };

  const emitWaterLogAdded = (logData) => {
    emitEvent('waterLogAdded', logData);
  };

  const emitRecyclableAdded = (recyclableData) => {
    emitEvent('recyclableAdded', recyclableData);
  };

  const emitRecyclableClaimed = (claimData) => {
    emitEvent('recyclableClaimed', claimData);
  };

  const emitDonationAdded = (donationData) => {
    emitEvent('donationAdded', donationData);
  };

  const emitDonationClaimed = (claimData) => {
    emitEvent('donationClaimed', claimData);
  };

  const emitAwarenessPostAdded = (postData) => {
    emitEvent('awarenessPostAdded', postData);
  };

  const emitEcoPointsEarned = (pointsData) => {
    emitEvent('ecoPointsEarned', pointsData);
  };

  const emitCommentAdded = (commentData) => {
    emitEvent('commentAdded', commentData);
  };

  const emitTyping = (postId) => {
    emitEvent('typing', { postId });
  };

  const emitStopTyping = (postId) => {
    emitEvent('stopTyping', { postId });
  };

  const requestSystemStats = () => {
    emitEvent('requestSystemStats');
  };

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    socket,
    connected,
    notifications,
    // Event emitters
    emitCarbonLogAdded,
    emitWaterLogAdded,
    emitRecyclableAdded,
    emitRecyclableClaimed,
    emitDonationAdded,
    emitDonationClaimed,
    emitAwarenessPostAdded,
    emitEcoPointsEarned,
    emitCommentAdded,
    emitTyping,
    emitStopTyping,
    requestSystemStats,
    // Notification management
    removeNotification,
    clearNotifications,
    addNotification
  };
};

export default useSocket;