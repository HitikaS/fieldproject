import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useSocketContext } from '../context/SocketContext';

function DonationBoard() {
  const { emitDonationAdded, emitDonationClaimed, connected } = useSocketContext();
  const [donations, setDonations] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState('');
  const [newDonation, setNewDonation] = useState({
    title: '',
    description: '',
    category: 'food',
    urgency: 'medium',
    quantity: 1,
    location: { city: '', state: '', address: '' },
    expiryDate: '',
    contactInfo: { name: '', phone: '', email: '' }
  });

  const categories = ['food', 'clothing', 'books', 'toys', 'household', 'medical', 'other'];
  const urgencyLevels = ['low', 'medium', 'high', 'urgent'];

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const response = await api.get('/donations');
      setDonations(response.data.donations || []);
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDonation = async (e) => {
    e.preventDefault();
    console.log('Form submitted, newDonation:', newDonation);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to add donations');
        return;
      }

      console.log('Sending request to API with token:', token ? 'Token exists' : 'No token');
      const response = await api.post('/donations', newDonation, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('API Response:', response.data);
      if (response.data.success) {
        setDonations([response.data.donation, ...donations]);
        setNewDonation({
          title: '',
          description: '',
          category: 'food',
          urgency: 'medium',
          quantity: 1,
          location: { city: '', state: '', address: '' },
          expiryDate: '',
          contactInfo: { name: '', phone: '', email: '' }
        });
        setShowAddForm(false);
        
        // Emit real-time event
        if (connected) {
          emitDonationAdded({
            title: newDonation.title,
            category: newDonation.category,
            urgency: newDonation.urgency,
            location: newDonation.location
          });
        }
        
        alert('Donation added successfully!');
      }
    } catch (error) {
      console.error('Error adding donation:', error);
      console.error('Error response:', error.response?.data);
      alert(error.response?.data?.message || 'Failed to add donation');
    }
  };

  const handleClaimDonation = async (donationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to claim donations');
        return;
      }

      const response = await api.put(`/donations/${donationId}/claim`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const claimedDonation = donations.find(d => d._id === donationId);
        setDonations(donations.map(donation => 
          donation._id === donationId 
            ? { ...donation, availability: 'claimed' }
            : donation
        ));
        
        // Emit real-time event
        if (connected && claimedDonation) {
          emitDonationClaimed({
            donationId,
            title: claimedDonation.title,
            category: claimedDonation.category
          });
        }
        
        alert('Donation claimed successfully!');
      }
    } catch (error) {
      console.error('Error claiming donation:', error);
      alert(error.response?.data?.message || 'Failed to claim donation');
    }
  };

  const filteredDonations = donations.filter(donation => {
    const matchesSearch = donation.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donation.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || donation.category === selectedCategory;
    const matchesUrgency = !selectedUrgency || donation.urgency === selectedUrgency;
    return matchesSearch && matchesCategory && matchesUrgency;
  });

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading donations...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700">Donation Board</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          {showAddForm ? 'Cancel' : 'Add Donation'}
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search donations..."
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
        <select
          value={selectedUrgency}
          onChange={(e) => setSelectedUrgency(e.target.value)}
          className="p-3 border border-gray-300 rounded-lg"
        >
          <option value="">All Urgency</option>
          {urgencyLevels.map(urgency => (
            <option key={urgency} value={urgency}>
              {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Add Donation Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">Add New Donation</h2>
          <form onSubmit={handleAddDonation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Donation Title"
                value={newDonation.title}
                onChange={(e) => setNewDonation({...newDonation, title: e.target.value})}
                className="p-3 border border-gray-300 rounded-lg"
                required
              />
              <select
                value={newDonation.category}
                onChange={(e) => setNewDonation({...newDonation, category: e.target.value})}
                className="p-3 border border-gray-300 rounded-lg"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              <select
                value={newDonation.urgency}
                onChange={(e) => setNewDonation({...newDonation, urgency: e.target.value})}
                className="p-3 border border-gray-300 rounded-lg"
              >
                {urgencyLevels.map(urgency => (
                  <option key={urgency} value={urgency}>
                    {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Quantity"
                value={newDonation.quantity}
                onChange={(e) => setNewDonation({...newDonation, quantity: parseInt(e.target.value)})}
                className="p-3 border border-gray-300 rounded-lg"
                min="1"
                required
              />
              <input
                type="date"
                placeholder="Expiry Date (if applicable)"
                value={newDonation.expiryDate}
                onChange={(e) => setNewDonation({...newDonation, expiryDate: e.target.value})}
                className="p-3 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Contact Name"
                value={newDonation.contactInfo.name}
                onChange={(e) => setNewDonation({...newDonation, contactInfo: {...newDonation.contactInfo, name: e.target.value}})}
                className="p-3 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="tel"
                placeholder="Contact Phone"
                value={newDonation.contactInfo.phone}
                onChange={(e) => setNewDonation({...newDonation, contactInfo: {...newDonation.contactInfo, phone: e.target.value}})}
                className="p-3 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="email"
                placeholder="Contact Email"
                value={newDonation.contactInfo.email}
                onChange={(e) => setNewDonation({...newDonation, contactInfo: {...newDonation.contactInfo, email: e.target.value}})}
                className="p-3 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="City"
                value={newDonation.location.city}
                onChange={(e) => setNewDonation({...newDonation, location: {...newDonation.location, city: e.target.value}})}
                className="p-3 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="State"
                value={newDonation.location.state}
                onChange={(e) => setNewDonation({...newDonation, location: {...newDonation.location, state: e.target.value}})}
                className="p-3 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <input
              type="text"
              placeholder="Address"
              value={newDonation.location.address}
              onChange={(e) => setNewDonation({...newDonation, location: {...newDonation.location, address: e.target.value}})}
              className="w-full p-3 border border-gray-300 rounded-lg"
              required
            />
            <textarea
              placeholder="Description"
              value={newDonation.description}
              onChange={(e) => setNewDonation({...newDonation, description: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg"
              rows="3"
              required
            />
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Add Donation
            </button>
          </form>
        </div>
      )}

      {/* Donations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDonations.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No donations found. Be the first to add one!</p>
          </div>
        ) : (
          filteredDonations.map((donation) => (
            <div key={donation._id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">{donation.title}</h3>
                <p className="text-sm text-gray-600">{donation.category}</p>
              </div>
              
              <div className="mb-4">
                <span className={`px-2 py-1 rounded text-xs border ${getUrgencyColor(donation.urgency)}`}>
                  {donation.urgency.charAt(0).toUpperCase() + donation.urgency.slice(1)} Priority
                </span>
                {isExpiringSoon(donation.expiryDate) && (
                  <span className="ml-2 px-2 py-1 rounded text-xs bg-red-100 text-red-800 border border-red-300">
                    Expires Soon!
                  </span>
                )}
              </div>

              <p className="text-gray-700 mb-4">{donation.description}</p>
              
              <div className="text-sm text-gray-600 mb-4">
                <p>Quantity: {donation.quantity}</p>
                <p>Location: {donation.location?.city}, {donation.location?.state}</p>
                {donation.expiryDate && (
                  <p>Expires: {new Date(donation.expiryDate).toLocaleDateString()}</p>
                )}
                <p>Contact: {donation.contactInfo?.name}</p>
                <p>Phone: {donation.contactInfo?.phone}</p>
                <p>Posted: {new Date(donation.createdAt).toLocaleDateString()}</p>
              </div>
              
              <div className="flex justify-between items-center">
                <span className={`px-2 py-1 rounded text-xs ${
                  donation.availability === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {donation.availability === 'available' ? 'Available' : 'Claimed'}
                </span>
                {donation.availability === 'available' && (
                  <button
                    onClick={() => handleClaimDonation(donation._id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Claim
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DonationBoard;