#!/bin/bash

# ==============================================
# 17 @ Peppertree - Staging Authentication Setup
# ==============================================
# This script configures secure staging access using
# HTTP Basic Auth + IP Whitelist
#
# Usage: sudo bash setup-staging-auth.sh [staging-domain] [office-ip]
# Example: sudo bash setup-staging-auth.sh staging.17peppertree.co.za 102.165.34.56
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

# Configuration
STAGING_DOMAIN=${1:-"staging.17peppertree.co.za"}
OFFICE_IP=${2:-""}
STAGING_DIR="/opt/peppertree-staging"
HTPASSWD_FILE="/etc/nginx/.htpasswd-staging"

header "Setting Up Staging Authentication"

info "Staging domain: $STAGING_DOMAIN"
if [[ -n "$OFFICE_IP" ]]; then
    info "Office IP to whitelist: $OFFICE_IP"
fi

# ==========================================
# 1. INSTALL PREREQUISITES
# ==========================================
header "1. Installing Prerequisites"

log "Installing apache2-utils for htpasswd..."
apt install -y apache2-utils

# ==========================================
# 2. CREATE PASSWORD FILE
# ==========================================
header "2. Creating Password File"

if [[ -f "$HTPASSWD_FILE" ]]; then
    warning "Password file already exists at $HTPASSWD_FILE"
    read -p "Do you want to recreate it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Keeping existing password file"
    else
        rm -f "$HTPASSWD_FILE"
        log "Removed existing password file"
    fi
fi

if [[ ! -f "$HTPASSWD_FILE" ]]; then
    log "Creating staging password file..."
    
    # Create first user
    echo ""
    info "Create the first staging user (usually 'admin' or 'developer')"
    read -p "Enter username: " USERNAME
    
    htpasswd -c "$HTPASSWD_FILE" "$USERNAME"
    
    log "Password file created successfully"
    
    # Option to add more users
    while true; do
        echo ""
        read -p "Add another user? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            break
        fi
        
        read -p "Enter username: " USERNAME
        htpasswd "$HTPASSWD_FILE" "$USERNAME"
    done
fi

# Set proper permissions
chmod 644 "$HTPASSWD_FILE"
log "Password file permissions set"

# Show users
echo ""
info "Current staging users:"
cat "$HTPASSWD_FILE" | cut -d: -f1 | while read user; do
    echo "  • $user"
done

# ==========================================
# 3. GET IP ADDRESSES FOR WHITELIST
# ==========================================
header "3. IP Whitelist Configuration"

WHITELIST_IPS=()

# Add office IP if provided
if [[ -n "$OFFICE_IP" ]]; then
    WHITELIST_IPS+=("$OFFICE_IP")
    log "Added office IP: $OFFICE_IP"
fi

# Detect current IP
CURRENT_IP=$(curl -s ifconfig.me || echo "")
if [[ -n "$CURRENT_IP" ]]; then
    info "Your current IP address is: $CURRENT_IP"
    read -p "Add this IP to whitelist? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        WHITELIST_IPS+=("$CURRENT_IP")
        log "Added current IP: $CURRENT_IP"
    fi
fi

# Option to add more IPs
while true; do
    echo ""
    read -p "Add another IP to whitelist? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        break
    fi
    
    read -p "Enter IP address: " MANUAL_IP
    if [[ -n "$MANUAL_IP" ]]; then
        WHITELIST_IPS+=("$MANUAL_IP")
        log "Added IP: $MANUAL_IP"
    fi
done

# Option for no IP whitelist
if [[ ${#WHITELIST_IPS[@]} -eq 0 ]]; then
    warning "No IPs added to whitelist"
    info "Staging will be accessible from any IP (password protected only)"
    read -p "Continue without IP whitelist? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Setup cancelled. Run script again with IP addresses."
    fi
fi

# ==========================================
# 4. CREATE NGINX CONFIGURATION
# ==========================================
header "4. Creating Nginx Configuration"

log "Generating nginx configuration for staging..."

mkdir -p "$STAGING_DIR"

# Generate IP whitelist lines
NGINX_WHITELIST=""
if [[ ${#WHITELIST_IPS[@]} -gt 0 ]]; then
    for ip in "${WHITELIST_IPS[@]}"; do
        NGINX_WHITELIST+="        allow $ip;        # Added by setup script\n"
    done
    NGINX_WHITELIST+="        allow 127.0.0.1;     # Localhost\n"
    NGINX_WHITELIST+="        deny all;            # Deny all others\n"
else
    NGINX_WHITELIST="        # No IP whitelist configured - accessible from any IP\n"
fi

cat > "$STAGING_DIR/nginx.staging-auth.conf" << EOF
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/staging-access.log;
    error_log /var/log/nginx/staging-error.log;

    sendfile on;
    keepalive_timeout 65;
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Upstream backends
    upstream staging_frontend {
        server frontend:3000;
    }
    
    upstream staging_backend {
        server backend:5000;
    }
    
    upstream staging_keycloak {
        server keycloak:8080;
    }

    # HTTPS Server (Production - requires SSL certificate)
    server {
        listen 443 ssl http2;
        server_name $STAGING_DOMAIN;

        # SSL certificates (configure after running certbot)
        ssl_certificate /etc/letsencrypt/live/$STAGING_DOMAIN/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/$STAGING_DOMAIN/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # ==========================================
        # LAYER 1: IP WHITELIST
        # ==========================================
$NGINX_WHITELIST

        # ==========================================
        # LAYER 2: HTTP BASIC AUTHENTICATION
        # ==========================================
        auth_basic "Staging Environment - Authorized Access Only";
        auth_basic_user_file /etc/nginx/.htpasswd-staging;

        # ==========================================
        # SECURITY HEADERS
        # ==========================================
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Robots-Tag "noindex, nofollow, noarchive" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # API routes
        location /api/ {
            proxy_pass http://staging_backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Keycloak auth routes
        location /auth/ {
            proxy_pass http://staging_keycloak/auth/;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Frontend
        location / {
            proxy_pass http://staging_frontend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # robots.txt to prevent indexing
        location = /robots.txt {
            add_header Content-Type text/plain;
            return 200 "User-agent: *\nDisallow: /\n";
        }
    }

    # HTTP Server (redirect to HTTPS)
    server {
        listen 80;
        server_name $STAGING_DOMAIN;
        
        # IP whitelist for HTTP too
$NGINX_WHITELIST
        
        return 301 https://\$server_name\$request_uri;
    }

    # HTTP-only server for testing (port 8080)
    # Use this before SSL certificate is configured
    server {
        listen 8080;
        server_name $STAGING_DOMAIN;

        # IP whitelist
$NGINX_WHITELIST

        # Basic Auth
        auth_basic "Staging Environment - Authorized Access Only";
        auth_basic_user_file /etc/nginx/.htpasswd-staging;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Robots-Tag "noindex, nofollow, noarchive" always;

        # API routes
        location /api/ {
            proxy_pass http://staging_backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Keycloak
        location /auth/ {
            proxy_pass http://staging_keycloak/auth/;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Frontend
        location / {
            proxy_pass http://staging_frontend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        location = /robots.txt {
            add_header Content-Type text/plain;
            return 200 "User-agent: *\nDisallow: /\n";
        }
    }
}
EOF

log "Nginx configuration created at $STAGING_DIR/nginx.staging-auth.conf"

# ==========================================
# 5. UPDATE DOCKER COMPOSE
# ==========================================
header "5. Creating Docker Compose Configuration"

log "Updating docker-compose.staging.yml with authentication..."

# Backup existing if present
if [[ -f "$STAGING_DIR/docker-compose.staging.yml" ]]; then
    cp "$STAGING_DIR/docker-compose.staging.yml" "$STAGING_DIR/docker-compose.staging.yml.backup"
    log "Backed up existing docker-compose.staging.yml"
fi

cat > "$STAGING_DIR/docker-compose-staging-notes.txt" << EOF
# Docker Compose Staging Notes
# Generated: $(date)

To use the staging authentication, update your docker-compose.staging.yml:

services:
  nginx:
    image: nginx:alpine
    container_name: peppertree_nginx_staging
    ports:
      - "8443:443"  # HTTPS (after SSL cert)
      - "8080:8080" # HTTP (testing before SSL)
    volumes:
      - ./nginx.staging-auth.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt/live/$STAGING_DOMAIN:/etc/letsencrypt/live/$STAGING_DOMAIN:ro
      - /etc/nginx/.htpasswd-staging:/etc/nginx/.htpasswd-staging:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - frontend
      - backend
      - keycloak
    networks:
      - peppertree_network
    restart: unless-stopped

Make sure to:
1. Generate SSL certificate: certbot certonly --standalone -d $STAGING_DOMAIN
2. Update DNS: Add A record for $STAGING_DOMAIN pointing to this VPS
3. Deploy: docker compose -f docker-compose.staging.yml up -d
EOF

log "Docker compose notes created at $STAGING_DIR/docker-compose-staging-notes.txt"

# ==========================================
# 6. CREATE MANAGEMENT SCRIPT
# ==========================================
header "6. Creating User Management Script"

cat > /usr/local/bin/staging-users << 'EOF'
#!/bin/bash
# Staging User Management Script

HTPASSWD_FILE="/etc/nginx/.htpasswd-staging"

case "$1" in
    add)
        if [[ -z "$2" ]]; then
            echo "Usage: staging-users add <username>"
            exit 1
        fi
        sudo htpasswd "$HTPASSWD_FILE" "$2"
        echo "User added. Restart staging nginx: docker restart peppertree_nginx_staging"
        ;;
    remove)
        if [[ -z "$2" ]]; then
            echo "Usage: staging-users remove <username>"
            exit 1
        fi
        sudo htpasswd -D "$HTPASSWD_FILE" "$2"
        echo "User removed. Restart staging nginx: docker restart peppertree_nginx_staging"
        ;;
    list)
        echo "Current staging users:"
        cat "$HTPASSWD_FILE" | cut -d: -f1 | while read user; do
            echo "  • $user"
        done
        ;;
    password)
        if [[ -z "$2" ]]; then
            echo "Usage: staging-users password <username>"
            exit 1
        fi
        sudo htpasswd "$HTPASSWD_FILE" "$2"
        echo "Password updated. Restart staging nginx: docker restart peppertree_nginx_staging"
        ;;
    *)
        echo "Staging User Management"
        echo ""
        echo "Usage: staging-users <command> [username]"
        echo ""
        echo "Commands:"
        echo "  add <username>      - Add a new user"
        echo "  remove <username>   - Remove a user"
        echo "  password <username> - Change user password"
        echo "  list                - List all users"
        echo ""
        echo "Examples:"
        echo "  staging-users add developer"
        echo "  staging-users remove olduser"
        echo "  staging-users password admin"
        echo "  staging-users list"
        ;;
esac
EOF

chmod +x /usr/local/bin/staging-users
log "User management script created: staging-users"

# ==========================================
# 7. FIREWALL CONFIGURATION
# ==========================================
header "7. Configuring Firewall"

log "Opening staging ports in firewall..."

# Open port 8080 for HTTP testing
ufw allow 8080/tcp comment 'Staging HTTP'

# Open port 8443 for HTTPS staging
ufw allow 8443/tcp comment 'Staging HTTPS'

ufw reload

log "Firewall rules updated"

# ==========================================
# SETUP COMPLETE
# ==========================================
header "Setup Complete!"

echo ""
log "✅ Staging authentication configured successfully!"
echo ""
info "=== Summary ==="
info "• Password file: $HTPASSWD_FILE"
info "• Nginx config: $STAGING_DIR/nginx.staging-auth.conf"
info "• Staging domain: $STAGING_DOMAIN"
if [[ ${#WHITELIST_IPS[@]} -gt 0 ]]; then
    info "• Whitelisted IPs:"
    for ip in "${WHITELIST_IPS[@]}"; do
        info "    - $ip"
    done
else
    warning "• No IP whitelist (accessible from any IP)"
fi
echo ""
info "=== Next Steps ==="
echo ""
info "1. Configure DNS record:"
warning "   Add A record: $STAGING_DOMAIN → $(curl -s ifconfig.me)"
echo ""
info "2. Test HTTP access first (no SSL):"
warning "   http://$STAGING_DOMAIN:8080"
warning "   Or: http://$(curl -s ifconfig.me):8080"
echo ""
info "3. Generate SSL certificate:"
warning "   sudo certbot certonly --standalone -d $STAGING_DOMAIN"
echo ""
info "4. Update docker-compose.staging.yml:"
warning "   See: $STAGING_DIR/docker-compose-staging-notes.txt"
echo ""
info "5. Deploy staging environment:"
warning "   cd $STAGING_DIR"
warning "   docker compose -f docker-compose.staging.yml up -d"
echo ""
info "6. Access staging:"
warning "   https://$STAGING_DOMAIN (after SSL configured)"
warning "   http://$STAGING_DOMAIN:8080 (before SSL)"
echo ""
info "=== User Management ==="
info "• Add user:        staging-users add username"
info "• Remove user:     staging-users remove username"
info "• Change password: staging-users password username"
info "• List users:      staging-users list"
echo ""
log "Setup completed successfully!"
echo ""
