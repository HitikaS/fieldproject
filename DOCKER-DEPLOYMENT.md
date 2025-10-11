# Docker Deployment Guide
## Sustainable Lifestyle Companion - Full Stack MERN with WebSocket

### 📋 **Prerequisites**

#### Option 1: Docker Desktop (Recommended)
- Install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)
- Ensure Docker Desktop is running

#### Option 2: Docker Engine (Linux/WSL2)
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Option 3: Podman (Docker Alternative)
```bash
# Windows (with Chocolatey)
choco install podman-desktop

# macOS (with Homebrew)
brew install podman

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install podman podman-compose
```

#### Option 4: Rancher Desktop (Docker Desktop Alternative)
- Download from [rancherdesktop.io](https://rancherdesktop.io/)
- Free and open-source alternative to Docker Desktop

### 🚀 **Quick Start Deployment**

#### 1. **Environment Setup**
```bash
# Clone the repository
git clone <your-repo-url>
cd MINIP

# Copy environment file
cp .env.example .env

# Edit environment variables
# Update JWT secrets, database credentials, and URLs
```

#### 2. **Production Deployment**
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

#### 3. **Development Mode**
```bash
# Start with development target
BUILD_TARGET=development docker-compose up -d

# Or use development compose file
docker-compose -f docker-compose.dev.yml up -d
```

### 🔧 **Configuration Options**

#### **Environment Variables**
| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `production` |
| `BACKEND_PORT` | Backend server port | `5000` |
| `FRONTEND_PORT` | Frontend server port | `3000` |
| `MONGO_ROOT_USERNAME` | MongoDB admin username | `admin` |
| `MONGO_ROOT_PASSWORD` | MongoDB admin password | `adminpassword` |
| `JWT_SECRET` | JWT signing secret | ⚠️ **Must change in production** |
| `CORS_ORIGIN` | Frontend URL for CORS | `http://localhost:3000` |
| `REACT_APP_API_URL` | Backend API endpoint | `http://localhost:5000` |
| `REACT_APP_WS_URL` | WebSocket server URL | `http://localhost:5000` |

#### **WebSocket Configuration**
The application includes real-time features via WebSocket:
- Carbon footprint tracking updates
- Live donation notifications
- Recyclable item exchanges
- Leaderboard updates
- Admin notifications

WebSocket connections are authenticated using JWT tokens.

### 🌐 **Service Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   MongoDB       │
│   (React/Nginx) │    │   (Node.js/     │    │   (Database)    │
│   Port: 3000    │◄──►│   Socket.io)    │◄──►│   Port: 27017   │
│                 │    │   Port: 5000    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Redis       │
                    │   (Sessions/    │
                    │    Cache)       │
                    │   Port: 6379    │
                    └─────────────────┘
```

### 📊 **Service Health Monitoring**

#### **Health Check Endpoints**
- Frontend: `http://localhost:3000/health`
- Backend: `http://localhost:5000/health`
- Database: `docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"`

#### **Container Status**
```bash
# Check all services
docker-compose ps

# View logs for specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb

# Follow real-time logs
docker-compose logs -f backend
```

### 🔒 **Security Considerations**

#### **Production Security Checklist**
- [ ] Change default JWT secrets in `.env`
- [ ] Update MongoDB credentials
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS with SSL certificates
- [ ] Set up firewall rules
- [ ] Regular security updates
- [ ] Monitor container logs
- [ ] Implement backup strategy

#### **SSL/TLS Setup (Production)**
```bash
# Generate SSL certificates (Let's Encrypt)
sudo apt-get install certbot
sudo certbot certonly --standalone -d yourdomain.com

# Update nginx configuration with SSL
# Copy certificates to ./nginx/ssl/
```

### 🚀 **Scaling and Performance**

#### **Horizontal Scaling**
```yaml
# docker-compose.scale.yml
services:
  backend:
    deploy:
      replicas: 3
  
  frontend:
    deploy:
      replicas: 2
```

#### **Load Testing**
```bash
# Install artillery for load testing
npm install -g artillery

# Test WebSocket connections
artillery run websocket-test.yml

# Test API endpoints
artillery run api-test.yml
```

### 🛠️ **Alternative Deployment Methods**

#### **1. Using Podman Instead of Docker**
```bash
# Replace docker-compose with podman-compose
podman-compose up -d

# Or use Podman pods
podman play kube kubernetes-manifest.yml
```

#### **2. Kubernetes Deployment**
```bash
# Generate Kubernetes manifests
kompose convert

# Apply to cluster
kubectl apply -f .
```

#### **3. Cloud Deployment**

**AWS ECS:**
```bash
# Install ECS CLI
curl -Lo ecs-cli https://amazon-ecs-cli.s3.amazonaws.com/ecs-cli-linux-amd64-latest
chmod +x ecs-cli && sudo mv ecs-cli /usr/local/bin

# Deploy to ECS
ecs-cli compose up
```

**Google Cloud Run:**
```bash
# Build and push images
gcloud builds submit --tag gcr.io/PROJECT_ID/sustainable-app

# Deploy
gcloud run deploy --image gcr.io/PROJECT_ID/sustainable-app
```

**Azure Container Instances:**
```bash
# Create resource group
az group create --name sustainable-rg --location eastus

# Deploy container group
az container create --resource-group sustainable-rg \
  --file docker-compose.yml
```

### 🐛 **Troubleshooting**

#### **Common Issues**

**1. Port Already in Use**
```bash
# Find process using port
netstat -tulpn | grep :5000
# or
lsof -i :5000

# Kill process
kill -9 <PID>
```

**2. MongoDB Connection Issues**
```bash
# Check MongoDB logs
docker-compose logs mongodb

# Connect to MongoDB container
docker-compose exec mongodb mongosh
```

**3. WebSocket Connection Failures**
- Check CORS configuration
- Verify JWT token validity
- Ensure Socket.io version compatibility
- Check network policies/firewalls

**4. Build Failures**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

#### **Performance Issues**
```bash
# Monitor resource usage
docker stats

# Check container logs for errors
docker-compose logs --tail=100

# Analyze bundle size
npm run analyze
```

### 📝 **Development Workflow**

#### **Local Development with Docker**
```bash
# Start development environment
npm run docker:dev

# Watch for changes
npm run docker:watch

# Run tests in container
docker-compose exec backend npm test
docker-compose exec frontend npm test
```

#### **Database Management**
```bash
# Backup database
docker-compose exec mongodb mongodump --out /backup

# Restore database
docker-compose exec mongodb mongorestore /backup

# Access MongoDB shell
docker-compose exec mongodb mongosh sustainable_lifestyle
```

### 🚀 **CI/CD Integration**

#### **GitHub Actions Example**
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        run: |
          docker-compose build
          docker-compose up -d
```

#### **GitLab CI Example**
```yaml
deploy:
  stage: deploy
  script:
    - docker-compose build
    - docker-compose up -d
  only:
    - main
```

### 📞 **Support and Monitoring**

#### **Log Aggregation**
```bash
# Centralized logging with ELK stack
docker-compose -f docker-compose.logging.yml up -d

# View aggregated logs
http://localhost:5601 # Kibana
```

#### **Monitoring**
```bash
# Prometheus + Grafana monitoring
docker-compose -f docker-compose.monitoring.yml up -d

# Access dashboards
http://localhost:3000 # Grafana
http://localhost:9090 # Prometheus
```

---

### 🎯 **Quick Commands Reference**

```bash
# Start application
docker-compose up -d

# Stop application
docker-compose down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart backend

# Scale services
docker-compose up -d --scale backend=3

# Update single service
docker-compose up -d --no-deps backend

# Clean up
docker-compose down -v
docker system prune -a
```

For more advanced configurations and troubleshooting, check the individual service documentation in their respective directories.