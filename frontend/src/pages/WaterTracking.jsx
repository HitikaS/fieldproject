import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function WaterTracking() {
  const [waterLogs, setWaterLogs] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalThisWeek: 0,
    totalThisMonth: 0,
    averageDaily: 0,
    efficiency: 0
  });
  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'shower',
    activity: '',
    amount: '',
    unit: 'liters',
    notes: '',
    efficiency: 'medium'
  });

  const categories = ['shower', 'dishes', 'laundry', 'garden', 'drinking', 'other'];
  const efficiencyLevels = ['high', 'medium', 'low'];

  useEffect(() => {
    fetchWaterLogs();
    fetchWaterStats();
  }, []);

  const fetchWaterLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.get('/water', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWaterLogs(response.data.logs || []);
    } catch (error) {
      console.error('Error fetching water logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWaterStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.get('/water/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats || stats);
    } catch (error) {
      console.error('Error fetching water stats:', error);
    }
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to add water logs');
        return;
      }

      const response = await api.post('/water', newLog, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setWaterLogs([response.data.log, ...waterLogs]);
        setNewLog({
          date: new Date().toISOString().split('T')[0],
          category: 'shower',
          activity: '',
          amount: '',
          unit: 'liters',
          notes: '',
          efficiency: 'medium'
        });
        setShowAddForm(false);
        fetchWaterStats(); // Refresh stats
        alert('Water usage logged successfully!');
      }
    } catch (error) {
      console.error('Error adding water log:', error);
      alert(error.response?.data?.message || 'Failed to add water log');
    }
  };

  const getEfficiencyColor = (efficiency) => {
    switch (efficiency) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'shower': return '🚿';
      case 'dishes': return '�️';
      case 'laundry': return '👕';
      case 'garden': return '🌱';
      case 'drinking': return '🥤';
      default: return '💧';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading water usage data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-700">Water Usage Tracking</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {showAddForm ? 'Cancel' : 'Log Usage'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">This Week</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalThisWeek} L</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">This Month</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalThisMonth} L</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Daily Average</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.averageDaily} L</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Efficiency</h3>
          <p className="text-3xl font-bold text-green-600">{stats.efficiency}%</p>
        </div>
      </div>

      {/* Add Log Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">Log Water Usage</h2>
          <form onSubmit={handleAddLog} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="date"
                value={newLog.date}
                onChange={(e) => setNewLog({...newLog, date: e.target.value})}
                className="p-3 border border-gray-300 rounded-lg"
                required
              />
              <select
                value={newLog.category}
                onChange={(e) => setNewLog({...newLog, category: e.target.value})}
                className="p-3 border border-gray-300 rounded-lg"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Activity (e.g., shower, dishes)"
                value={newLog.activity}
                onChange={(e) => setNewLog({...newLog, activity: e.target.value})}
                className="p-3 border border-gray-300 rounded-lg"
                required
              />
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Amount"
                  value={newLog.amount}
                  onChange={(e) => setNewLog({...newLog, amount: e.target.value})}
                  className="p-3 border border-gray-300 rounded-lg flex-1"
                  min="0"
                  step="0.1"
                  required
                />
                <select
                  value={newLog.unit}
                  onChange={(e) => setNewLog({...newLog, unit: e.target.value})}
                  className="p-3 border border-gray-300 rounded-lg"
                >
                  <option value="liters">Liters</option>
                  <option value="gallons">Gallons</option>
                </select>
              </div>
              <select
                value={newLog.efficiency}
                onChange={(e) => setNewLog({...newLog, efficiency: e.target.value})}
                className="p-3 border border-gray-300 rounded-lg"
              >
                {efficiencyLevels.map(efficiency => (
                  <option key={efficiency} value={efficiency}>
                    {efficiency.charAt(0).toUpperCase() + efficiency.slice(1)} Efficiency
                  </option>
                ))}
              </select>
            </div>
            <textarea
              placeholder="Notes (optional)"
              value={newLog.notes}
              onChange={(e) => setNewLog({...newLog, notes: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg"
              rows="2"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Log Usage
            </button>
          </form>
        </div>
      )}

      {/* Water Logs List */}
      <div className="bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold p-6 border-b">Recent Water Usage</h2>
        {waterLogs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No water usage logged yet. Start tracking your consumption!
          </div>
        ) : (
          <div className="space-y-0">
            {waterLogs.map((log) => (
              <div key={log._id} className="p-6 border-b border-gray-100 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getCategoryIcon(log.category)}</span>
                      <h3 className="text-lg font-semibold capitalize">{log.category}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${getEfficiencyColor(log.efficiency)}`}>
                        {log.efficiency} efficiency
                      </span>
                    </div>
                    <p className="text-gray-700">{log.description || 'No description provided'}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(log.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{log.usage} L</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-bold text-blue-800 mb-4">💡 Water Saving Tips</h3>
        <ul className="space-y-2 text-blue-700">
          <li>• Take shorter showers to save 2-3 liters per minute</li>
          <li>• Fix leaky taps - a single drip can waste 15 liters per day</li>
          <li>• Use a bucket instead of a hose for washing cars</li>
          <li>• Install water-efficient fixtures and appliances</li>
          <li>• Collect rainwater for gardening</li>
        </ul>
      </div>
    </div>
  );
}

export default WaterTracking;