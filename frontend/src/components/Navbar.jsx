import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Get user data from localStorage or verify token
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
    window.location.reload(); // Force refresh to update state
  };

  return (
    <nav className="bg-green-700 text-white px-4 py-2 shadow">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/" className="font-bold text-xl tracking-wide">🌱 Sustainable Lifestyle</Link>
        
        <div className="hidden md:flex space-x-6">
          <Link to="/recyclables" className="hover:text-green-200 transition-colors">♻️ Recyclables</Link>
          <Link to="/donations" className="hover:text-green-200 transition-colors">🤝 Donations</Link>
          <Link to="/water" className="hover:text-green-200 transition-colors">💧 Water</Link>
          <Link to="/carbon" className="hover:text-green-200 transition-colors">🌱 Carbon</Link>
          <Link to="/awareness" className="hover:text-green-200 transition-colors">📚 Awareness</Link>
          <Link to="/leaderboard" className="hover:text-green-200 transition-colors">🏆 Leaderboard</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className="hover:text-green-200 transition-colors bg-red-600 px-2 py-1 rounded">
              👑 Admin
            </Link>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-green-100">
                Welcome, {user.fullName || user.username}!
              </span>
              {user.role === 'admin' && (
                <span className="bg-red-600 px-2 py-1 rounded text-sm font-bold">
                  👑 ADMIN
                </span>
              )}
              <span className="bg-green-600 px-2 py-1 rounded text-sm">
                {user.ecoPoints || 0} points
              </span>
              <button
                onClick={handleLogout}
                className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="space-x-2">
              <Link
                to="/login"
                className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button - you can implement a hamburger menu here */}
        <div className="md:hidden">
          <button className="text-white">☰</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;