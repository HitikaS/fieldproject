const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import routes
const userRoutes = require('./routes/userRoutes');
const footprintRoutes = require('./routes/footprintRoutes');
const waterRoutes = require('./routes/waterRoutes');
const recyclableRoutes = require('./routes/recyclableRoutes');
const donationRoutes = require('./routes/donationRoutes');
const awarenessRoutes = require('./routes/awarenessRoutes');

// Import WebSocket handlers
const realTimeSocket = require('./websocket/realTimeSocket');
const leaderboardSocket = require('./websocket/leaderboardSocket');
const socketManager = require('./utils/socketManager');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL || "http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: [process.env.FRONTEND_URL || "http://localhost:5173", "http://localhost:5174"],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
require('./config/db');

// Routes
app.use('/api/users', userRoutes);
app.use('/api/footprint', footprintRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/recyclables', recyclableRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/awareness', awarenessRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Sustainable Lifestyle API is running',
    timestamp: new Date().toISOString()
  });
});

// WebSocket setup
const { mainNamespace, publicNamespace } = realTimeSocket(io);
leaderboardSocket(io);

// Initialize socket manager
socketManager.initialize(io);

// Make socket available to routes
app.set('socket', io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🌱 Sustainable Lifestyle API running on port ${PORT}`);
  console.log(`🔗 WebSocket server ready for real-time updates`);
});