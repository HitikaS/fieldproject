import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import RecyclableExchange from './pages/RecyclableExchange';
import DonationBoard from './pages/DonationBoard';
import AwarenessHub from './pages/AwarenessHub';
import Leaderboard from './pages/Leaderboard';
import WaterTracking from './pages/WaterTracking';
import CarbonFootprint from './pages/CarbonFootprint';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <Router>
      <SocketProvider>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/recyclables" element={<RecyclableExchange />} />
              <Route path="/donations" element={<DonationBoard />} />
              <Route path="/awareness" element={<AwarenessHub />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/water" element={<WaterTracking />} />
              <Route path="/carbon" element={<CarbonFootprint />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </SocketProvider>
    </Router>
  );
}

export default App;