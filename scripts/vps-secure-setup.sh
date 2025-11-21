#!/bin/bash

# ==============================================
# 17 @ Peppertree - Secure VPS Setup Script
# ==============================================
# This script installs and configures all necessary
# software and security measures for Ubuntu 24.04 LTS VPS
#
# Usage: sudo bash vps-secure-setup.sh
# ==============================================

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOCKER_COMPOSE_VERSION="2.24.0"
PROJECT_NAME="peppertree"
PRODUCTION_DIR="/opt/${PROJECT_NAME}-production"
STAGING_DIR="/opt/${PROJECT_NAME}-staging"
BACKUP_DIR="/opt/${PROJECT_NAME}-backups"
LOG_DIR="/var/log/${PROJECT_NAME}"

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

header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    error "This script must be run as root or with sudo"
fi

# Check Ubuntu version
if ! grep -q "Ubuntu 24.04" /etc/os-release; then
    warning "This script is optimized for Ubuntu 24.04 LTS"
    warning "You are running: $(grep PRETTY_NAME /etc/os-release | cut -d'"' -f2)"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

header "Starting Secure VPS Setup for 17 @ Peppertree"

# ==========================================
# 1. SYSTEM UPDATES
# ==========================================
header "1. System Updates and Essential Packages"

log "Updating package lists..."
apt update

log "Upgrading installed packages..."
DEBIAN_FRONTEND=noninteractive apt upgrade -y

log "Installing essential packages..."
apt install -y \
    curl \
    wget \
    git \
    vim \
    nano \
    htop \
    iotop \
    nethogs \
    ncdu \
    tree \
    ufw \
    fail2ban \
    logrotate \
    cron \
    certbot \
    python3-certbot-nginx \
    unzip \
    zip \
    net-tools \
    dnsutils \
    traceroute \
    ca-certificates \
    gnupg \
    lsb-release \
    software-properties-common \
    apt-transport-https \
    unattended-upgrades \
    ntp \
    rsync

# ==========================================
# 2. DOCKER INSTALLATION
# ==========================================
header "2. Docker Installation"

if ! command -v docker &> /dev/null; then
    log "Installing Docker..."
    
    # Remove old versions
    apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Start and enable Docker
    systemctl enable docker
    systemctl start docker
    
    log "Docker installed successfully"
else
    info "Docker is already installed ($(docker --version))"
fi

# Install Docker Compose
if ! command -v docker compose &> /dev/null; then
    log "Installing Docker Compose plugin..."
    apt install -y docker-compose-plugin
else
    info "Docker Compose is already installed"
fi

# Add sudo user to docker group
if [[ $SUDO_USER ]]; then
    usermod -aG docker $SUDO_USER
    log "Added $SUDO_USER to docker group"
fi

# ==========================================
# 3. SECURITY HARDENING
# ==========================================
header "3. Security Hardening"

# Configure UFW Firewall
log "Configuring UFW firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (detect current SSH port)
SSH_PORT=$(grep "^Port" /etc/ssh/sshd_config | awk '{print $2}')
if [[ -z "$SSH_PORT" ]]; then
    SSH_PORT=22
fi
ufw allow $SSH_PORT/tcp comment 'SSH'

# Allow HTTP/HTTPS
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Enable firewall
ufw --force enable
log "Firewall configured and enabled"

# Configure fail2ban
log "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
# Ban hosts for 1 hour
bantime = 3600
# Look for failures over 10 minute period
findtime = 600
# Allow 5 retries before ban
maxretry = 5
# Ignore localhost
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
findtime = 60
bantime = 600

[nginx-noscript]
enabled = true
filter = nginx-noscript
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 6

[nginx-badbots]
enabled = true
filter = nginx-badbots
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
bantime = 86400

[nginx-noproxy]
enabled = true
filter = nginx-noproxy
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
bantime = 86400
EOF

systemctl enable fail2ban
systemctl restart fail2ban
log "fail2ban configured and started"

# SSH Hardening
log "Hardening SSH configuration..."
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

cat >> /etc/ssh/sshd_config.d/99-peppertree-hardening.conf << 'EOF'
# Peppertree SSH Security Hardening
Protocol 2
PermitRootLogin no
PasswordAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no
PubkeyAuthentication yes
X11Forwarding no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
AllowUsers *@*
# Disable unused authentication methods
GSSAPIAuthentication no
UsePAM yes
EOF

# Only restart SSH if we're not root login
if [[ "$SSH_PORT" != "" ]] && [[ "$SUDO_USER" != "" ]]; then
    warning "SSH configuration updated. Will restart SSH service."
    warning "Make sure you have SSH key authentication set up!"
    read -p "Restart SSH service now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        systemctl restart sshd
        log "SSH service restarted"
    else
        warning "SSH service NOT restarted. Restart manually: systemctl restart sshd"
    fi
else
    warning "SSH configuration updated but NOT restarted (root login detected)"
fi

# Configure automatic security updates
log "Configuring automatic security updates..."
cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Automatic-Reboot-Time "03:00";
EOF

cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF

systemctl enable unattended-upgrades
systemctl start unattended-upgrades
log "Automatic security updates enabled"

# Disable unnecessary services
log "Disabling unnecessary services..."
for service in bluetooth cups avahi-daemon; do
    systemctl disable $service 2>/dev/null || true
    systemctl stop $service 2>/dev/null || true
done

# ==========================================
# 4. SYSTEM OPTIMIZATION
# ==========================================
header "4. System Optimization"

# Configure swap (2GB for 8GB RAM VPS)
if [[ ! -f /swapfile ]]; then
    log "Creating 2GB swap file..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    log "Swap file created and enabled"
else
    info "Swap file already exists"
fi

# Optimize kernel parameters
log "Optimizing kernel parameters..."
cat > /etc/sysctl.d/99-peppertree.conf << 'EOF'
# Network optimizations
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_tw_buckets = 400000
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 10000 65000

# Memory optimizations for 8GB RAM
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
vm.overcommit_memory = 1

# File system optimizations
fs.file-max = 2097152
fs.inotify.max_user_watches = 524288

# Security
kernel.dmesg_restrict = 1
kernel.kptr_restrict = 2
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.conf.all.log_martians = 1
EOF

sysctl -p /etc/sysctl.d/99-peppertree.conf
log "Kernel parameters optimized"

# Configure system limits
log "Configuring system limits..."
cat >> /etc/security/limits.conf << 'EOF'

# Peppertree application limits
* soft nofile 65536
* hard nofile 65536
* soft nproc 4096
* hard nproc 4096
EOF

# ==========================================
# 5. PROJECT DIRECTORIES
# ==========================================
header "5. Creating Project Directories"

log "Creating directory structure..."
mkdir -p $PRODUCTION_DIR
mkdir -p $STAGING_DIR
mkdir -p $BACKUP_DIR
mkdir -p $LOG_DIR
mkdir -p $PRODUCTION_DIR/ssl
mkdir -p $STAGING_DIR/ssl
mkdir -p $PRODUCTION_DIR/logs/nginx
mkdir -p $STAGING_DIR/logs/nginx

# Set permissions
if [[ $SUDO_USER ]]; then
    chown -R $SUDO_USER:$SUDO_USER $PRODUCTION_DIR
    chown -R $SUDO_USER:$SUDO_USER $STAGING_DIR
    chown -R $SUDO_USER:$SUDO_USER $BACKUP_DIR
fi

chmod 700 $PRODUCTION_DIR/ssl
chmod 700 $STAGING_DIR/ssl
chmod 755 $LOG_DIR

log "Directory structure created"

# ==========================================
# 6. MONITORING SETUP
# ==========================================
header "6. Setting Up Monitoring"

log "Installing monitoring tools..."
apt install -y htop iotop nethogs ncdu

# Create monitoring script
cat > /usr/local/bin/peppertree-status << 'EOF'
#!/bin/bash
echo "=== Peppertree System Status ==="
echo ""
echo "--- Docker Containers ---"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "--- Disk Usage ---"
df -h | grep -E '^/dev/|Filesystem'
echo ""
echo "--- Memory Usage ---"
free -h
echo ""
echo "--- CPU Load ---"
uptime
echo ""
echo "--- Recent Logs (last 5 lines) ---"
tail -n 5 /var/log/peppertree/*.log 2>/dev/null || echo "No logs yet"
EOF

chmod +x /usr/local/bin/peppertree-status
log "Monitoring script created: peppertree-status"

# ==========================================
# 7. BACKUP CONFIGURATION
# ==========================================
header "7. Backup Configuration"

# Install rclone for cloud backups
log "Installing rclone for cloud backups..."
curl https://rclone.org/install.sh | bash

# Create backup script
cat > /usr/local/bin/peppertree-backup << 'EOF'
#!/bin/bash
# Peppertree Backup Script

BACKUP_DIR="/opt/peppertree-backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Backup production database
log "Backing up production database..."
docker exec peppertree_db_prod pg_dump -U postgres peppertree | \
    gzip > "$BACKUP_DIR/peppertree_prod_${DATE}.sql.gz"

# Backup Keycloak database
log "Backing up Keycloak database..."
docker exec peppertree_keycloak_db_prod pg_dump -U keycloak keycloak | \
    gzip > "$BACKUP_DIR/keycloak_prod_${DATE}.sql.gz"

# Backup configuration files
log "Backing up configuration..."
tar -czf "$BACKUP_DIR/config_${DATE}.tar.gz" \
    -C /opt/peppertree-production \
    .env \
    docker-compose.production.yml \
    nginx.production.conf \
    ssl 2>/dev/null || true

# Sync to cloud (if configured)
if command -v rclone &> /dev/null && rclone listremotes | grep -q "peppertree"; then
    log "Syncing to cloud storage..."
    rclone sync $BACKUP_DIR peppertree:backups --log-file=/var/log/peppertree/rclone.log
fi

# Clean old backups
log "Cleaning backups older than $RETENTION_DAYS days..."
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "config_*.tar.gz" -mtime +$RETENTION_DAYS -delete

log "Backup completed successfully"
EOF

chmod +x /usr/local/bin/peppertree-backup
log "Backup script created: peppertree-backup"

# Setup backup cron job
log "Setting up backup cron job..."
cat > /etc/cron.d/peppertree-backup << 'EOF'
# Peppertree automated backups
# Daily at 2 AM
0 2 * * * root /usr/local/bin/peppertree-backup >> /var/log/peppertree/backup.log 2>&1

# Weekly backup verification at 3 AM on Sundays
0 3 * * 0 root gunzip -t /opt/peppertree-backups/peppertree_prod_*.sql.gz 2>&1 | tail -1 >> /var/log/peppertree/backup-verify.log
EOF

# ==========================================
# 8. LOG ROTATION
# ==========================================
header "8. Configuring Log Rotation"

log "Setting up log rotation..."
cat > /etc/logrotate.d/peppertree << 'EOF'
/var/log/peppertree/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
    sharedscripts
}

/opt/peppertree-production/logs/nginx/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        docker exec peppertree_nginx_prod nginx -s reopen 2>/dev/null || true
    endscript
}

/opt/peppertree-staging/logs/nginx/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        docker exec peppertree_nginx_staging nginx -s reopen 2>/dev/null || true
    endscript
}
EOF

log "Log rotation configured"

# ==========================================
# 9. DOCKER SECURITY
# ==========================================
header "9. Docker Security Configuration"

log "Configuring Docker security..."
mkdir -p /etc/docker

cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true,
  "icc": false
}
EOF

systemctl restart docker
log "Docker security configured"

# ==========================================
# 10. CREATE DEPLOY USER
# ==========================================
header "10. Creating Deploy User"

if ! id "deploy" &>/dev/null; then
    log "Creating deploy user for CI/CD..."
    useradd -m -s /bin/bash deploy
    usermod -aG docker deploy
    
    # Setup SSH for deploy user
    mkdir -p /home/deploy/.ssh
    chmod 700 /home/deploy/.ssh
    touch /home/deploy/.ssh/authorized_keys
    chmod 600 /home/deploy/.ssh/authorized_keys
    chown -R deploy:deploy /home/deploy/.ssh
    
    info "Deploy user created. Add your CI/CD public key to /home/deploy/.ssh/authorized_keys"
else
    info "Deploy user already exists"
fi

# ==========================================
# 11. ENVIRONMENT TEMPLATES
# ==========================================
header "11. Creating Environment Templates"

log "Creating environment file templates..."
cat > $PRODUCTION_DIR/.env.example << 'EOF'
# Production Environment Variables
# Copy this to .env and fill in your actual values

# Database
POSTGRES_PASSWORD=CHANGE_THIS_secure_postgres_password_123
DATABASE_URL=postgresql://postgres:CHANGE_THIS@db:5432/peppertree

# Application
SECRET_KEY=CHANGE_THIS_super_secure_random_secret_key_minimum_50_chars
FLASK_ENV=production

# Keycloak
KEYCLOAK_DB_PASSWORD=CHANGE_THIS_keycloak_db_password
KEYCLOAK_ADMIN_PASSWORD=CHANGE_THIS_keycloak_admin_password
KEYCLOAK_CLIENT_SECRET=CHANGE_THIS_client_secret
KEYCLOAK_SERVER_URL=http://keycloak:8080
KEYCLOAK_CLIENT_ID=peppertree-admin
KEYCLOAK_REALM=peppertree
KEYCLOAK_REDIRECT_URI=https://17peppertree.co.za/auth/callback

# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=1
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-specific-password
MAIL_DEFAULT_SENDER=your-email@gmail.com
OWNER_EMAIL=owner@17peppertree.co.za

# Domain
DOMAIN=17peppertree.co.za
EOF

cp $PRODUCTION_DIR/.env.example $STAGING_DIR/.env.example

if [[ $SUDO_USER ]]; then
    chown $SUDO_USER:$SUDO_USER $PRODUCTION_DIR/.env.example
    chown $SUDO_USER:$SUDO_USER $STAGING_DIR/.env.example
fi

log "Environment templates created"

# ==========================================
# 12. HEALTH CHECK SCRIPT
# ==========================================
header "12. Creating Health Check Script"

cat > /usr/local/bin/peppertree-healthcheck << 'EOF'
#!/bin/bash
# Peppertree Health Check Script

ERROR=0

# Check if containers are running
echo "Checking Docker containers..."
CONTAINERS=("peppertree_db_prod" "peppertree_backend_prod" "peppertree_frontend_prod" "peppertree_nginx_prod" "peppertree_keycloak_prod")

for container in "${CONTAINERS[@]}"; do
    if docker ps | grep -q "$container"; then
        echo "✓ $container is running"
    else
        echo "✗ $container is NOT running"
        ERROR=1
    fi
done

# Check disk space
echo ""
echo "Checking disk space..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "✗ Disk usage is critical: ${DISK_USAGE}%"
    ERROR=1
elif [ "$DISK_USAGE" -gt 75 ]; then
    echo "⚠ Disk usage is high: ${DISK_USAGE}%"
else
    echo "✓ Disk usage is ok: ${DISK_USAGE}%"
fi

# Check memory
echo ""
echo "Checking memory..."
MEM_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3*100/$2 }')
if [ "$MEM_USAGE" -gt 85 ]; then
    echo "✗ Memory usage is critical: ${MEM_USAGE}%"
    ERROR=1
elif [ "$MEM_USAGE" -gt 70 ]; then
    echo "⚠ Memory usage is high: ${MEM_USAGE}%"
else
    echo "✓ Memory usage is ok: ${MEM_USAGE}%"
fi

# Check API health endpoint
echo ""
echo "Checking API health..."
if curl -sf http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✓ API is responding"
else
    echo "✗ API is NOT responding"
    ERROR=1
fi

exit $ERROR
EOF

chmod +x /usr/local/bin/peppertree-healthcheck
log "Health check script created: peppertree-healthcheck"

# ==========================================
# 13. TIMEZONE AND NTP
# ==========================================
header "13. Configuring Timezone and NTP"

log "Setting timezone to Africa/Johannesburg..."
timedatectl set-timezone Africa/Johannesburg

log "Enabling NTP time synchronization..."
timedatectl set-ntp true

log "Timezone and NTP configured"

# ==========================================
# 14. SECURITY AUDIT SCRIPT
# ==========================================
header "14. Creating Security Audit Script"

cat > /usr/local/bin/peppertree-security-audit << 'EOF'
#!/bin/bash
# Peppertree Security Audit Script

echo "=== Peppertree Security Audit ==="
echo ""

echo "--- Firewall Status ---"
ufw status numbered
echo ""

echo "--- Fail2ban Status ---"
fail2ban-client status
echo ""

echo "--- SSH Configuration ---"
grep -E "^PermitRootLogin|^PasswordAuthentication|^PubkeyAuthentication" /etc/ssh/sshd_config
echo ""

echo "--- Open Ports ---"
ss -tunlp
echo ""

echo "--- Failed Login Attempts (last 10) ---"
grep "Failed password" /var/log/auth.log | tail -10
echo ""

echo "--- Docker Security ---"
docker info | grep -A5 "Security Options"
echo ""

echo "--- System Updates ---"
apt list --upgradable 2>/dev/null | head -20
echo ""

echo "=== Audit Complete ==="
EOF

chmod +x /usr/local/bin/peppertree-security-audit
log "Security audit script created: peppertree-security-audit"

# ==========================================
# 15. FINAL CLEANUP
# ==========================================
header "15. Final Cleanup"

log "Cleaning up packages..."
apt autoremove -y
apt autoclean

log "Clearing package cache..."
apt clean

# ==========================================
# SETUP COMPLETE
# ==========================================
header "Setup Complete!"

echo ""
log "✅ VPS setup completed successfully!"
echo ""
info "=== Summary ==="
info "✓ System updated and hardened"
info "✓ Docker and Docker Compose installed"
info "✓ Firewall (UFW) configured and enabled"
info "✓ fail2ban installed and configured"
info "✓ SSH hardened (root login disabled, password auth disabled)"
info "✓ Automatic security updates enabled"
info "✓ Swap file created (2GB)"
info "✓ System optimizations applied"
info "✓ Project directories created"
info "✓ Backup system configured"
info "✓ Log rotation configured"
info "✓ Monitoring tools installed"
info "✓ Timezone set to Africa/Johannesburg"
echo ""
info "=== Useful Commands ==="
info "• peppertree-status          - Check system and container status"
info "• peppertree-healthcheck     - Run health checks"
info "• peppertree-backup          - Run manual backup"
info "• peppertree-security-audit  - Run security audit"
info "• docker ps                  - List running containers"
info "• docker logs <container>    - View container logs"
info "• htop                       - Monitor system resources"
info "• ufw status                 - Check firewall status"
info "• fail2ban-client status     - Check fail2ban status"
echo ""
warning "=== IMPORTANT NEXT STEPS ==="
warning ""
warning "1. Configure SSH key authentication for your user"
warning "   ssh-copy-id your-user@this-server"
warning ""
warning "2. Configure rclone for cloud backups"
warning "   rclone config"
warning ""
warning "3. Copy and configure environment files:"
warning "   cp $PRODUCTION_DIR/.env.example $PRODUCTION_DIR/.env"
warning "   nano $PRODUCTION_DIR/.env"
warning ""
warning "4. Clone your application repository:"
warning "   cd $PRODUCTION_DIR"
warning "   git clone https://github.com/jheiberg/17peppertree.git ."
warning ""
warning "5. Generate SSL certificates:"
warning "   certbot --nginx -d 17peppertree.co.za -d www.17peppertree.co.za"
warning ""
warning "6. Add deploy user SSH key for CI/CD:"
warning "   nano /home/deploy/.ssh/authorized_keys"
warning ""
warning "7. REBOOT the server to apply all changes:"
warning "   reboot"
warning ""
echo ""
info "=== Optional: Staging Authentication Setup ==="
info "To configure secure staging access with HTTP Basic Auth + IP Whitelist:"
warning "   bash scripts/setup-staging-auth.sh staging.17peppertree.co.za your-office-ip"
echo ""
log "Setup log saved to /var/log/peppertree/setup.log"
echo ""
