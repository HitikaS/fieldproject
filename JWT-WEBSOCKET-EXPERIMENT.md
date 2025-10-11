# JWT Authentication + Real-time WebSocket Implementation
## Complete Academic Experiment Documentation

### 🏗️ **Project Overview**
This project demonstrates a **comprehensive JWT authentication system** integrated with **real-time WebSocket communication** in a full-stack MERN application. The implementation showcases enterprise-level security, role-based authorization, and live user interactions.

### 🔐 **JWT Authentication Features Implemented**

#### **Core JWT System**
- **Access Tokens**: 30-day expiration with secure payload
- **Refresh Tokens**: 7-day expiration for token renewal
- **Automatic Token Refresh**: Frontend handles token renewal seamlessly
- **Role-based Authorization**: Admin and User roles with different permissions
- **Secure Password Hashing**: bcrypt with salt rounds

#### **Enhanced Security Features**
- Input validation and sanitization
- Error handling with specific error codes
- Account status validation
- Token blacklisting capability
- Rate limiting protection
- CORS policy enforcement

### 🔌 **Real-time WebSocket Integration**

#### **WebSocket Architecture**
- **Authenticated Namespaces**: JWT verification for WebSocket connections
- **Room-based Communication**: Users join specific channels
- **Event Broadcasting**: Real-time updates across all connected clients
- **Automatic Reconnection**: Frontend handles connection drops

#### **Real-time Features**
- 🌱 **Carbon Footprint Tracking**: Live activity updates
- 💧 **Water Usage Monitoring**: Real-time consumption alerts
- 🤝 **Donation Board**: Instant community notifications
- ♻️ **Recyclable Exchange**: Live item availability updates
- 📚 **Awareness Hub**: Real-time post publishing and comments
- 🏆 **Leaderboard**: Live eco-points ranking updates
- 🔔 **Admin Notifications**: System alerts and user management

### 📁 **Key Files for Academic Documentation**

#### **Backend Implementation**

**1. JWT Authentication Controller** (`backend/controllers/userController.js`)
```javascript
// Key functions:
- generateToken()
- generateRefreshToken()
- loginUser()
- refreshToken()
- createAdminUser()
```

**2. Authentication Middleware** (`backend/middleware/authMiddleware.js`)
```javascript
// Key functions:
- authenticateToken()
- authorizeAdmin()
- Enhanced error handling
```

**3. WebSocket Handler** (`backend/websocket/realTimeSocket.js`)
```javascript
// Features:
- JWT authentication for WebSocket connections
- Room management and event broadcasting
- Real-time event handlers for all app features
```

**4. Socket Manager Utility** (`backend/utils/socketManager.js`)
```javascript
// Singleton pattern for:
- Event emission from controllers
- Centralized WebSocket management
```

**5. Enhanced Controllers with WebSocket Events**
- `footprintController.js` - Carbon tracking with live updates
- `donationController.js` - Donation management with notifications
- `recyclableController.js` - Item exchange with real-time alerts
- `waterController.js` - Water usage tracking with live data
- `awarenessController.js` - Content publishing with broadcasts

#### **Frontend Implementation**

**6. WebSocket Hook** (`frontend/src/hooks/useSocket.js`)
```javascript
// Features:
- WebSocket connection management
- Real-time event listeners
- Notification system integration
```

**7. Socket Context Provider** (`frontend/src/context/SocketContext.jsx`)
```javascript
// Features:
- Global WebSocket state management
- Real-time notification UI
- Connection status indicators
```

**8. Real-time Notifications Component** (`frontend/src/components/RealTimeNotifications.jsx`)
```javascript
// Features:
- Live notification display
- Priority notification handling
- User interaction management
```

**9. Enhanced Pages with WebSocket Integration**
- `CarbonFootprint.jsx` - Real-time carbon logging
- `DonationBoard.jsx` - Live donation management
- `Dashboard.jsx` - Fixed with safe navigation
- `AdminPanel.jsx` - Role-based admin interface

### 🧪 **Testing and Demonstration**

#### **Admin User Credentials**
```
Email: admin@sustainablelife.com
Password: Admin123!
Role: Admin (full system access)
```

#### **Test User Credentials**
```
Email: user@test.com  
Password: User123!
Role: User (standard access)
```

#### **Server URLs**
```
Backend: http://localhost:5000
Frontend: http://localhost:5174
WebSocket: ws://localhost:5000
```

### 📊 **Real-time Event Flow**

1. **User Action** → Frontend captures form submission
2. **API Request** → Backend processes with JWT validation
3. **Database Update** → Data stored in MongoDB
4. **WebSocket Emission** → Real-time event broadcast
5. **Live Updates** → All connected clients receive notifications

### 🏆 **Academic Value & Learning Outcomes**

#### **JWT Authentication Concepts Demonstrated**
- Token-based authentication architecture
- Stateless session management
- Role-based access control implementation
- Security best practices and error handling
- Refresh token mechanism for enhanced security

#### **Real-time Communication Concepts**
- WebSocket protocol implementation
- Event-driven architecture
- Real-time data synchronization
- Broadcasting and room management
- Performance optimization for concurrent users

#### **Full-stack Integration Skills**
- MERN stack architecture
- State management across components
- Error boundary implementation
- User experience optimization
- Production-ready code structure

### 🔄 **System Workflow Example**

**Carbon Footprint Logging:**
1. User logs carbon activity (frontend)
2. JWT token validates user (middleware)
3. Data saved to MongoDB (controller)
4. WebSocket event emitted (socketManager)
5. All users receive live update (real-time)
6. Leaderboard updates automatically
7. Eco-points awarded and broadcast

### 💡 **Innovation Highlights**

- **Seamless Integration**: JWT and WebSocket work together flawlessly
- **Role-based Real-time**: Different events for admin vs users
- **Performance Optimized**: Efficient event broadcasting
- **User Experience**: Live updates without page refresh
- **Security First**: All WebSocket connections authenticated
- **Scalable Architecture**: Singleton pattern for socket management

### 📝 **Code Quality Features**

- Modern ES6+ JavaScript syntax
- Comprehensive error handling
- Input validation and sanitization
- Modular component architecture
- Responsive design implementation
- Production-ready security measures

---

**This implementation serves as a comprehensive example of modern web development practices, combining secure authentication with real-time communication for an engaging user experience.**

---

## 📦 WebSocket Implementation Code Reference (For Experiment Submission)

Use this curated list when attaching code artifacts/screens in your report. It is grouped by concern so reviewers can trace the real-time data flow end‑to‑end.

### 1. Backend – Core WebSocket Infrastructure
| Purpose | File | What to Highlight |
|---------|------|-------------------|
| Socket bootstrap & auth handshake | `backend/websocket/realTimeSocket.js` | JWT extraction from `socket.handshake.auth.token`, connection events, namespace/room logic, server→client event emits |
| Central emission utility (decouples controllers) | `backend/utils/socketManager.js` | Singleton pattern, `setIo(io)`, emit helper methods (e.g. `emitCarbonUpdate`, `emitNewDonation`) |
| Server integration point | `backend/server.js` (or main server entry) | Where `httpServer` + `io` are created and `realTimeSocket(io)` invoked |
| Authentication enforcement for HTTP (shared logic) | `backend/middleware/authMiddleware.js` | Shows parity of auth logic between REST & WebSocket |

### 2. Backend – Domain Event Emitters (Controllers Updated for Real-Time)
| Domain | File | Key Snippet to Capture |
|--------|------|------------------------|
| Carbon Footprint | `backend/controllers/footprintController.js` | After saving log: calls to `socketManager.emitCarbonUpdate` & eco points emission |
| Water Tracking | `backend/controllers/waterController.js` | Emission of `emitWaterLogAdded` + eco points |
| Recyclables | `backend/controllers/recyclableController.js` | Listing, reserve, complete exchange events (`emitNewRecyclableItem`, `emitRecyclableClaimed`, `emitExchangeCompleted`) |
| Donations | `backend/controllers/donationController.js` | `emitNewDonation`, leaderboard/eco points emissions |
| Awareness Hub | `backend/controllers/awarenessController.js` | `emitNewAwarenessPost`, `emitFeaturedPost`, `emitNewComment` |
| Users / Leaderboard | `backend/controllers/userController.js` (if emitting) | Any eco point / achievement events (if present) |

### 3. Frontend – Connection & State Layer
| Concern | File | What to Highlight |
|---------|------|-------------------|
| Low-level socket lifecycle | `frontend/src/hooks/useSocket.js` | `io(...)` call with auth token, event listeners, emit wrappers, notification builder |
| Global context + UI bridge | `frontend/src/context/SocketContext.jsx` | Provider, connection badge, exposing emit + notifications |
| Notifications UI | `frontend/src/components/RealTimeNotifications.jsx` | Priority vs normal notification rendering |
| App-wide injection | `frontend/src/App.jsx` | `<SocketProvider>` wrapping the router |

### 4. Frontend – Pages Consuming Real-Time Emits
| Page | File | Emission / Indicator |
|------|------|----------------------|
| Carbon Footprint | `frontend/src/pages/CarbonFootprint.jsx` | After successful log: `emitCarbonLogAdded` + live badge |
| Donation Board | `frontend/src/pages/DonationBoard.jsx` | On creation & claim: `emitDonationAdded`, `emitDonationClaimed` |
| (Optional) Add later | Water / Recyclables / Awareness pages | Mirror pattern if you expand UI interactions |

### 5. Event Flow Trace (Suggested Screenshot Pairings)
1. User action (e.g., submit carbon log form – show portion of `CarbonFootprint.jsx`).
2. Controller handling & emitting (snippet from `footprintController.js`).
3. Emission abstraction (method in `socketManager.js`).
4. WebSocket server receiving / broadcasting (`realTimeSocket.js`).
5. Client listener firing (`useSocket.js` listener such as `globalCarbonUpdate`).
6. UI notification rendered (`RealTimeNotifications.jsx`).

### 6. Minimal Snippet Set (If Page Limit Applies)
Provide ONLY these trimmed blocks if constrained:
1. realTimeSocket.js: auth handshake + one broadcast.
2. socketManager.js: one emit helper.
3. footprintController.js: save + emit sequence.
4. useSocket.js: connection init + matching listener.
5. RealTimeNotifications.jsx: single notification item render.
6. App.jsx: `<SocketProvider>` integration.

### 7. Explanation Sentence (You Can Paste in Report)
“The WebSocket layer authenticates each connection using the existing JWT, emits domain events from controllers through a decoupled SocketManager singleton, and surfaces them on the client via a context-backed hook that converts events into actionable, prioritized notifications without requiring page reloads.”

### 8. Validation Steps (Optional Section)
| Step | What to Show |
|------|--------------|
| Network Tab (WS) | `101 Switching Protocols`, frames list with event payloads |
| Console | Logged listener outputs (e.g., `globalCarbonUpdate`) |
| UI | Live badge + notification stack updating instantly |

---

Add these references to strengthen the “Real-Time Communication via WebSockets” section of your experiment submission.
