#!/bin/bash

# Deploy script for Docker Platform
# This script is called by the webhook handler when code is pushed to main branch

set -e

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Change to the docker platform directory
cd /opt/docker-platform

log "Starting deployment..."

# Pull latest changes
log "Pulling latest changes from git..."
git pull origin main

# Build and restart containers
log "Building and restarting containers..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
log "Waiting for services to be ready..."
sleep 30

# Check if services are running
log "Checking service status..."
docker-compose ps

log "Deployment completed successfully!" 