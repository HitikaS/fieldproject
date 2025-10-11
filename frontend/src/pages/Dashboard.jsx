import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import EcoTipCard from '../components/EcoTipCard';

const ecoTips = [
  { tip: 'Walk or bike for short trips to reduce CO₂.', icon: '🚶‍♂️' },
  { tip: 'Take shorter showers to save water.', icon: '🚿' },
  { tip: 'Recycle electronics and clothes.', icon: '♻️' },
  { tip: 'Donate leftover food to NGOs.', icon: '🍲' },
  { tip: 'Switch to LED bulbs for energy savings.', icon: '💡' }
];

function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    carbonFootprint: { total: 0, thisWeek: 0 },
    waterUsage: { total: 0, thisWeek: 0 },
    recyclables: { listed: 0, exchanged: 0 },
    donations: { made: 0, claimed: 0 },
    ecoPoints: 0,
    rank: null
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
    fetchDashboardStats();
    fetchRecentActivity();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.get('/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.get('/users/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Merge with default stats to ensure all properties exist
      const newStats = {
        carbonFootprint: response.data.stats?.carbonFootprint || { total: 0, thisWeek: 0 },
        waterUsage: response.data.stats?.waterUsage || { total: 0, thisWeek: 0 },
        recyclables: response.data.stats?.recyclables || { listed: 0, exchanged: 0 },
        donations: response.data.stats?.donations || { made: 0, claimed: 0 },
        ecoPoints: response.data.stats?.ecoPoints || 0,
        rank: response.data.stats?.rank || null
      };
      
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Keep the default stats if API call fails
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch recent activities from multiple endpoints
      const [footprintRes, waterRes, recyclablesRes, donationsRes] = await Promise.all([
        api.get('/footprint?limit=3', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { logs: [] } })),
        api.get('/water?limit=3', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { logs: [] } })),
        api.get('/recyclables?limit=3', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { recyclables: [] } })),
        api.get('/donations?limit=3', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { donations: [] } }))
      ]);

      const activities = [
        ...(footprintRes.data.logs || []).map(log => ({
          type: 'carbon',
          action: `Logged ${log.activity}`,
          date: log.date,
          icon: '🌱'
        })),
        ...(waterRes.data.logs || []).map(log => ({
          type: 'water',
          action: `Logged ${log.usage}L water usage`,
          date: log.date,
          icon: '💧'
        })),
        ...(recyclablesRes.data.recyclables || []).map(item => ({
          type: 'recyclable',
          action: `Listed ${item.title}`,
          date: item.createdAt,
          icon: '♻️'
        })),
        ...(donationsRes.data.donations || []).map(donation => ({
          type: 'donation',
          action: `Donated ${donation.title}`,
          date: donation.createdAt,
          icon: '🤝'
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

      setRecentActivity(activities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // If no user and not loading, show login prompt
  if (!user && !loading) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-700 mb-4">Welcome to Sustainable Lifestyle! 🌱</h1>
          <p className="text-gray-600 mb-8">Please log in to access your personalized dashboard.</p>
          <Link 
            to="/login" 
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Login to Continue
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-green-700 mb-4">Welcome to Sustainable Lifestyle Companion</h1>
        <p className="mb-6 text-gray-600">Track your carbon and water footprint, exchange recyclables, donate items, and learn how to live sustainably!</p>
        
        <div className="bg-blue-50 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold text-blue-800 mb-4">Get Started Today!</h2>
          <p className="text-blue-700 mb-4">Join our community of eco-warriors and start making a positive impact.</p>
          <div className="flex gap-4">
            <Link to="/register" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
              Create Account
            </Link>
            <Link to="/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              Sign In
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {ecoTips.map((tip, idx) => (
            <EcoTipCard key={idx} tip={tip.tip} icon={tip.icon} />
          ))}
        </div>

        <div className="bg-green-100 rounded-lg p-4 text-green-900">
          <strong>What You Can Do:</strong>
          <ul className="list-disc ml-6 mt-2">
            <li>Track your carbon footprint and water usage</li>
            <li>List items for recycling and find eco-friendly exchanges</li>
            <li>Donate items to NGOs and help your community</li>
            <li>Read awareness posts and learn sustainable practices</li>
            <li>Earn eco-points and compete on the leaderboard</li>
            <li>Join a community of environmentally conscious users</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-700 mb-2">
          Welcome back, {user?.fullName || user?.username || 'Guest'}! 👋
        </h1>
        <p className="text-gray-600">Here's your environmental impact summary</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-green-400 to-green-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Eco Points</p>
              <p className="text-3xl font-bold">{user?.ecoPoints || 0}</p>
            </div>
            <div className="text-4xl">🏆</div>
          </div>
          <Link to="/leaderboard" className="text-green-100 hover:text-white text-sm underline">
            View Leaderboard →
          </Link>
        </div>

        <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Water Usage</p>
              <p className="text-3xl font-bold">{stats?.waterUsage?.thisWeek || 0}L</p>
              <p className="text-blue-100 text-sm">This week</p>
            </div>
            <div className="text-4xl">💧</div>
          </div>
          <Link to="/water" className="text-blue-100 hover:text-white text-sm underline">
            Track Water →
          </Link>
        </div>

        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100">Carbon Footprint</p>
              <p className="text-3xl font-bold">{stats?.carbonFootprint?.thisWeek || 0}</p>
              <p className="text-yellow-100 text-sm">kg CO₂ this week</p>
            </div>
            <div className="text-4xl">🌱</div>
          </div>
          <Link to="/carbon" className="text-yellow-100 hover:text-white text-sm underline">
            Track Carbon →
          </Link>
        </div>

        <div className="bg-gradient-to-r from-purple-400 to-purple-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Items Recycled</p>
              <p className="text-3xl font-bold">{stats?.recyclables?.listed || 0}</p>
              <p className="text-purple-100 text-sm">Total listed</p>
            </div>
            <div className="text-4xl">♻️</div>
          </div>
          <Link to="/recyclables" className="text-purple-100 hover:text-white text-sm underline">
            View Exchange →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/carbon" className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <div className="text-3xl mb-2">🌱</div>
            <span className="text-sm text-gray-700">Log Carbon</span>
          </Link>
          <Link to="/water" className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <div className="text-3xl mb-2">💧</div>
            <span className="text-sm text-gray-700">Log Water</span>
          </Link>
          <Link to="/recyclables" className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <div className="text-3xl mb-2">♻️</div>
            <span className="text-sm text-gray-700">Add Item</span>
          </Link>
          <Link to="/donations" className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
            <div className="text-3xl mb-2">🤝</div>
            <span className="text-sm text-gray-700">Donate</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity & Eco Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-gray-500">No recent activity. Start tracking your eco-actions!</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl">{activity.icon}</div>
                  <div className="flex-1">
                    <p className="text-gray-800">{activity.action}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Eco Tips */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Daily Eco Tips</h2>
          <div className="space-y-3">
            {ecoTips.slice(0, 3).map((tip, idx) => (
              <EcoTipCard key={idx} tip={tip.tip} icon={tip.icon} />
            ))}
          </div>
          <Link to="/awareness" className="text-green-600 hover:text-green-700 text-sm underline mt-4 block">
            Read more tips →
          </Link>
        </div>
      </div>

      {/* Environmental Impact Summary */}
      <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-4">🌍 Your Environmental Impact</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-2">🌱</div>
            <h3 className="font-bold text-gray-700">Carbon Footprint</h3>
            <p className="text-sm text-gray-600">Total: {stats.carbonFootprint.total} kg CO₂</p>
            <p className="text-xs text-gray-500">Keep tracking to reduce your impact!</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">💧</div>
            <h3 className="font-bold text-gray-700">Water Conservation</h3>
            <p className="text-sm text-gray-600">Total tracked: {stats.waterUsage.total}L</p>
            <p className="text-xs text-gray-500">Every drop counts!</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🤝</div>
            <h3 className="font-bold text-gray-700">Community Impact</h3>
            <p className="text-sm text-gray-600">{stats.donations.made} donations made</p>
            <p className="text-xs text-gray-500">Thank you for giving back!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;