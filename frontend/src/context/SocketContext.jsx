import React, { createContext, useContext, useEffect, useState } from 'react';
import useSocket from '../hooks/useSocket';
import RealTimeNotifications from '../components/RealTimeNotifications';

const SocketContext = createContext();

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const {
    socket,
    connected,
    notifications,
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
    removeNotification,
    clearNotifications,
    addNotification
  } = useSocket();

  const [showNotifications, setShowNotifications] = useState(true);

  // Connection status indicator
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    if (connected) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [connected]);

  // Auto-hide notifications when user is active
  useEffect(() => {
    let timer;
    const handleUserActivity = () => {
      setShowNotifications(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        setShowNotifications(false);
      }, 30000); // Hide after 30 seconds of inactivity
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
      clearTimeout(timer);
    };
  }, []);

  const contextValue = {
    socket,
    connected,
    connectionStatus,
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
    addNotification,
    
    // UI controls
    showNotifications,
    setShowNotifications
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
      
      {/* Connection Status Indicator */}
      <div className="fixed bottom-4 left-4 z-40">
        <div
          className={`
            flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-300
            ${connected 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
            }
          `}
        >
          <div
            className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}
            `}
          />
          <span>
            {connected ? 'Live Updates Active' : 'Reconnecting...'}
          </span>
        </div>
      </div>
      
      {/* Real-time Notifications */}
      {showNotifications && notifications.length > 0 && (
        <RealTimeNotifications
          notifications={notifications}
          onRemove={removeNotification}
          onClearAll={clearNotifications}
        />
      )}
      
      {/* Floating notification toggle */}
      {!showNotifications && notifications.length > 0 && (
        <button
          onClick={() => setShowNotifications(true)}
          className="fixed top-20 right-4 z-50 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors duration-200"
          title={`${notifications.length} new notification${notifications.length !== 1 ? 's' : ''}`}
        >
          <div className="relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-12a3 3 0 0 1 6 0v12z" />
            </svg>
            {notifications.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </div>
        </button>
      )}
    </SocketContext.Provider>
  );
};

export default SocketProvider;