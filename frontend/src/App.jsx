import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
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
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={
              <>
                <Navbar />
                <main className="flex-1">
                  <Dashboard />
                </main>
                <Footer />
              </>
            } />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/recyclables" element={
              <>
                <Navbar />
                <main className="flex-1">
                  <RecyclableExchange />
                </main>
                <Footer />
              </>
            } />
            <Route path="/donations" element={
              <>
                <Navbar />
                <main className="flex-1">
                  <DonationBoard />
                </main>
                <Footer />
              </>
            } />
            <Route path="/awareness" element={
              <>
                <Navbar />
                <main className="flex-1">
                  <AwarenessHub />
                </main>
                <Footer />
              </>
            } />
            <Route path="/leaderboard" element={
              <>
                <Navbar />
                <main className="flex-1">
                  <Leaderboard />
                </main>
                <Footer />
              </>
            } />
            <Route path="/water" element={
              <>
                <Navbar />
                <main className="flex-1">
                  <WaterTracking />
                </main>
                <Footer />
              </>
            } />
            <Route path="/carbon" element={
              <>
                <Navbar />
                <main className="flex-1">
                  <CarbonFootprint />
                </main>
                <Footer />
              </>
            } />
            <Route path="/admin" element={
              <>
                <Navbar />
                <main className="flex-1">
                  <AdminPanel />
                </main>
                <Footer />
              </>
            } />
          </Routes>
        </div>
      </SocketProvider>
    </Router>
  );
}

export default App;