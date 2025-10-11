# Academic Experiment Evidence Collection Checklist
## Sustainable Lifestyle Companion - WebSocket Implementation

### 🎯 **Experiment Overview**
**Research Focus**: Real-time web application with WebSocket communication for sustainable lifestyle tracking
**Technology Stack**: MERN + Socket.io + Docker/Podman containerization
**Date**: October 12, 2025

---

## 📋 **Required Evidence Categories**

### 1. **SOURCE CODE DOCUMENTATION**

#### ✅ Backend WebSocket Implementation
- [ ] `backend/server.js` - Socket.io server setup
- [ ] `backend/config/socket.js` - WebSocket configuration
- [ ] `backend/controllers/socketController.js` - Real-time event handlers
- [ ] `backend/middleware/socketAuth.js` - WebSocket authentication
- [ ] `backend/routes/websocket.js` - WebSocket route definitions

#### ✅ Frontend WebSocket Integration  
- [ ] `frontend/src/context/SocketContext.jsx` - Socket client context
- [ ] `frontend/src/hooks/useSocket.js` - Custom WebSocket hook
- [ ] `frontend/src/components/RealTimeLeaderboard.jsx` - Live leaderboard
- [ ] `frontend/src/components/LiveNotifications.jsx` - Real-time notifications
- [ ] `frontend/src/services/socketService.js` - Socket service layer

#### ✅ Real-time Features Implementation
- [ ] Live leaderboard updates
- [ ] Real-time carbon footprint tracking
- [ ] Instant messaging/notifications
- [ ] Live user activity indicators
- [ ] Real-time data synchronization

### 2. **DEPLOYMENT EVIDENCE**

#### ✅ Containerization Proof
- [ ] `Dockerfile` (Backend) - Multi-stage Node.js container
- [ ] `Dockerfile` (Frontend) - React + Nginx container  
- [ ] `deploy-podman.bat` - Native Podman deployment script
- [ ] `deploy-podman.sh` - Cross-platform deployment script
- [ ] Container build logs and success confirmations

#### ✅ Infrastructure Configuration
- [ ] `nginx.conf` - Reverse proxy and WebSocket configuration
- [ ] `docker-entrypoint.sh` - Container initialization scripts
- [ ] Network configuration (sustainable-network)
- [ ] Volume management (persistent data storage)
- [ ] Port mapping and service discovery

### 3. **FUNCTIONAL TESTING PROOF**

#### ✅ Screenshot Evidence
- [ ] **Application Homepage** - Landing page with features overview
- [ ] **User Registration/Login** - Authentication system working
- [ ] **Dashboard** - Main user interface with real-time components
- [ ] **Carbon Footprint Tracker** - Data input and live updates
- [ ] **Water Usage Monitor** - Real-time tracking interface
- [ ] **Recyclable Exchange** - Marketplace functionality
- [ ] **Donation Board** - Community donation features
- [ ] **Leaderboard** - Live ranking updates
- [ ] **Admin Panel** - Administrative interface (if accessible)

#### ✅ WebSocket Communication Proof
- [ ] **Browser Developer Tools** - Network tab showing WebSocket connections
- [ ] **Real-time Updates** - Before/after screenshots of live data changes
- [ ] **Multiple Users** - Screenshots showing simultaneous user interactions
- [ ] **Message Flow** - WebSocket message logs in browser console
- [ ] **Connection Status** - Online/offline state indicators

### 4. **TECHNICAL PERFORMANCE METRICS**

#### ✅ System Performance
- [ ] **Container Resource Usage** - `podman stats` output
- [ ] **Memory Consumption** - Application memory usage
- [ ] **CPU Utilization** - System performance under load
- [ ] **Network Traffic** - WebSocket message volume and frequency
- [ ] **Response Times** - API and WebSocket latency measurements

#### ✅ Database Integration
- [ ] **MongoDB Connection** - Database connectivity proof
- [ ] **Data Persistence** - CRUD operations evidence
- [ ] **Redis Session Store** - Caching and session management
- [ ] **Real-time Data Sync** - Database to UI real-time updates

### 5. **DEVELOPMENT PROCESS DOCUMENTATION**

#### ✅ Version Control Evidence
- [ ] **Git Commit History** - Development progression
- [ ] **Code Evolution** - Before/after code comparisons
- [ ] **Problem-Solution Documentation** - Issues faced and resolved
- [ ] **Deployment Iterations** - Multiple deployment attempts and fixes

#### ✅ Configuration Management
- [ ] **Environment Variables** - Configuration management
- [ ] **Security Implementation** - JWT tokens, CORS, helmet.js
- [ ] **Error Handling** - Graceful failure management
- [ ] **Logging System** - Application and container logs

---

## 🔧 **Evidence Collection Commands**

### System Status Documentation
```bash
# Container status
podman ps -a

# System resources
podman stats --no-stream

# Network configuration  
podman network ls
podman network inspect sustainable-network

# Volume information
podman volume ls
podman volume inspect sustainable_mongodb_data
```

### Application Health Checks
```bash
# Backend API health
curl http://localhost:5000/health

# Frontend accessibility
curl http://localhost:3000

# WebSocket connection test
# (Use browser developer tools)
```

### Log Collection
```bash
# Application logs
podman logs sustainable-backend > backend-logs.txt
podman logs sustainable-frontend > frontend-logs.txt
podman logs sustainable-redis > redis-logs.txt

# System logs
podman events --since="1h" > podman-events.txt
```

---

## 📊 **Testing Scenarios for Evidence**

### 1. **Real-time Leaderboard Test**
1. Open application in multiple browser windows/tabs
2. Log in with different test accounts
3. Add carbon footprint data in one window
4. Capture screenshot of leaderboard updating in other windows
5. Document WebSocket messages in browser console

### 2. **Live Notification System Test**
1. Perform actions that trigger notifications
2. Capture real-time notification delivery
3. Screenshot notification components
4. Document message delivery timing

### 3. **Multi-user Interaction Test**
1. Simulate multiple users online simultaneously
2. Perform concurrent operations
3. Demonstrate real-time synchronization
4. Document system behavior under load

### 4. **Container Orchestration Test**
1. Stop and start individual containers
2. Demonstrate service recovery
3. Show container dependencies
4. Document deployment resilience

---

## 📁 **Recommended Evidence Structure**

```
experiment-evidence/
├── screenshots/
│   ├── 01-homepage.png
│   ├── 02-login-page.png
│   ├── 03-dashboard.png
│   ├── 04-carbon-tracker.png
│   ├── 05-water-monitor.png
│   ├── 06-leaderboard.png
│   ├── 07-websocket-devtools.png
│   └── 08-admin-panel.png
├── logs/
│   ├── backend-deployment.log
│   ├── frontend-deployment.log
│   ├── container-build.log
│   └── websocket-messages.log
├── performance/
│   ├── container-stats.txt
│   ├── response-times.txt
│   └── resource-usage.txt
├── code-snippets/
│   ├── websocket-server-setup.js
│   ├── socket-client-implementation.jsx
│   └── real-time-component-examples.jsx
└── deployment/
    ├── podman-commands.txt
    ├── container-configuration.txt
    └── network-setup.txt
```

---

## ✅ **Academic Submission Checklist**

- [ ] **Executive Summary** - One-page experiment overview
- [ ] **Technical Architecture Diagram** - System component visualization  
- [ ] **Source Code Repository** - Complete codebase with documentation
- [ ] **Deployment Documentation** - Step-by-step containerization guide
- [ ] **Test Results** - Functional and performance testing outcomes
- [ ] **Screenshot Portfolio** - Visual evidence of working features
- [ ] **Problem-Solution Log** - Challenges faced and resolutions
- [ ] **Performance Metrics** - Quantitative analysis of system behavior
- [ ] **Future Enhancements** - Potential improvements and scalability

---

## 🎓 **Academic Value Proposition**

This experiment demonstrates:
- **Modern Web Development**: MERN stack with real-time capabilities
- **DevOps Practices**: Containerization with Docker/Podman
- **System Architecture**: Microservices and container orchestration
- **Real-time Communication**: WebSocket implementation and optimization
- **Problem-Solving Skills**: Technical challenges and practical solutions
- **Industry Relevance**: Production-ready deployment strategies

---

**Note**: Ensure all evidence is collected systematically and organized for easy academic review and grading.