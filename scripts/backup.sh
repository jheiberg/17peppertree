#!/bin/bash

# ==============================================
# 17 @ Peppertree - Database Backup Script
# ==============================================

set -e

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_NAME="peppertree"
BACKUP_DIR="/opt/${PROJECT_NAME}-backups"
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    error "Invalid environment. Use 'staging' or 'production'"
fi

# Set environment-specific variables
if [[ "$ENVIRONMENT" == "production" ]]; then
    PROJECT_DIR="/opt/${PROJECT_NAME}-production"
    COMPOSE_FILE="docker-compose.production.yml"
    DB_NAME="peppertree"
else
    PROJECT_DIR="/opt/${PROJECT_NAME}-staging"
    COMPOSE_FILE="docker-compose.staging.yml"
    DB_NAME="peppertree_staging"
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Navigate to project directory
cd "$PROJECT_DIR" || error "Failed to navigate to $PROJECT_DIR"

# Generate backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILENAME="backup_${ENVIRONMENT}_${TIMESTAMP}.sql"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILENAME"

log "Creating backup: $BACKUP_FILENAME"

# Create database backup
if docker-compose -f "$COMPOSE_FILE" exec -T db pg_dump -U postgres "$DB_NAME" > "$BACKUP_PATH"; then
    log "Backup created successfully: $BACKUP_PATH"
    
    # Compress the backup
    gzip "$BACKUP_PATH"
    log "Backup compressed: ${BACKUP_PATH}.gz"
    
    # Set proper permissions
    chmod 600 "${BACKUP_PATH}.gz"
    
    # Show backup size
    BACKUP_SIZE=$(du -h "${BACKUP_PATH}.gz" | cut -f1)
    log "Backup size: $BACKUP_SIZE"
else
    error "Failed to create backup"
fi

# Clean up old backups
log "Cleaning up backups older than $RETENTION_DAYS days"
find "$BACKUP_DIR" -name "backup_${ENVIRONMENT}_*.sql.gz" -mtime +$RETENTION_DAYS -delete
REMAINING_BACKUPS=$(find "$BACKUP_DIR" -name "backup_${ENVIRONMENT}_*.sql.gz" | wc -l)
log "Remaining backups for $ENVIRONMENT: $REMAINING_BACKUPS"

log "Backup process completed"