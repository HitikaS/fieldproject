# Backend Dockerfile for Sustainable Lifestyle Companion
# Multi-stage build with WebSocket support and production optimization

# Stage 1: Development Stage
FROM node:20-alpine AS development

# Set working directory
WORKDIR /app

# Copy package files for dependency caching
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001 && \
    chown -R backend:nodejs /app

USER backend

# Expose port for HTTP and WebSocket connections
EXPOSE 5000

# Development command with hot reload
CMD ["npm", "run", "dev"]

# Stage 2: Production Stage  
FROM node:20-alpine AS production

# Set environment
ENV NODE_ENV=production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create non-root user and set permissions
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001 && \
    mkdir -p /app/logs && \
    chown -R backend:nodejs /app

USER backend

# Expose port for HTTP and WebSocket
EXPOSE 5000

# Health check for container monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Production startup command
CMD ["npm", "start"]