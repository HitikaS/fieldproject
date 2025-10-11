import React, { useState, useEffect } from 'react';

const NotificationItem = ({ notification, onRemove }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const timeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return 'now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div
      className={`
        relative p-3 mb-2 rounded-lg border-l-4 transition-all duration-300 hover:shadow-md
        ${getNotificationColor(notification.type)}
        ${notification.priority ? 'ring-2 ring-purple-300 animate-pulse' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          <span className="text-lg flex-shrink-0 mt-0.5">
            {getNotificationIcon(notification.type)}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium break-words">
              {notification.message}
            </p>
            <p className="text-xs opacity-60 mt-1">
              {timeAgo(notification.timestamp)}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => onRemove(notification.id)}
          className="ml-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 flex-shrink-0"
          title="Dismiss notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {notification.priority && (
        <div className="absolute top-0 right-0 w-2 h-2 bg-purple-500 rounded-full animate-ping"></div>
      )}
    </div>
  );
};

const RealTimeNotifications = ({ notifications, onRemove, onClearAll }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(notifications.length);
  }, [notifications]);

  const priorityNotifications = notifications.filter(n => n.priority);
  const regularNotifications = notifications.filter(n => !n.priority);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 w-80 max-w-sm">
      {/* Header */}
      <div className="bg-white rounded-t-lg shadow-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🔔</span>
            <h3 className="font-semibold text-gray-800">
              Live Updates
            </h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {notifications.length > 1 && (
              <button
                onClick={onClearAll}
                className="text-xs text-gray-500 hover:text-red-600 transition-colors duration-200"
                title="Clear all notifications"
              >
                Clear All
              </button>
            )}
            
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              title={isMinimized ? "Expand notifications" : "Minimize notifications"}
            >
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${isMinimized ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Body */}
      {!isMinimized && (
        <div className="bg-white rounded-b-lg shadow-lg border-x border-b border-gray-200 max-h-96 overflow-y-auto">
          <div className="p-3">
            {/* Priority Notifications First */}
            {priorityNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRemove={onRemove}
              />
            ))}
            
            {/* Regular Notifications */}
            {regularNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRemove={onRemove}
              />
            ))}
            
            {notifications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <span className="text-2xl mb-2 block">🌱</span>
                <p className="text-sm">No new updates</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Minimized State */}
      {isMinimized && unreadCount > 0 && (
        <div className="bg-white rounded-b-lg shadow-lg border-x border-b border-gray-200 p-2">
          <div className="text-center text-sm text-gray-600">
            {unreadCount} new update{unreadCount !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeNotifications;