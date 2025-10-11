#!/bin/bash
# Deployment script for Sustainable Lifestyle Companion
# Works with Docker, Podman, or other container runtimes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="sustainable-lifestyle"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# Functions
print_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║         Sustainable Lifestyle Companion Deployment          ║"
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

check_requirements() {
    log_info "Checking system requirements..."
    
    # Check for container runtime
    if command -v docker &> /dev/null; then
        CONTAINER_CMD="docker"
        COMPOSE_CMD="docker-compose"
        log_success "Docker found"
    elif command -v podman &> /dev/null; then
        CONTAINER_CMD="podman"
        COMPOSE_CMD="podman-compose"
        log_success "Podman found"
    else
        log_error "No container runtime found. Please install Docker or Podman."
        exit 1
    fi
    
    # Check for compose
    if ! command -v $COMPOSE_CMD &> /dev/null; then
        log_error "$COMPOSE_CMD not found. Please install docker-compose or podman-compose."
        exit 1
    fi
    
    # Check if compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "docker-compose.yml not found in current directory"
        exit 1
    fi
}

setup_environment() {
    log_info "Setting up environment..."
    
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_warning "Created .env from .env.example. Please update the values!"
            log_warning "Important: Update JWT secrets and database passwords before deployment!"
        else
            log_error "No .env file found and no .env.example to copy from"
            exit 1
        fi
    else
        log_success "Environment file found"
    fi
}

generate_secrets() {
    log_info "Generating secure secrets..."
    
    # Generate random secrets if they're still default
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
    MONGO_PASSWORD=$(openssl rand -base64 16 2>/dev/null || head -c 16 /dev/urandom | base64)
    REDIS_PASSWORD=$(openssl rand -base64 16 2>/dev/null || head -c 16 /dev/urandom | base64)
    
    # Update .env file with generated secrets
    sed -i.bak "s|JWT_SECRET=your-super-secret-jwt-key.*|JWT_SECRET=$JWT_SECRET|g" .env
    sed -i.bak "s|JWT_REFRESH_SECRET=your-super-secret-refresh-key.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|g" .env
    sed -i.bak "s|MONGO_ROOT_PASSWORD=change-this-secure-password|MONGO_ROOT_PASSWORD=$MONGO_PASSWORD|g" .env
    sed -i.bak "s|REDIS_PASSWORD=change-this-redis-password|REDIS_PASSWORD=$REDIS_PASSWORD|g" .env
    
    log_success "Secrets generated and updated in .env file"
}

build_images() {
    log_info "Building Docker images..."
    
    $COMPOSE_CMD build --parallel
    
    if [ $? -eq 0 ]; then
        log_success "Images built successfully"
    else
        log_error "Failed to build images"
        exit 1
    fi
}

start_services() {
    log_info "Starting services..."
    
    $COMPOSE_CMD up -d
    
    if [ $? -eq 0 ]; then
        log_success "Services started successfully"
    else
        log_error "Failed to start services"
        exit 1
    fi
}

check_health() {
    log_info "Checking service health..."
    
    # Wait for services to start
    sleep 10
    
    # Check if containers are running
    if $COMPOSE_CMD ps | grep -q "Up"; then
        log_success "Containers are running"
    else
        log_error "Some containers failed to start"
        $COMPOSE_CMD ps
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
        $COMPOSE_CMD logs backend
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
    $COMPOSE_CMD ps
    
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
    $COMPOSE_CMD down -v --remove-orphans
    log_success "Cleanup completed"
}

# Main deployment function
deploy() {
    print_banner
    check_requirements
    setup_environment
    
    # Ask user if they want to generate new secrets
    read -p "Generate new secure secrets? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        generate_secrets
    fi
    
    # Ask user if they want to clean up first
    read -p "Clean up previous deployment? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cleanup
    fi
    
    build_images
    start_services
    check_health
    show_status
    
    log_success "Deployment completed successfully!"
    echo ""
    log_info "Useful commands:"
    echo "  View logs: $COMPOSE_CMD logs -f"
    echo "  Stop services: $COMPOSE_CMD down"
    echo "  Restart service: $COMPOSE_CMD restart <service>"
    echo "  Scale service: $COMPOSE_CMD up -d --scale backend=3"
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "start")
        log_info "Starting services..."
        $COMPOSE_CMD up -d
        show_status
        ;;
    "stop")
        log_info "Stopping services..."
        $COMPOSE_CMD down
        log_success "Services stopped"
        ;;
    "restart")
        log_info "Restarting services..."
        $COMPOSE_CMD restart
        log_success "Services restarted"
        ;;
    "status")
        show_status
        ;;
    "logs")
        $COMPOSE_CMD logs -f
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
        echo "  logs    - Show and follow logs"
        echo "  clean   - Clean up containers and volumes"
        echo "  build   - Build images only"
        echo "  health  - Check service health"
        exit 1
        ;;
esac