# Render Deployment Configuration for Backend

## Environment Variables Required:
```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_connection_string
REDIS_URL=your_redis_connection_string
JWT_SECRET=your_jwt_secret_key
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

## Build Command:
```bash
npm install
```

## Start Command:
```bash
npm start
```

## Health Check Endpoint:
```
GET /health
```

## Auto-Deploy Settings:
- Branch: main
- Root Directory: backend
- Node Version: 20

## Environment Setup Notes:
1. Add MongoDB Atlas connection string to MONGODB_URI
2. Add Redis Cloud connection string to REDIS_URL  
3. Set CORS_ORIGIN to your Vercel frontend URL
4. Generate secure JWT_SECRET (use: openssl rand -base64 32)
5. Ensure PORT is set to 10000 (Render's default)

## Render Service Configuration:
- Service Type: Web Service
- Language: Node.js
- Branch: main
- Build Command: npm install
- Start Command: npm start
- Health Check Path: /health