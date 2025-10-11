# Vercel Deployment Configuration for Frontend

## Environment Variables Required:
```bash
REACT_APP_API_URL=https://your-backend.onrender.com
REACT_APP_WS_URL=https://your-backend.onrender.com  
REACT_APP_ENV=production
REACT_APP_VERSION=1.0.0
```

## Build Settings:
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Root Directory: `frontend`
- Node.js Version: 20

## Domain Configuration:
- Production Domain: your-app-name.vercel.app
- Custom Domain: (optional) your-custom-domain.com

## Deployment Branches:
- Production: main
- Preview: develop, feature/*

## Environment Variables Setup:
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add the following variables:
   - `REACT_APP_API_URL` → Your Render backend URL
   - `REACT_APP_WS_URL` → Your Render backend URL (same as API)
   - `REACT_APP_ENV` → production
   - `REACT_APP_VERSION` → 1.0.0

## Automatic Deployment:
- Connected to GitHub repository
- Auto-deploy on push to main branch
- Preview deployments for pull requests

## Security Headers:
- Configured in vercel.json
- CSP, X-Frame-Options, etc.

## Performance Optimizations:
- Static file caching (31536000s for assets)
- Gzip compression enabled
- Edge functions for API proxying