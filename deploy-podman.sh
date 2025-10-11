#!/bin/bash
# Podman Deployment Script for Sustainable Lifestyle Companion
# Native Podman commands without requiring podman-compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="sustainable-lifestyle"
NETWORK_NAME="sustainable-network"
VOLUME_PREFIX="sustainable"

# Functions
print_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║         Podman Deployment - Sustainable Lifestyle            ║"
    echo "║                Full Stack MERN + WebSocket                   ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_podman() {
    log_info "Checking Podman installation..."
    
    if ! command -v podman &> /dev/null; then
        log_error "Podman not found. Please install Podman first."
        exit 1
    fi
    
    log_success "Podman found: $(podman --version)"
}

setup_network() {
    log_info "Setting up Podman network..."
    
    # Check if network exists
    if podman network ls | grep -q "$NETWORK_NAME"; then
        log_info "Network $NETWORK_NAME already exists"
    else
        podman network create "$NETWORK_NAME"
        log_success "Created network: $NETWORK_NAME"
    fi
}

setup_volumes() {
    log_info "Setting up Podman volumes..."
    
    # Create volumes if they don't exist
    volumes=("${VOLUME_PREFIX}_mongodb_data" "${VOLUME_PREFIX}_mongodb_config" "${VOLUME_PREFIX}_redis_data" "${VOLUME_PREFIX}_backend_uploads" "${VOLUME_PREFIX}_backend_logs")
    
    for volume in "${volumes[@]}"; do
        if podman volume ls | grep -q "$volume"; then
            log_info "Volume $volume already exists"
        else
            podman volume create "$volume"
            log_success "Created volume: $volume"
        fi
    done
}

build_images() {
    log_info "Building images with Podman..."
    
    # Build backend image
    log_info "Building backend image..."
    cd backend
    podman build -t sustainable-backend:latest -f Dockerfile .
    cd ..
    
    # Build frontend image
    log_info "Building frontend image..."
    cd frontend
    podman build -t sustainable-frontend:latest -f Dockerfile .
    cd ..
    
    log_success "Images built successfully"
}

start_mongodb() {
    log_info "Starting MongoDB container..."
    
    # Check if MongoDB container is already running
    if podman ps | grep -q "sustainable-mongodb"; then
        log_info "MongoDB container already running"
        return
    fi
    
    # Remove existing container if it exists but is stopped
    podman rm -f sustainable-mongodb 2>/dev/null || true
    
    podman run -d \
        --name sustainable-mongodb \
        --network "$NETWORK_NAME" \
        -p 27017:27017 \
        -e MONGO_INITDB_ROOT_USERNAME=admin \
        -e MONGO_INITDB_ROOT_PASSWORD=adminpassword \
        -e MONGO_INITDB_DATABASE=sustainable_lifestyle \
        -v "${VOLUME_PREFIX}_mongodb_data:/data/db" \
        -v "${VOLUME_PREFIX}_mongodb_config:/data/configdb" \
        --restart unless-stopped \
        mongo:6.0-bullseye
    
    log_success "MongoDB container started"
}

start_redis() {
    log_info "Starting Redis container..."
    
    # Check if Redis container is already running
    if podman ps | grep -q "sustainable-redis"; then
        log_info "Redis container already running"
        return
    fi
    
    # Remove existing container if it exists but is stopped
    podman rm -f sustainable-redis 2>/dev/null || true
    
    podman run -d \
        --name sustainable-redis \
        --network "$NETWORK_NAME" \
        -p 6379:6379 \
        -e REDIS_PASSWORD=redispassword \
        -v "${VOLUME_PREFIX}_redis_data:/data" \
        --restart unless-stopped \
        redis:7-alpine redis-server --requirepass redispassword
    
    log_success "Redis container started"
}

start_backend() {
    log_info "Starting Backend container..."
    
    # Check if backend container is already running
    if podman ps | grep -q "sustainable-backend"; then
        log_info "Backend container already running"
        return
    fi
    
    # Remove existing container if it exists but is stopped
    podman rm -f sustainable-backend 2>/dev/null || true
    
    # Wait for MongoDB to be ready
    log_info "Waiting for MongoDB to be ready..."
    sleep 10
    
    podman run -d \
        --name sustainable-backend \
        --network "$NETWORK_NAME" \
        -p 5000:5000 \
        -e NODE_ENV=production \
        -e PORT=5000 \
        -e MONGO_URI="mongodb://admin:adminpassword@sustainable-mongodb:27017/sustainable_lifestyle?authSource=admin" \
        -e JWT_SECRET="your-super-secret-jwt-key-change-in-production" \
        -e JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production" \
        -e JWT_EXPIRES_IN="30d" \
        -e JWT_REFRESH_EXPIRES_IN="7d" \
        -e CORS_ORIGIN="http://localhost:3000" \
        -e SOCKET_CORS_ORIGIN="http://localhost:3000" \
        -v "${VOLUME_PREFIX}_backend_uploads:/app/uploads" \
        -v "${VOLUME_PREFIX}_backend_logs:/app/logs" \
        --restart unless-stopped \
        sustainable-backend:latest
    
    log_success "Backend container started"
}

start_frontend() {
    log_info "Starting Frontend container..."
    
    # Check if frontend container is already running
    if podman ps | grep -q "sustainable-frontend"; then
        log_info "Frontend container already running"
        return
    fi
    
    # Remove existing container if it exists but is stopped
    podman rm -f sustainable-frontend 2>/dev/null || true
    
    # Wait for backend to be ready
    log_info "Waiting for backend to be ready..."
    sleep 15
    
    podman run -d \
        --name sustainable-frontend \
        --network "$NETWORK_NAME" \
        -p 3000:80 \
        -e REACT_APP_API_URL="http://localhost:5000" \
        -e REACT_APP_WS_URL="http://localhost:5000" \
        -e REACT_APP_ENV="production" \
        -e REACT_APP_VERSION="1.0.0" \
        --restart unless-stopped \
        sustainable-frontend:latest
    
    log_success "Frontend container started"
}

check_health() {
    log_info "Checking service health..."
    
    # Wait for services to start
    sleep 10
    
    # Check if containers are running
    if podman ps --format "table {{.Names}}" | grep -E "(sustainable-mongodb|sustainable-redis|sustainable-backend|sustainable-frontend)"; then
        log_success "Containers are running"
    else
        log_error "Some containers failed to start"
        podman ps
        exit 1
    fi
    
    # Check backend health
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:5000/health &> /dev/null; then
            log_success "Backend is healthy"
            break
        else
            log_info "Waiting for backend to be ready... (attempt $attempt/$max_attempts)"
            sleep 2
            ((attempt++))
        fi
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "Backend health check failed"
        log_info "Backend logs:"
        podman logs sustainable-backend
        exit 1
    fi
    
    # Check frontend health
    if curl -f http://localhost:3000/health &> /dev/null; then
        log_success "Frontend is healthy"
    else
        log_warning "Frontend health check failed, but it might still be loading"
    fi
}

show_status() {
    log_info "Service status:"
    podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    log_info "Access URLs:"
    echo -e "${GREEN}Frontend:${NC} http://localhost:3000"
    echo -e "${GREEN}Backend API:${NC} http://localhost:5000"
    echo -e "${GREEN}MongoDB:${NC} localhost:27017"
    echo -e "${GREEN}Redis:${NC} localhost:6379"
    
    echo ""
    log_info "Test accounts:"
    echo -e "${YELLOW}Admin:${NC} admin@sustainablelife.com / Admin123!"
    echo -e "${YELLOW}User:${NC} user@test.com / User123!"
}

cleanup() {
    log_info "Cleaning up previous deployment..."
    
    # Stop and remove containers
    containers=("sustainable-frontend" "sustainable-backend" "sustainable-redis" "sustainable-mongodb")
    for container in "${containers[@]}"; do
        podman stop "$container" 2>/dev/null || true
        podman rm "$container" 2>/dev/null || true
    done
    
    # Remove network
    podman network rm "$NETWORK_NAME" 2>/dev/null || true
    
    # Remove volumes (optional)
    read -p "Remove volumes (will delete all data)? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        volumes=("${VOLUME_PREFIX}_mongodb_data" "${VOLUME_PREFIX}_mongodb_config" "${VOLUME_PREFIX}_redis_data" "${VOLUME_PREFIX}_backend_uploads" "${VOLUME_PREFIX}_backend_logs")
        for volume in "${volumes[@]}"; do
            podman volume rm "$volume" 2>/dev/null || true
        done
    fi
    
    log_success "Cleanup completed"
}

deploy() {
    print_banner
    check_podman
    
    # Ask user if they want to clean up first
    read -p "Clean up previous deployment? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cleanup
    fi
    
    setup_network
    setup_volumes
    build_images
    
    # Start services in order
    start_mongodb
    start_redis
    start_backend
    start_frontend
    
    check_health
    show_status
    
    log_success "Podman deployment completed successfully!"
    echo ""
    log_info "Useful commands:"
    echo "  View logs: podman logs <container_name>"
    echo "  Stop services: podman stop sustainable-frontend sustainable-backend sustainable-redis sustainable-mongodb"
    echo "  Start services: podman start sustainable-mongodb sustainable-redis sustainable-backend sustainable-frontend"
    echo "  Remove everything: $0 clean"
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "start")
        log_info "Starting services..."
        podman start sustainable-mongodb sustainable-redis sustainable-backend sustainable-frontend
        show_status
        ;;
    "stop")
        log_info "Stopping services..."
        podman stop sustainable-frontend sustainable-backend sustainable-redis sustainable-mongodb
        log_success "Services stopped"
        ;;
    "restart")
        log_info "Restarting services..."
        podman restart sustainable-mongodb sustainable-redis sustainable-backend sustainable-frontend
        log_success "Services restarted"
        ;;
    "status")
        show_status
        ;;
    "logs")
        if [ -n "$2" ]; then
            podman logs -f "sustainable-$2"
        else
            echo "Available services: mongodb, redis, backend, frontend"
            echo "Usage: $0 logs <service>"
        fi
        ;;
    "clean")
        cleanup
        ;;
    "build")
        build_images
        ;;
    "health")
        check_health
        ;;
    *)
        echo "Usage: $0 {deploy|start|stop|restart|status|logs|clean|build|health}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Full deployment (default)"
        echo "  start   - Start services"
        echo "  stop    - Stop services"
        echo "  restart - Restart services"
        echo "  status  - Show service status"
        echo "  logs    - Show logs (specify service: mongodb|redis|backend|frontend)"
        echo "  clean   - Clean up containers and volumes"
        echo "  build   - Build images only"
        echo "  health  - Check service health"
        exit 1
        ;;
esac