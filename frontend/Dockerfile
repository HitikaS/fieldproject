# Frontend Dockerfile for Sustainable Lifestyle Companion
# Multi-stage build for optimized React production deployment

# Stage 1: Build Stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency caching
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the React application
RUN npm run build

# Stage 2: Production Stage with Nginx
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built React app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy environment configuration script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create non-root user
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S frontend -u 1001 -G nginx-user

# Set proper permissions
RUN chown -R frontend:nginx-user /usr/share/nginx/html && \
    chown -R frontend:nginx-user /var/cache/nginx && \
    chown -R frontend:nginx-user /var/log/nginx && \
    chown -R frontend:nginx-user /etc/nginx/conf.d && \
    chown -R frontend:nginx-user /tmp

# Switch to non-root user
USER frontend

# Expose port 8080 for HTTP traffic
EXPOSE 8080

# Health check for container monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080 || exit 1

# Start nginx with custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]