#!/bin/bash

# ==============================================
# 17 @ Peppertree - Server Setup Script
# ==============================================

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    error "This script must be run as root or with sudo"
fi

log "Starting server setup for 17 @ Peppertree"

# Update system packages
log "Updating system packages"
apt update && apt upgrade -y

# Install essential packages
log "Installing essential packages"
apt install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    ufw \
    fail2ban \
    logrotate \
    cron \
    certbot \
    python3-certbot-nginx \
    unzip

# Install Docker
log "Installing Docker"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Add current user to docker group (if not root)
    if [[ $SUDO_USER ]]; then
        usermod -aG docker $SUDO_USER
        log "Added $SUDO_USER to docker group"
    fi
else
    info "Docker is already installed"
fi

# Install Docker Compose
log "Installing Docker Compose"
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION="2.21.0"
    curl -L "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    info "Docker Compose is already installed"
fi

# Configure firewall
log "Configuring firewall"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8080/tcp  # For staging
ufw --force enable

# Configure fail2ban
log "Configuring fail2ban"
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
EOF

systemctl enable fail2ban
systemctl restart fail2ban

# Create project directories
log "Creating project directories"
mkdir -p /opt/peppertree-production
mkdir -p /opt/peppertree-staging
mkdir -p /opt/peppertree-backups
mkdir -p /var/log/peppertree

# Set proper permissions
chown -R $SUDO_USER:$SUDO_USER /opt/peppertree-* 2>/dev/null || true
chmod -R 755 /opt/peppertree-*

# Create deploy user (optional, for CI/CD)
log "Creating deploy user"
if ! id "deploy" &>/dev/null; then
    useradd -m -s /bin/bash deploy
    usermod -aG docker deploy
    
    # Setup SSH for deploy user
    mkdir -p /home/deploy/.ssh
    chmod 700 /home/deploy/.ssh
    touch /home/deploy/.ssh/authorized_keys
    chmod 600 /home/deploy/.ssh/authorized_keys
    chown -R deploy:deploy /home/deploy/.ssh
    
    info "Deploy user created. Add your CI/CD public key to /home/deploy/.ssh/authorized_keys"
fi

# Configure log rotation
log "Configuring log rotation"
cat > /etc/logrotate.d/peppertree << EOF
/var/log/peppertree/*.log {
    weekly
    rotate 52
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}

/opt/peppertree-*/logs/*/*.log {
    weekly
    rotate 52
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
EOF

# Setup backup cron job
log "Setting up backup cron job"
cat > /etc/cron.d/peppertree-backup << EOF
# Daily backup at 2 AM
0 2 * * * root /opt/peppertree-production/scripts/backup.sh production >> /var/log/peppertree/backup.log 2>&1

# Weekly backup cleanup at 3 AM on Sundays
0 3 * * 0 root find /opt/peppertree-backups -name "backup_*.sql.gz" -mtime +30 -delete
EOF

# Configure system limits
log "Configuring system limits"
cat >> /etc/security/limits.conf << EOF

# Peppertree application limits
* soft nofile 65536
* hard nofile 65536
* soft nproc 4096
* hard nproc 4096
EOF

# Optimize kernel parameters
log "Optimizing kernel parameters"
cat > /etc/sysctl.d/99-peppertree.conf << EOF
# Network optimizations
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_tw_buckets = 400000

# Memory optimizations
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5

# File system optimizations
fs.file-max = 2097152
EOF

sysctl -p /etc/sysctl.d/99-peppertree.conf

# Install monitoring tools (optional)
log "Installing monitoring tools"
apt install -y htop iotop nethogs

# Setup SSL certificate directories
log "Setting up SSL certificate directories"
mkdir -p /opt/peppertree-production/ssl
mkdir -p /opt/peppertree-staging/ssl
chmod 700 /opt/peppertree-*/ssl

# Create environment file templates
log "Creating environment file templates"
cat > /opt/peppertree-production/.env.example << EOF
# Production Environment Variables
POSTGRES_PASSWORD=your_secure_postgres_password
SECRET_KEY=your_super_secure_secret_key_change_this
REDIS_PASSWORD=your_redis_password

# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=your-email@gmail.com
OWNER_EMAIL=owner@example.com

# Docker Hub
DOCKER_HUB_USERNAME=your-dockerhub-username

# Optional: Slack notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/your/webhook/url
EOF

cp /opt/peppertree-production/.env.example /opt/peppertree-staging/.env.example

# Set proper ownership
chown -R $SUDO_USER:$SUDO_USER /opt/peppertree-* 2>/dev/null || true

log "=== Server Setup Complete ==="
info "Next steps:"
info "1. Copy your environment files:"
info "   cp /opt/peppertree-production/.env.example /opt/peppertree-production/.env"
info "   cp /opt/peppertree-staging/.env.example /opt/peppertree-staging/.env"
info ""
info "2. Edit the .env files with your actual values"
info ""
info "3. Clone your repository:"
info "   cd /opt/peppertree-production && git clone <your-repo> ."
info "   cd /opt/peppertree-staging && git clone <your-repo> ."
info ""
info "4. Generate SSL certificates:"
info "   certbot --nginx -d your-domain.com -d www.your-domain.com"
info ""
info "5. Update nginx.production.conf with your domain name"
info ""
info "6. Run your first deployment:"
info "   /opt/peppertree-production/scripts/deploy.sh production"

warning "Don't forget to:"
warning "- Add your CI/CD public key to /home/deploy/.ssh/authorized_keys"
warning "- Update your DNS records to point to this server"
warning "- Configure your GitHub secrets for CI/CD"

log "Server setup completed successfully!"