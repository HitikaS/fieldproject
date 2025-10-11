import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import io from 'socket.io-client';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState('all-time');
  const [currentUser, setCurrentUser] = useState(null);
  const [socket, setSocket] = useState(null);

  const timeFrames = {
    'all-time': 'All Time',
    'monthly': 'This Month',
    'weekly': 'This Week'
  };

  useEffect(() => {
    fetchLeaderboard();
    getCurrentUser();
    initializeSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [timeFrame]);

  const initializeSocket = () => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('leaderboardUpdate', (data) => {
      setLeaderboard(data.leaderboard);
    });

    newSocket.on('connect', () => {
      console.log('Connected to leaderboard updates');
    });

    return () => newSocket.close();
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get(`/users/leaderboard?timeFrame=${timeFrame}`);
      setLeaderboard(response.data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.get('/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏆';
    }
  };

  const getProgressBarColor = (rank) => {
    switch (rank) {
      case 1: return 'bg-yellow-400';
      case 2: return 'bg-gray-400';
      case 3: return 'bg-amber-600';
      default: return 'bg-green-400';
    }
  };

  const getCurrentUserRank = () => {
    if (!currentUser) return null;
    const userIndex = leaderboard.findIndex(user => user._id === currentUser._id);
    return userIndex >= 0 ? userIndex + 1 : null;
  };

  const maxPoints = leaderboard.length > 0 ? leaderboard[0].ecoPoints : 1;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700">🏆 Eco Leaderboard</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">🔴 Live Updates</span>
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Time Frame Selector */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {Object.entries(timeFrames).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTimeFrame(key)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeFrame === key
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Current User Stats */}
      {currentUser && (
        <div className="bg-gradient-to-r from-green-100 to-blue-100 p-6 rounded-lg mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Your Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{currentUser.ecoPoints || 0}</p>
              <p className="text-sm text-gray-600">Eco Points</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">#{getCurrentUserRank() || 'N/A'}</p>
              <p className="text-sm text-gray-600">Current Rank</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{currentUser.badges?.length || 0}</p>
              <p className="text-sm text-gray-600">Badges Earned</p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-green-600 text-white p-4">
          <h2 className="text-xl font-bold">Top Eco Warriors - {timeFrames[timeFrame]}</h2>
        </div>
        
        {leaderboard.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No data available for the selected time frame.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {leaderboard.map((user, index) => {
              const rank = index + 1;
              const isCurrentUser = currentUser && user._id === currentUser._id;
              const progressPercentage = (user.ecoPoints / maxPoints) * 100;
              const uniqueKey = user._id || `user-${index}-${user.username || 'unknown'}`;

              return (
                <div
                  key={uniqueKey}
                  className={`p-4 border-b border-gray-100 last:border-b-0 ${
                    isCurrentUser ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                  } ${rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-white' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[3rem]">
                        <div className="text-2xl">{getRankIcon(rank)}</div>
                        <div className="text-sm font-bold text-gray-600">#{rank}</div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">
                            {user.fullName || user.username}
                          </h3>
                          {isCurrentUser && (
                            <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                              You
                            </span>
                          )}
                          {user.badges && user.badges.length > 0 && (
                            <div className="flex gap-1">
                              {user.badges.slice(0, 3).map((badge, i) => (
                                <span key={`${user._id}-badge-${i}`} className="text-xs">🏅</span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>📍 {user.location?.city || 'Unknown'}</span>
                          <span>📅 Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(rank)}`}
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {user.ecoPoints || 0}
                      </div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Achievement Categories */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <div className="text-2xl mb-2">♻️</div>
          <h3 className="font-bold text-gray-800">Recycling Champion</h3>
          <p className="text-sm text-gray-600">Most items recycled</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <div className="text-2xl mb-2">💧</div>
          <h3 className="font-bold text-gray-800">Water Saver</h3>
          <p className="text-sm text-gray-600">Best water conservation</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <div className="text-2xl mb-2">🌱</div>
          <h3 className="font-bold text-gray-800">Carbon Fighter</h3>
          <p className="text-sm text-gray-600">Lowest carbon footprint</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <div className="text-2xl mb-2">🤝</div>
          <h3 className="font-bold text-gray-800">Community Helper</h3>
          <p className="text-sm text-gray-600">Most donations made</p>
        </div>
      </div>

      {/* Point System Info */}
      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-bold text-blue-800 mb-4">🎯 How to Earn Eco Points</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-blue-700 mb-2">Actions</h4>
            <ul className="space-y-1 text-blue-600">
              <li>• Log water usage: +5 points</li>
              <li>• Track carbon footprint: +10 points</li>
              <li>• Add recyclable item: +15 points</li>
              <li>• Make donation: +20 points</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-blue-700 mb-2">Achievements</h4>
            <ul className="space-y-1 text-blue-600">
              <li>• Daily activity streak: +50 points</li>
              <li>• Monthly challenge completion: +100 points</li>
              <li>• Community engagement: +25 points</li>
              <li>• Efficiency improvements: +30 points</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;