# GitHub Secrets Configuration

## Required Secrets for CI/CD Pipeline

### Vercel Secrets:
```bash
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_organization_id  
VERCEL_PROJECT_ID=your_project_id
```

### Render Secrets:
```bash
RENDER_SERVICE_ID=your_render_service_id
RENDER_API_KEY=your_render_api_key
```

### Application Environment:
```bash
REACT_APP_API_URL=https://your-backend.onrender.com
REACT_APP_WS_URL=https://your-backend.onrender.com
```

## How to Get These Values:

### Vercel:
1. Go to Vercel Dashboard → Settings → Tokens
2. Create new token → Copy `VERCEL_TOKEN`
3. Go to your project → Settings → General
4. Copy `Project ID` → `VERCEL_PROJECT_ID`
5. Account Settings → Copy `Team ID` → `VERCEL_ORG_ID`

### Render:
1. Go to Render Dashboard → Account Settings → API Keys
2. Create new API key → Copy `RENDER_API_KEY`
3. Go to your service → Settings → Copy `Service ID` → `RENDER_SERVICE_ID`

### GitHub Repository:
1. Go to GitHub Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret with exact name and value

## Environment Variables for Production:

### Backend (Render):
```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sustainable
REDIS_URL=redis://username:password@host:port
JWT_SECRET=your_super_secure_jwt_secret_key_here
CORS_ORIGIN=https://your-app.vercel.app
SOCKET_CORS_ORIGIN=https://your-app.vercel.app
```

### Frontend (Vercel):
```bash
REACT_APP_API_URL=https://your-backend.onrender.com
REACT_APP_WS_URL=https://your-backend.onrender.com
REACT_APP_ENV=production
REACT_APP_VERSION=1.0.0
```

## Security Best Practices:
- Never commit secrets to repository
- Use strong, unique passwords
- Rotate API keys regularly
- Use environment-specific configurations
- Enable 2FA on all accounts