# 🚀 CI/CD Deployment Guide: GitHub Actions + Render + Vercel

## Overview
This guide sets up automated deployment for your Sustainable Lifestyle Companion app:
- **Backend**: Node.js API deployed to Render
- **Frontend**: React app deployed to Vercel  
- **CI/CD**: GitHub Actions for automated testing and deployment

---

## 📋 Prerequisites

### 1. Accounts Required:
- ✅ GitHub account (repository already exists)
- ✅ Render account (free tier available)
- ✅ Vercel account (free tier available)
- ✅ MongoDB Atlas (database hosting)
- ✅ Redis Cloud (optional - for sessions)

### 2. Repository Setup:
Your code is already organized correctly:
```
MINIP/
├── backend/          # Node.js API
├── frontend/         # React app
├── .github/workflows/ # CI/CD configuration
└── deployment docs   # Configuration guides
```

---

## 🛠️ Step-by-Step Setup

### Step 1: Setup Render (Backend)

1. **Create Render Account**:
   - Go to https://render.com
   - Sign up with GitHub

2. **Create Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository: `fieldproject`
   - Configure:
     - **Name**: `sustainable-backend`
     - **Root Directory**: `backend`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free

3. **Environment Variables**:
   Add these in Render dashboard:
   ```bash
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_here
   CORS_ORIGIN=https://your-app.vercel.app
   ```

### Step 2: Setup Vercel (Frontend)

1. **Create Vercel Account**:
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Import Project**:
   - Click "New Project"
   - Import from GitHub: `fieldproject`
   - Configure:
     - **Framework Preset**: Vite
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`

3. **Environment Variables**:
   Add these in Vercel project settings:
   ```bash
   REACT_APP_API_URL=https://your-backend.onrender.com
   REACT_APP_WS_URL=https://your-backend.onrender.com
   REACT_APP_ENV=production
   REACT_APP_VERSION=1.0.0
   ```

### Step 3: Setup GitHub Secrets

1. **Go to Repository Settings**:
   - GitHub repo → Settings → Secrets and variables → Actions

2. **Add Repository Secrets**:
   ```bash
   # Vercel
   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=your_organization_id
   VERCEL_PROJECT_ID=your_project_id
   
   # Render
   RENDER_SERVICE_ID=your_service_id
   RENDER_API_KEY=your_api_key
   
   # Environment URLs
   REACT_APP_API_URL=https://your-backend.onrender.com
   REACT_APP_WS_URL=https://your-backend.onrender.com
   ```

### Step 4: Configure Database

1. **MongoDB Atlas**:
   - Create cluster at https://cloud.mongodb.com
   - Get connection string
   - Add to Render environment variables

2. **Redis Cloud** (Optional):
   - Create database at https://redis.com
   - Get connection string
   - Add to Render environment variables

---

## ⚙️ How It Works

### Deployment Flow:
```
1. Push code to main branch
   ↓
2. GitHub Actions triggers
   ↓
3. Run tests and build
   ↓
4. Deploy backend to Render
   ↓
5. Deploy frontend to Vercel
   ↓
6. Notify deployment status
```

### Automatic Deployments:
- **Production**: Push to `main` branch
- **Preview**: Create pull request
- **Development**: Push to `develop` branch

---

## 🧪 Testing the Setup

### 1. Test Local Setup First:
```bash
# Backend
cd backend
npm install
npm start

# Frontend  
cd frontend
npm install
npm run build
npm run preview
```

### 2. Push to GitHub:
```bash
git add .
git commit -m "Add CI/CD deployment configuration"
git push origin main
```

### 3. Monitor Deployment:
- Check GitHub Actions tab for build status
- Check Render dashboard for backend deployment
- Check Vercel dashboard for frontend deployment

---

## 🔧 Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check Node.js version (should be 20)
   - Verify package.json scripts
   - Check environment variables

2. **Deployment Timeouts**:
   - Render free tier has limitations
   - Check service logs in dashboard

3. **CORS Errors**:
   - Verify CORS_ORIGIN in backend
   - Check frontend API URLs

4. **Database Connection**:
   - Verify MongoDB connection string
   - Check IP whitelist in Atlas

---

## 📈 Monitoring & Maintenance

### Production URLs:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.onrender.com
- **API Health**: https://your-backend.onrender.com/health

### Performance Monitoring:
- Vercel Analytics (built-in)
- Render Metrics (dashboard)
- GitHub Actions logs

### Security Updates:
- Dependabot alerts (GitHub)
- Regular dependency updates
- Environment variable rotation

---

## 🎉 Success Criteria

Your deployment is successful when:
- ✅ GitHub Actions workflow passes
- ✅ Backend deploys to Render without errors
- ✅ Frontend deploys to Vercel without errors
- ✅ Application loads and functions correctly
- ✅ WebSocket connections work in production
- ✅ Database operations succeed

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)

**Ready to deploy? Follow the steps above and your app will be live in production! 🚀**