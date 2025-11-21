# Staging Setup Quick Start Guide

**Document Version:** 1.0  
**Last Updated:** 2025-11-21  
**Script:** `/scripts/setup-staging-auth.sh`

---

## Overview

This guide explains how to quickly set up secure staging access using the automated setup script. The script implements the **recommended approach**: HTTP Basic Auth + IP Whitelist.

---

## Prerequisites

- VPS setup completed (`vps-secure-setup.sh` already run)
- Root or sudo access
- Staging subdomain DNS record (or will create after setup)

---

## Quick Setup (5 Minutes)

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

### Step 6: Update Docker Compose

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

### Step 7: Deploy Staging

```bash
cd /opt/peppertree-staging

# Build and start staging environment
docker compose -f docker-compose.staging.yml up -d --build

# Monitor deployment
docker compose -f docker-compose.staging.yml logs -f
```

### Step 8: Access Staging (HTTPS)

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

## Access Methods

### Method 1: Direct Access (HTTPS)
```
https://staging.17peppertree.co.za
```
- Requires: IP whitelisted + password
- Most common usage

### Method 2: HTTP Port (Testing)
```
http://staging.17peppertree.co.za:8080
```
- Use before SSL configured
- Still password protected

### Method 3: SSH Tunnel (Developers)
```bash
# On local machine
ssh -L 8080:localhost:8080 user@vps-ip

# Access at:
http://localhost:8080
```
- Bypasses IP whitelist
- Most secure for developers
- No firewall changes needed

### Method 4: IP Address (No DNS)
```
http://vps-ip:8080
```
- Works immediately
- No DNS propagation wait
- Password still required

---

## Troubleshooting

### Can't Access Staging

**Check 1: Is your IP whitelisted?**
```bash
# Find your current IP
curl ifconfig.me

# Add it to whitelist
staging-users list  # Check if you need to add IP
```

**Check 2: Are containers running?**
```bash
docker ps | grep staging
```

**Check 3: Is firewall allowing access?**
```bash
sudo ufw status | grep 8080
```

### 401 Unauthorized

**Wrong password:**
```bash
# Reset password
staging-users password username
docker restart peppertree_nginx_staging
```

**Password file missing:**
```bash
# Check file exists
ls -la /etc/nginx/.htpasswd-staging

# Re-run setup if missing
sudo bash scripts/setup-staging-auth.sh
```

### 403 Forbidden

**IP not whitelisted:**
```bash
# Check your IP
curl ifconfig.me

# Edit nginx config to add your IP
sudo nano /opt/peppertree-staging/nginx.staging-auth.conf

# Look for IP whitelist section and add:
# allow YOUR.IP.HERE;

# Restart nginx
docker restart peppertree_nginx_staging
```

### SSL Certificate Error

**Certificate not found:**
```bash
# Check certificate exists
sudo certbot certificates

# Generate if missing
sudo certbot certonly --standalone -d staging.17peppertree.co.za

# Update docker compose volumes path
nano /opt/peppertree-staging/docker-compose.staging.yml
```

### DNS Not Resolving

**Check DNS propagation:**
```bash
# Test DNS resolution
nslookup staging.17peppertree.co.za

# Or use online tools
# https://dnschecker.org
```

**Temporary solution (use IP):**
```bash
# Access via IP instead
http://your-vps-ip:8080
```

---

## Advanced Configuration

### Add More IPs After Setup

Edit nginx config:
```bash
sudo nano /opt/peppertree-staging/nginx.staging-auth.conf

# Find IP whitelist section (appears 3 times):
# 1. HTTPS server block
# 2. HTTP redirect block  
# 3. HTTP port 8080 block

# Add your IP:
allow 41.12.34.89;    # Description

# Restart nginx
docker restart peppertree_nginx_staging
```

### Remove IP Whitelist Entirely

Edit nginx config and comment out IP restrictions:
```nginx
# allow 102.165.34.56;
# allow 127.0.0.1;
# deny all;
```

This makes it **password-only** (still secure, but accessible from any IP).

### Custom Port Mapping

Edit docker compose to use different ports:
```yaml
ports:
  - "9443:443"  # Custom HTTPS port
  - "9080:8080" # Custom HTTP port
```

Don't forget to update firewall:
```bash
sudo ufw allow 9443/tcp
sudo ufw allow 9080/tcp
```

### Multiple Staging Environments

Run the script multiple times with different domains:

```bash
# Staging 1
sudo bash scripts/setup-staging-auth.sh staging1.17peppertree.co.za

# Staging 2  
sudo bash scripts/setup-staging-auth.sh staging2.anotherproperty.co.za

# Staging 3
sudo bash scripts/setup-staging-auth.sh test.17peppertree.co.za
```

Each gets its own:
- Password file (`.htpasswd-staging`, `.htpasswd-staging2`, etc.)
- Nginx config
- SSL certificate
- Docker containers

---

## Files Created by Script

| File | Purpose |
|------|---------|
| `/etc/nginx/.htpasswd-staging` | Password file (bcrypt hashes) |
| `/opt/peppertree-staging/nginx.staging-auth.conf` | Nginx configuration |
| `/opt/peppertree-staging/docker-compose-staging-notes.txt` | Integration guide |
| `/usr/local/bin/staging-users` | User management command |

---

## Security Best Practices

1. **Strong Passwords**
   - Minimum 20 characters
   - Mix of letters, numbers, symbols
   - Use password manager

2. **Rotate Passwords**
   - Change every 90 days
   - Remove users who leave team

3. **Monitor Access Logs**
   ```bash
   tail -f /opt/peppertree-staging/logs/nginx/staging-access.log
   ```

4. **Keep IP Whitelist Updated**
   - Remove old IPs
   - Add new team members
   - Document who has which IP

5. **Use HTTPS Always**
   - Don't use HTTP port 8080 in production
   - Let's Encrypt is free

6. **Disable When Not Testing**
   ```bash
   # Stop staging when not needed
   cd /opt/peppertree-staging
   docker compose -f docker-compose.staging.yml down
   ```

---

## Integration with CI/CD

### GitHub Actions Example

Add to `.github/workflows/deploy-staging.yml`:

```yaml
- name: Deploy to Staging
  run: |
    ssh deploy@${{ secrets.VPS_IP }} << 'EOF'
      cd /opt/peppertree-staging
      git pull origin develop
      docker compose -f docker-compose.staging.yml up -d --build
    EOF

- name: Test Staging Access
  run: |
    curl -u ${{ secrets.STAGING_USER }}:${{ secrets.STAGING_PASSWORD }} \
         https://staging.17peppertree.co.za/api/health
```

---

## Related Documentation

- [STAGING_ACCESS_GUIDE.md](./STAGING_ACCESS_GUIDE.md) - Detailed guide (all methods)
- [VPS_SETUP_GUIDE.md](./VPS_SETUP_GUIDE.md) - VPS initial setup
- [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) - Production deployment

---

## Quick Reference

### Common Commands
```bash
# User management
staging-users add username
staging-users remove username
staging-users password username
staging-users list

# Check access
curl -u user:pass https://staging.17peppertree.co.za/api/health

# View logs
docker logs peppertree_nginx_staging --tail 50

# Restart staging
docker restart peppertree_nginx_staging

# Full restart
cd /opt/peppertree-staging
docker compose -f docker-compose.staging.yml restart

# Check IP
curl ifconfig.me
```

### Ports
- **8080**: HTTP staging (testing)
- **8443**: HTTPS staging (production)

### Default Locations
- Passwords: `/etc/nginx/.htpasswd-staging`
- Config: `/opt/peppertree-staging/nginx.staging-auth.conf`
- Logs: `/opt/peppertree-staging/logs/nginx/`
- SSL: `/etc/letsencrypt/live/staging.17peppertree.co.za/`

---

**Setup Time:** ~5 minutes  
**Security Level:** High (2-layer protection)  
**Maintenance:** Low (user management command provided)
