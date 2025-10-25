import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function RecyclableExchange() {
  const [recyclables, setRecyclables] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedItemContact, setSelectedItemContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category: 'electronics',
    condition: 'good',
    quantity: 1,
    location: { city: '', state: '' },
    images: []
  });

  const categories = ['electronics', 'clothing', 'furniture', 'books', 'toys', 'appliances', 'other'];
  const conditions = ['excellent', 'good', 'fair', 'poor'];

  useEffect(() => {
    fetchRecyclables();
  }, []);

  const fetchRecyclables = async () => {
    try {
      const response = await api.get('/recyclables');
      setRecyclables(response.data.recyclables || []);
    } catch (error) {
      console.error('Error fetching recyclables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    console.log('Adding recyclable item:', newItem);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to add items');
        return;
      }

      console.log('Sending request to API...');
      const response = await api.post('/recyclables', newItem, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('API Response:', response.data);
      if (response.data.success) {
        setRecyclables([response.data.recyclable, ...recyclables]);
        setNewItem({
          title: '',
          description: '',
          category: 'electronics',
          condition: 'good',
          quantity: 1,
          location: { city: '', state: '' },
          images: []
        });
        setShowAddForm(false);
        alert('Item added successfully!');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      console.error('Error response:', error.response?.data);
      alert(error.response?.data?.message || 'Failed to add item');
    }
  };

  const handleContactSeller = async (item) => {
    try {
      // Fetch the full item details to get contact info
      const token = localStorage.getItem('token');
      const response = await api.get(`/recyclables/${item._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const itemDetails = response.data.recyclable;
      const contactInfo = itemDetails.contactInfo;
      
      // Use default phone number if no phone is available
      const phoneNumber = contactInfo?.phone || '931234567';
      
      // Set the contact info and show modal
      setSelectedItemContact({
        title: item.title,
        phone: phoneNumber,
        preferredTime: contactInfo?.preferredTime
      });
      setShowContactModal(true);
    } catch (error) {
      console.error('Error fetching contact info:', error);
      alert('Unable to get contact information. Please try again later.');
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`${type} copied to clipboard!`);
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy. Please try again.');
    });
  };

  const filteredRecyclables = recyclables.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading recyclables...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700">Recyclable Exchange</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          {showAddForm ? 'Cancel' : 'Add Item'}
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 p-3 border border-gray-300 rounded-lg"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-3 border border-gray-300 rounded-lg"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">Add New Recyclable Item</h2>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Item Title"
                value={newItem.title}
                onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                className="p-3 border border-gray-300 rounded-lg"
                required
              />
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                className="p-3 border border-gray-300 rounded-lg"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              <select
                value={newItem.condition}
                onChange={(e) => setNewItem({...newItem, condition: e.target.value})}
                className="p-3 border border-gray-300 rounded-lg"
              >
                {conditions.map(condition => (
                  <option key={condition} value={condition}>
                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Quantity"
                value={newItem.quantity}
                onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value)})}
                className="p-3 border border-gray-300 rounded-lg"
                min="1"
                required
              />
              <input
                type="text"
                placeholder="City"
                value={newItem.location.city}
                onChange={(e) => setNewItem({...newItem, location: {...newItem.location, city: e.target.value}})}
                className="p-3 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="State"
                value={newItem.location.state}
                onChange={(e) => setNewItem({...newItem, location: {...newItem.location, state: e.target.value}})}
                className="p-3 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <textarea
              placeholder="Description"
              value={newItem.description}
              onChange={(e) => setNewItem({...newItem, description: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg"
              rows="3"
              required
            />
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Add Item
            </button>
          </form>
        </div>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecyclables.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No recyclable items found. Be the first to add one!</p>
          </div>
        ) : (
          filteredRecyclables.map((item) => (
            <div key={item._id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600">
                  {item.category.charAt(0).toUpperCase() + item.category.slice(1)} • {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                </p>
              </div>
              <p className="text-gray-700 mb-4">{item.description}</p>
              <div className="text-sm text-gray-600 mb-4">
                <p>Quantity: {item.quantity}</p>
                <p>Location: {item.location?.city}, {item.location?.state}</p>
                <p>Listed: {new Date(item.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex justify-between items-center">
                <span className={`px-2 py-1 rounded text-xs ${
                  item.availability === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {item.availability === 'available' ? 'Available' : 'Not Available'}
                </span>
                {item.availability === 'available' && (
                  <button
                    onClick={() => handleContactSeller(item)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Contact
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Contact Modal */}
      {showContactModal && selectedItemContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Contact Seller</h2>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Item: {selectedItemContact.title}
              </h3>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-600">📞 Phone Number</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-mono font-semibold text-gray-800">
                    {selectedItemContact.phone}
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedItemContact.phone, 'Phone number')}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {selectedItemContact.preferredTime && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <span className="text-sm font-semibold text-gray-600">⏰ Best Time to Contact</span>
                  <p className="text-gray-800 mt-1">{selectedItemContact.preferredTime}</p>
                </div>
              )}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowContactModal(false)}
                className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecyclableExchange;