import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useSocketContext } from '../context/SocketContext';

function CarbonFootprint() {
  const { emitCarbonLogAdded, connected } = useSocketContext();
  const [footprintLogs, setFootprintLogs] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalThisWeek: 0,
    totalThisMonth: 0,
    averageDaily: 0,
    breakdown: {}
  });
  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'transport',
    activity: '',
    amount: '',
    unit: 'km',
    notes: ''
  });

  const categories = {
    transport: { icon: '🚗', color: 'blue', units: ['km', 'miles'] },
    energy: { icon: '⚡', color: 'yellow', units: ['kWh', 'therms'] },
    food: { icon: '🍽️', color: 'green', units: ['kg', 'lbs', 'servings'] },
    travel: { icon: '✈️', color: 'red', units: ['km', 'miles'] },
    shopping: { icon: '🛍️', color: 'purple', units: ['items', 'kg'] }
  };

  const activities = {
    transport: ['Car driving', 'Public transport', 'Bus', 'Motorcycle', 'Bicycle'],
    energy: ['Electricity usage', 'Gas heating', 'Air conditioning', 'Electric heating'],
    food: ['Meat consumption', 'Dairy products', 'Local produce', 'Processed foods'],
    travel: ['Flight', 'Train', 'Long distance bus', 'Hotel stay'],
    shopping: ['New clothes', 'Electronics', 'Books', 'Home goods']
  };

  useEffect(() => {
    fetchFootprintLogs();
  }, []);

  const calculateStats = (logs) => {
    console.log('Calculating carbon stats for logs:', logs.length);
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const weekLogs = logs.filter(log => new Date(log.date) >= weekAgo);
    const monthLogs = logs.filter(log => new Date(log.date) >= monthAgo);
    
    const totalThisWeek = weekLogs.reduce((sum, log) => sum + (log.carbonEmission || 0), 0);
    const totalThisMonth = monthLogs.reduce((sum, log) => sum + (log.carbonEmission || 0), 0);
    const totalAll = logs.reduce((sum, log) => sum + (log.carbonEmission || 0), 0);
    const averageDaily = logs.length > 0 ? totalAll / logs.length : 0;
    
    // Calculate breakdown by category
    const breakdown = {};
    logs.forEach(log => {
      if (!breakdown[log.category]) {
        breakdown[log.category] = 0;
      }
      breakdown[log.category] += log.carbonEmission || 0;
    });
    
    console.log('Carbon stats calculated:', {
      totalThisWeek: Math.round(totalThisWeek * 10) / 10,
      totalThisMonth: Math.round(totalThisMonth * 10) / 10,
      averageDaily: Math.round(averageDaily * 10) / 10,
      breakdown
    });
    
    setStats({
      totalThisWeek: Math.round(totalThisWeek * 10) / 10,
      totalThisMonth: Math.round(totalThisMonth * 10) / 10,
      averageDaily: Math.round(averageDaily * 10) / 10,
      breakdown
    });
  };

  const fetchFootprintLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.get('/footprint', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const logs = response.data.logs || [];
      setFootprintLogs(logs);
      calculateStats(logs);
    } catch (error) {
      console.error('Error fetching footprint logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFootprintStats = async () => {
    // This function is no longer needed as we calculate stats from logs
    // Keeping it here in case it's called elsewhere
    return;
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to add carbon footprint logs');
        return;
      }

      const response = await api.post('/footprint', newLog, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Refresh logs from server (this will also recalculate stats)
        await fetchFootprintLogs();
        
        setNewLog({
          date: new Date().toISOString().split('T')[0],
          category: 'transport',
          activity: '',
          amount: '',
          unit: 'km',
          notes: ''
        });
        setShowAddForm(false);
        
        // Emit real-time event
        if (connected) {
          emitCarbonLogAdded({
            activity: newLog.activity,
            amount: newLog.amount,
            unit: newLog.unit,
            category: newLog.category,
            carbonEmission: response.data.log.carbonEmission
          });
        }
        
        alert('Carbon footprint logged successfully!');
      }
    } catch (error) {
      console.error('Error adding footprint log:', error);
      alert(error.response?.data?.message || 'Failed to add footprint log');
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      transport: 'bg-blue-100 text-blue-800',
      energy: 'bg-yellow-100 text-yellow-800',
      food: 'bg-green-100 text-green-800',
      travel: 'bg-red-100 text-red-800',
      shopping: 'bg-purple-100 text-purple-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading carbon footprint data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-green-700">Carbon Footprint Tracking</h1>
          {connected && (
            <span className="flex items-center space-x-1 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Updates</span>
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          {showAddForm ? 'Cancel' : 'Log Activity'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">This Week</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalThisWeek || 0} kg CO₂</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">This Month</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalThisMonth || 0} kg CO₂</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Daily Average</h3>
          <p className="text-3xl font-bold text-green-600">{stats.averageDaily || 0} kg CO₂</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Reduction Goal</h3>
          <p className="text-3xl font-bold text-green-600">-15%</p>
        </div>
      </div>

      {/* Add Log Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">Log Carbon Footprint Activity</h2>
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
                onChange={(e) => {
                  setNewLog({
                    ...newLog, 
                    category: e.target.value,
                    activity: '',
                    unit: categories[e.target.value].units[0]
                  });
                }}
                className="p-3 border border-gray-300 rounded-lg"
              >
                {Object.entries(categories).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.icon} {key.charAt(0).toUpperCase() + key.slice(1)}
                  </option>
                ))}
              </select>
              <select
                value={newLog.activity}
                onChange={(e) => setNewLog({...newLog, activity: e.target.value})}
                className="p-3 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select Activity</option>
                {activities[newLog.category]?.map(activity => (
                  <option key={activity} value={activity}>{activity}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Amount"
                  value={newLog.amount}
                  onChange={(e) => setNewLog({...newLog, amount: e.target.value})}
                  className="flex-1 p-3 border border-gray-300 rounded-lg"
                  min="0"
                  step="0.1"
                  required
                />
                <select
                  value={newLog.unit}
                  onChange={(e) => setNewLog({...newLog, unit: e.target.value})}
                  className="p-3 border border-gray-300 rounded-lg"
                >
                  {categories[newLog.category]?.units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
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
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Log Activity
            </button>
          </form>
        </div>
      )}

      {/* Footprint Logs List */}
      <div className="bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold p-6 border-b">Recent Activities</h2>
        {footprintLogs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No carbon footprint activities logged yet. Start tracking your impact!
          </div>
        ) : (
          <div className="space-y-0">
            {footprintLogs.map((log) => (
              <div key={log._id} className="p-6 border-b border-gray-100 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{categories[log.category]?.icon}</span>
                      <h3 className="text-lg font-semibold">{log.activity}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(log.category)}`}>
                        {log.category}
                      </span>
                    </div>
                    <p className="text-gray-700">{log.description || 'No description provided'}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {log.amount} {log.unit} • {new Date(log.date).toLocaleDateString()}
                    </p>
                    {log.ecoPointsEarned > 0 && (
                      <p className="text-sm text-green-600 font-semibold mt-1">
                        +{log.ecoPointsEarned} eco points
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{log.carbonEmission || 0} kg CO₂</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="mt-8 bg-green-50 p-6 rounded-lg">
        <h3 className="text-lg font-bold text-green-800 mb-4">🌱 Carbon Reduction Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-green-700 mb-2">Transportation</h4>
            <ul className="space-y-1 text-green-600 text-sm">
              <li>• Walk or bike for short distances</li>
              <li>• Use public transportation</li>
              <li>• Carpool when possible</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-green-700 mb-2">Energy</h4>
            <ul className="space-y-1 text-green-600 text-sm">
              <li>• Switch to LED bulbs</li>
              <li>• Unplug devices when not in use</li>
              <li>• Use renewable energy sources</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-green-700 mb-2">Food</h4>
            <ul className="space-y-1 text-green-600 text-sm">
              <li>• Eat more plant-based meals</li>
              <li>• Buy local and seasonal produce</li>
              <li>• Reduce food waste</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-green-700 mb-2">Waste</h4>
            <ul className="space-y-1 text-green-600 text-sm">
              <li>• Recycle properly</li>
              <li>• Compost organic waste</li>
              <li>• Buy products with less packaging</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CarbonFootprint;