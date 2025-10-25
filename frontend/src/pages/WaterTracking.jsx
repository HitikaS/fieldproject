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
    efficiency: 'average'
  });

  const categories = ['shower', 'dishes', 'laundry', 'garden', 'drinking', 'other'];
  const efficiencyLevels = ['excellent', 'good', 'average', 'poor'];

  useEffect(() => {
    const loadData = async () => {
      await fetchWaterLogs();
      // Stats are calculated automatically in fetchWaterLogs
    };
    loadData();
  }, []);

  const fetchWaterLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.get('/water', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const logs = response.data.logs || [];
      setWaterLogs(logs);
      
      // Calculate stats from logs
      calculateStats(logs);
    } catch (error) {
      console.error('Error fetching water logs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateStats = (logs) => {
    console.log('Calculating stats for logs:', logs.length);
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const weekLogs = logs.filter(log => new Date(log.date) >= weekAgo);
    const monthLogs = logs.filter(log => new Date(log.date) >= monthAgo);
    
    console.log('Week logs:', weekLogs.length, 'Month logs:', monthLogs.length);
    
    const totalThisWeek = weekLogs.reduce((sum, log) => {
      const amount = log.unit === 'gallons' ? log.amount * 3.78541 : log.amount;
      return sum + amount;
    }, 0);
    
    const totalThisMonth = monthLogs.reduce((sum, log) => {
      const amount = log.unit === 'gallons' ? log.amount * 3.78541 : log.amount;
      return sum + amount;
    }, 0);
    
    const totalAll = logs.reduce((sum, log) => {
      const amount = log.unit === 'gallons' ? log.amount * 3.78541 : log.amount;
      return sum + amount;
    }, 0);
    
    const averageDaily = logs.length > 0 ? totalAll / logs.length : 0;
    
    // Calculate efficiency percentage based on excellent/good logs
    const excellentCount = logs.filter(log => log.efficiency === 'excellent').length;
    const goodCount = logs.filter(log => log.efficiency === 'good').length;
    const efficiency = logs.length > 0 ? Math.round(((excellentCount + goodCount) / logs.length) * 100) : 0;
    
    console.log('Stats calculated:', {
      totalThisWeek: Math.round(totalThisWeek * 10) / 10,
      totalThisMonth: Math.round(totalThisMonth * 10) / 10,
      averageDaily: Math.round(averageDaily * 10) / 10,
      efficiency: efficiency
    });
    
    setStats({
      totalThisWeek: Math.round(totalThisWeek * 10) / 10,
      totalThisMonth: Math.round(totalThisMonth * 10) / 10,
      averageDaily: Math.round(averageDaily * 10) / 10,
      efficiency: efficiency
    });
  };

  const fetchWaterStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.get('/water/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const backendStats = response.data.stats || {};
      
      // Calculate time-based stats from the logs
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const weekLogs = waterLogs.filter(log => new Date(log.date) >= weekAgo);
      const monthLogs = waterLogs.filter(log => new Date(log.date) >= monthAgo);
      
      const totalThisWeek = weekLogs.reduce((sum, log) => {
        const amount = log.unit === 'gallons' ? log.amount * 3.78541 : log.amount;
        return sum + amount;
      }, 0);
      
      const totalThisMonth = monthLogs.reduce((sum, log) => {
        const amount = log.unit === 'gallons' ? log.amount * 3.78541 : log.amount;
        return sum + amount;
      }, 0);
      
      const averageDaily = waterLogs.length > 0 ? (backendStats.totalUsage || 0) / Math.max(waterLogs.length, 1) : 0;
      
      setStats({
        totalThisWeek: Math.round(totalThisWeek * 10) / 10,
        totalThisMonth: Math.round(totalThisMonth * 10) / 10,
        averageDaily: Math.round(averageDaily * 10) / 10,
        efficiency: backendStats.efficiencyScore || 0
      });
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

      console.log('Water log response:', response.data);

      if (response.data.success) {
        // Refresh the logs list from server (this will also recalculate stats)
        await fetchWaterLogs();
        
        // Reset form
        setNewLog({
          date: new Date().toISOString().split('T')[0],
          category: 'shower',
          activity: '',
          amount: '',
          unit: 'liters',
          notes: '',
          efficiency: 'average'
        });
        setShowAddForm(false);
        alert('Water usage logged successfully!');
      } else {
        alert('Failed to add water log');
      }
    } catch (error) {
      console.error('Error adding water log:', error);
      console.error('Error details:', error.response?.data);
      
      // Still refresh the list in case it was actually saved
      await fetchWaterLogs();
      
      alert(error.response?.data?.message || 'Failed to add water log. However, it may have been saved - please check your logs.');
    }
  };

  const getEfficiencyColor = (efficiency) => {
    switch (efficiency) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'average': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
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
          <p className="text-3xl font-bold text-blue-600">{stats.totalThisWeek || 0} L</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">This Month</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalThisMonth || 0} L</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Daily Average</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.averageDaily || 0} L</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Efficiency</h3>
          <p className="text-3xl font-bold text-green-600">{stats.efficiency || 0}%</p>
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
                    <p className="text-gray-700">{log.activity || log.notes || 'No description provided'}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(log.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{log.amount} {log.unit === 'liters' ? 'L' : 'gal'}</p>
                    {log.ecoPointsEarned > 0 && (
                      <p className="text-sm text-green-600">+{log.ecoPointsEarned} eco points</p>
                    )}
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