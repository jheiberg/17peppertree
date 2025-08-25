#!/bin/bash

# ==============================================
# 17 @ Peppertree - Deployment Script
# ==============================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
PROJECT_NAME="peppertree"
BACKUP_DIR="/opt/${PROJECT_NAME}-backups"
LOG_FILE="/var/log/${PROJECT_NAME}-deploy.log"

# Functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}" | tee -a "$LOG_FILE"
}

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    error "Invalid environment. Use 'staging' or 'production'"
fi

# Set environment-specific variables
if [[ "$ENVIRONMENT" == "production" ]]; then
    PROJECT_DIR="/opt/${PROJECT_NAME}-production"
    COMPOSE_FILE="docker-compose.production.yml"
    DOCKER_TAG="latest"
else
    PROJECT_DIR="/opt/${PROJECT_NAME}-staging"
    COMPOSE_FILE="docker-compose.staging.yml"
    DOCKER_TAG="latest"
fi

log "Starting deployment to $ENVIRONMENT environment"
log "Project directory: $PROJECT_DIR"

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
    error "This script must be run as root or with sudo"
fi

# Check prerequisites
command -v docker >/dev/null 2>&1 || error "Docker is not installed"
command -v docker-compose >/dev/null 2>&1 || error "Docker Compose is not installed"

# Navigate to project directory
cd "$PROJECT_DIR" || error "Failed to navigate to $PROJECT_DIR"

# Check if .env file exists
if [[ ! -f ".env" ]]; then
    error ".env file not found in $PROJECT_DIR"
fi

# Load environment variables
source .env

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Pre-deployment backup
log "Creating pre-deployment backup"
if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    BACKUP_FILENAME="backup_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S).sql"
    
    if docker-compose -f "$COMPOSE_FILE" exec -T db pg_dump -U postgres peppertree > "$BACKUP_DIR/$BACKUP_FILENAME"; then
        log "Database backup created: $BACKUP_FILENAME"
    else
        warning "Failed to create database backup, continuing anyway..."
    fi
fi

# Pull latest code
log "Pulling latest code from Git"
git fetch origin
if [[ "$ENVIRONMENT" == "production" ]]; then
    git checkout production
    git pull origin production
else
    git checkout main
    git pull origin main
fi

# Pull latest Docker images
log "Pulling latest Docker images"
docker-compose -f "$COMPOSE_FILE" pull || warning "Failed to pull some images"

# Stop existing containers
log "Stopping existing containers"
docker-compose -f "$COMPOSE_FILE" down || warning "Some containers failed to stop"

# Start new containers
log "Starting new containers"
docker-compose -f "$COMPOSE_FILE" up -d || error "Failed to start containers"

# Wait for services to be ready
log "Waiting for services to start..."
sleep 30

# Health checks
log "Performing health checks"

# Check if containers are running
if ! docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    error "Not all containers are running"
fi

# Check database connectivity
if ! docker-compose -f "$COMPOSE_FILE" exec -T db pg_isready -U postgres >/dev/null 2>&1; then
    error "Database health check failed"
fi

# Check backend API
API_URL="http://localhost:5000/api/health"
if [[ "$ENVIRONMENT" == "staging" ]]; then
    API_URL="http://localhost:8080/api/health"
fi

for i in {1..10}; do
    if curl -f "$API_URL" >/dev/null 2>&1; then
        log "Backend API health check passed"
        break
    else
        if [[ $i -eq 10 ]]; then
            error "Backend API health check failed after 10 attempts"
        fi
        info "Waiting for backend API (attempt $i/10)..."
        sleep 10
    fi
done

# Run database migrations if needed
log "Running database migrations"
docker-compose -f "$COMPOSE_FILE" exec -T backend python -c "
from app import app, db
with app.app_context():
    db.create_all()
    print('Database migrations completed')
" || warning "Database migrations failed or not needed"

# Clean up old Docker resources
log "Cleaning up old Docker resources"
docker system prune -f >/dev/null 2>&1 || true

# Clean up old backups (keep last 10)
log "Cleaning up old backups"
cd "$BACKUP_DIR"
ls -t backup_${ENVIRONMENT}_*.sql | tail -n +11 | xargs -r rm || true

# Display deployment summary
log "=== Deployment Summary ==="
info "Environment: $ENVIRONMENT"
info "Git branch: $(git branch --show-current)"
info "Git commit: $(git rev-parse --short HEAD)"
info "Deployment time: $(date)"

# Show running containers
info "Running containers:"
docker-compose -f "$COMPOSE_FILE" ps

log "Deployment completed successfully!"

# Send notification (if configured)
if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ Peppertree deployment to $ENVIRONMENT completed successfully\"}" \
        "$SLACK_WEBHOOK_URL" >/dev/null 2>&1 || true
fi

log "Deployment script finished"