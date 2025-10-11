#!/bin/sh
# Docker entrypoint script for frontend environment configuration

set -e

# Define the environment configuration file
ENV_FILE="/usr/share/nginx/html/env-config.js"

# Create runtime environment configuration
cat <<EOF > $ENV_FILE
window._env_ = {
  REACT_APP_API_URL: "${REACT_APP_API_URL:-http://localhost:5000}",
  REACT_APP_WS_URL: "${REACT_APP_WS_URL:-http://localhost:5000}",
  REACT_APP_ENV: "${REACT_APP_ENV:-production}",
  REACT_APP_VERSION: "${REACT_APP_VERSION:-1.0.0}"
};
EOF

echo "Environment configuration created:"
cat $ENV_FILE

# Execute the main command
exec "$@"