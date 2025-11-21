# Staging Environment Guide

**Document Version:** 1.0  
**Last Updated:** 2025-11-21  
**Script:** `/scripts/setup-staging-auth.sh`

---

## Overview

This comprehensive guide explains how to set up and access a **secure staging environment** that is hidden from public view. Test changes before deploying to production without exposing work-in-progress to website visitors.

**Recommended Approach:** HTTP Basic Auth + IP Whitelist (implemented by setup script)

---

## Table of Contents

1. [Quick Setup (5 Minutes)](#quick-setup-5-minutes)
2. [What the Script Does](#what-the-script-does)
3. [Post-Setup Configuration](#post-setup-configuration)
4. [Access Methods Overview](#access-methods-overview)
5. [Alternative Setup Methods](#alternative-setup-methods)
6. [Managing Users](#managing-staging-users)
7. [Security Features](#security-features)
8. [Troubleshooting](#troubleshooting)

---

## Quick Setup (5 Minutes)

### Prerequisites

- VPS setup completed (`vps-secure-setup.sh` already run)
- Root or sudo access
- Staging subdomain DNS record (or will create after setup)

### Step 1: Run the Staging Setup Script

```bash
# Basic usage (will prompt for all values)
sudo bash scripts/setup-staging-auth.sh

# With parameters (faster)
sudo bash scripts/setup-staging-auth.sh staging.17peppertree.co.za 102.165.34.56

# Parameters:
# 1. Staging domain (subdomain you'll use)
# 2. Office/home IP to whitelist (optional)
```

### Step 2: Follow the Interactive Prompts

The script will ask you:

1. **First user credentials**
   ```
   Enter username: admin
   New password: [enter secure password]
   Re-type password: [confirm password]
   ```

2. **Additional users** (optional)
   ```
   Add another user? (y/n) y
   Enter username: developer
   ```

3. **IP whitelist**
   ```
   Your current IP address is: 102.165.34.56
   Add this IP to whitelist? (y/n) y
   
   Add another IP to whitelist? (y/n) y
   Enter IP address: 41.12.34.89
   ```

### Step 3: Configure DNS

Add an A record to your DNS:

```
Type: A
Name: staging
Value: your-vps-ip
TTL: 300 (5 minutes)
```

**Example:**
- If your main domain is `17peppertree.co.za`
- And VPS IP is `154.12.34.56`
- Create: `staging.17peppertree.co.za` → `154.12.34.56`

### Step 4: Test HTTP Access (No SSL Yet)

```bash
# Test from your browser or command line
curl -u admin:yourpassword http://staging.17peppertree.co.za:8080

# Or visit in browser (will prompt for password)
http://staging.17peppertree.co.za:8080
```

### Step 5: Generate SSL Certificate

```bash
# Stop any services using port 80/443
docker stop peppertree_nginx_prod 2>/dev/null || true

# Generate certificate
sudo certbot certonly --standalone -d staging.17peppertree.co.za

# Restart production services
docker start peppertree_nginx_prod 2>/dev/null || true
```

### Step 6: Deploy Staging

```bash
cd /opt/peppertree-staging

# Build and start staging environment
docker compose -f docker-compose.staging.yml up -d --build

# Monitor deployment
docker compose -f docker-compose.staging.yml logs -f
```

### Step 7: Access Staging (HTTPS)

Navigate to: `https://staging.17peppertree.co.za`

You'll see:
1. ✅ Browser password prompt
2. ✅ Enter username/password
3. ✅ Staging site loads

---

## What the Script Does

### 1. Installs Prerequisites
- `apache2-utils` (for htpasswd command)

### 2. Creates Password File
- Location: `/etc/nginx/.htpasswd-staging`
- Bcrypt encrypted passwords
- Multiple users supported

### 3. Configures IP Whitelist
- Detects your current IP
- Allows multiple IPs
- Optional (can skip for password-only)

### 4. Generates Nginx Config
- Full production-ready configuration
- Two-layer security (IP + password)
- Prevents search engine indexing
- WebSocket support
- HTTP → HTTPS redirect

### 5. Creates Management Tools
- `staging-users` command for user management
- Docker compose integration notes
- Firewall rules (ports 8080, 8443)

---

## Post-Setup Configuration

### Update Docker Compose for SSL

Edit `/opt/peppertree-staging/docker-compose.staging.yml`:

```yaml
services:
  nginx:
    image: nginx:alpine
    container_name: peppertree_nginx_staging
    ports:
      - "8443:443"  # HTTPS
      - "8080:8080" # HTTP
    volumes:
      - ./nginx.staging-auth.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt/live/staging.17peppertree.co.za:/etc/letsencrypt/live/staging.17peppertree.co.za:ro
      - /etc/nginx/.htpasswd-staging:/etc/nginx/.htpasswd-staging:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - frontend
      - backend
      - keycloak
    networks:
      - peppertree_network
    restart: unless-stopped
```

---

## Managing Staging Users

The script creates a convenient command: `staging-users`

### Add a User
```bash
staging-users add newuser
# Enter password when prompted
# Restart nginx: docker restart peppertree_nginx_staging
```

### Remove a User
```bash
staging-users remove olduser
docker restart peppertree_nginx_staging
```

### Change Password
```bash
staging-users password admin
docker restart peppertree_nginx_staging
```

### List All Users
```bash
staging-users list
```

---

## Access Methods Overview

You have **5 options** for keeping staging private:

### Method 1: Subdomain with HTTP Basic Auth ⭐ **RECOMMENDED**
- **URL:** `https://staging.17peppertree.co.za`
- **Security:** Password-protected
- **Effort:** Low (automated by script)
- **Best for:** Most use cases

### Method 2: Non-Standard Port
- **URL:** `http://your-vps-ip:8080`
- **Security:** Obscurity (port not publicly advertised)
- **Effort:** Very Low
- **Best for:** Quick testing, internal team

### Method 3: IP Whitelist Only
- **URL:** `https://staging.17peppertree.co.za`
- **Security:** Only specific IPs can access
- **Effort:** Medium
- **Best for:** Fixed office/home IP addresses

### Method 4: VPN Access
- **URL:** `http://internal-ip:8080`
- **Security:** Requires VPN connection
- **Effort:** High
- **Best for:** Maximum security, distributed teams

### Method 5: Host File + No DNS
- **URL:** `https://staging.peppertree.local`
- **Security:** No public DNS record
- **Effort:** Medium
- **Best for:** Developer testing only

---

## Alternative Setup Methods

### Method 2: Non-Standard Port (Manual Setup)

If you prefer simple port-based access without passwords:

**Docker Compose Configuration:**
```yaml
services:
  nginx:
    ports:
      - "8080:80"  # Staging on port 8080
```

**Firewall:**
```bash
sudo ufw allow 8080/tcp comment 'Staging HTTP'
```

**Access:**
```
http://your-vps-ip:8080
```

**Pros:**
- No password management
- Quick setup
- Easy for internal teams

**Cons:**
- Security through obscurity only
- Anyone with IP can access
- Port scanners will find it

---

### Method 3: IP Whitelist Only (Manual)

Restrict access by IP addresses only (no password):

**Nginx Configuration:**
```nginx
server {
    listen 8080;
    server_name staging.17peppertree.co.za;

    # Allow specific IPs
    allow 102.165.34.56;  # Office
    allow 41.12.34.89;    # Home
    allow 127.0.0.1;      # Localhost
    deny all;             # Block everyone else

    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Pros:**
- No password required
- Fast (IP check at network level)
- Good for fixed IPs

**Cons:**
- Requires static IPs
- Hard to manage remote workers
- IP changes require config update

---

### Method 4: VPN Access (Advanced)

Set up a VPN server and access staging through internal network:

**Options:**
- OpenVPN
- WireGuard (recommended - modern, fast)
- Tailscale (easiest)

**Example with Tailscale:**

```bash
# Install Tailscale on VPS
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Install on your device
# Visit: https://tailscale.com/download

# Access staging via Tailscale IP
http://100.x.x.x:8080
```

**Pros:**
- Maximum security
- No public exposure
- Encrypted tunnel
- Works from anywhere

**Cons:**
- Requires VPN client on all devices
- More complex setup
- Additional service to manage

---

### Method 5: Host File + No DNS (Developer Only)

For local development/testing without public DNS:

**On VPS:**
```bash
# Bind staging to localhost only
docker-compose.staging.yml:
  nginx:
    ports:
      - "127.0.0.1:8080:80"  # Only accessible from VPS itself
```

**On Your Computer:**

1. Edit hosts file:
   - **Linux/Mac:** `/etc/hosts`
   - **Windows:** `C:\Windows\System32\drivers\etc\hosts`

2. Add entry:
   ```
   your-vps-ip  staging.peppertree.local
   ```

3. SSH Tunnel:
   ```bash
   ssh -L 8080:localhost:8080 user@your-vps-ip
   ```

4. Access:
   ```
   http://staging.peppertree.local:8080
   ```

**Pros:**
- No public access at all
- No DNS required
- Free SSL with self-signed cert

**Cons:**
- Requires SSH tunnel
- Each developer must configure
- Not suitable for non-technical users

---

## Security Features

### Layer 1: IP Whitelist
- Only specified IPs can access
- Blocks brute force from random IPs
- Fast rejection (before password check)

### Layer 2: HTTP Basic Auth
- Password required after IP check
- Bcrypt encrypted passwords
- Browser remembers credentials per session

### Layer 3: Search Engine Protection
- `X-Robots-Tag: noindex, nofollow`
- `/robots.txt` returns disallow all
- No public discovery

### Additional Security
- HTTPS with Let's Encrypt
- Security headers (XSS, frame options, etc.)
- Localhost (127.0.0.1) always allowed for SSH tunnels

---

## Access Patterns

### Direct Access (HTTPS)
```
https://staging.17peppertree.co.za
```
- Requires: IP whitelisted + password
- Most common usage

### HTTP Port (Testing)
```
http://staging.17peppertree.co.za:8080
```
- Use before SSL configured
- Still password protected

### SSH Tunnel (Remote Access)
```bash
# Create tunnel
ssh -L 8080:localhost:8080 deploy@vps-ip

# Access via tunnel
http://localhost:8080
```
- Bypass IP whitelist
- Access from anywhere
- SSH key required

### API Testing
```bash
# With authentication
curl -u admin:password https://staging.17peppertree.co.za/api/health

# Response
{"status": "healthy"}
```

---

## Troubleshooting

### Can't Access Staging (403 Forbidden)

**Check IP Whitelist:**
```bash
# View your current IP
curl ifconfig.me

# Check if it's in whitelist
cat /etc/nginx/staging-ip-whitelist.conf

# Add your IP
staging-users addip $(curl -s ifconfig.me)
docker restart peppertree_nginx_staging
```

### Wrong Password

```bash
# Reset password
staging-users password username
docker restart peppertree_nginx_staging
```

### DNS Not Resolving

```bash
# Check DNS propagation
nslookup staging.17peppertree.co.za

# Check from different DNS server
nslookup staging.17peppertree.co.za 8.8.8.8
```

**If not propagated:**
- Wait 5-15 minutes
- Clear DNS cache: `sudo systemd-resolve --flush-caches`
- Use IP directly: `http://vps-ip:8080`

### SSL Certificate Issues

```bash
# Check certificate
sudo certbot certificates

# Renew if expired
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

### Container Won't Start

```bash
# Check logs
docker logs peppertree_nginx_staging

# Check port conflicts
sudo netstat -tulpn | grep -E ':8080|:8443'

# Restart
docker restart peppertree_nginx_staging
```

---

## Deployment Workflow

### Typical Development Cycle

1. **Develop locally** with `docker compose up`
2. **Commit to develop branch**
3. **Push to GitHub** → Auto-deploys to staging
4. **Test on staging:** `https://staging.17peppertree.co.za`
5. **If good, merge to main** → Auto-deploys to production

### Manual Staging Deployment

```bash
# SSH to VPS
ssh deploy@vps-ip

# Navigate to staging
cd /opt/peppertree-staging

# Pull latest changes
git pull origin develop

# Rebuild and deploy
docker compose -f docker-compose.staging.yml up -d --build

# Monitor
docker compose -f docker-compose.staging.yml logs -f
```

### Quick Staging Tests

```bash
# Health check
curl -u admin:pass https://staging.17peppertree.co.za/api/health

# Test booking creation
curl -u admin:pass -X POST https://staging.17peppertree.co.za/api/booking \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com",...}'

# Check database
docker exec -it peppertree_db_staging psql -U postgres -d peppertree \
  -c "SELECT * FROM booking_requests ORDER BY created_at DESC LIMIT 5;"
```

---

## Best Practices

### Security
1. ✅ Use strong passwords (20+ characters)
2. ✅ Enable IP whitelist for known IPs
3. ✅ Use HTTPS always (Let's Encrypt is free)
4. ✅ Disable search engine indexing
5. ✅ Rotate passwords regularly

### Access Management
1. ✅ Give each developer their own credentials
2. ✅ Remove users when they leave team
3. ✅ Log access in nginx logs
4. ✅ Monitor for suspicious activity
5. ✅ Use SSH tunnels for remote access

### Testing
1. ✅ Test all changes on staging first
2. ✅ Run automated tests before deploying to production
3. ✅ Verify database migrations
4. ✅ Check email notifications
5. ✅ Test on mobile devices

### Maintenance
1. ✅ Keep SSL certificates renewed (auto-renew with certbot)
2. ✅ Update Docker images regularly
3. ✅ Review logs weekly
4. ✅ Back up staging database monthly
5. ✅ Clean up old test data

---

## Related Documentation

- [VPS_SETUP_GUIDE.md](./VPS_SETUP_GUIDE.md) - Initial VPS setup
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - CI/CD and deployments
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - Local development
- [AUTHENTICATION.md](./AUTHENTICATION.md) - Keycloak setup

---

**Script Location:** `/scripts/setup-staging-auth.sh`  
**Support:** For issues, check `/var/log/nginx/staging-*.log`
