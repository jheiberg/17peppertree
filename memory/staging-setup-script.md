# Staging Setup Script Memory

**Date:** 2025-11-21

## New Script Created
`/scripts/setup-staging-auth.sh`

## What It Does
Automated secure staging setup (5 minutes):

### Features
1. **HTTP Basic Auth** - Password protection
2. **IP Whitelist** - Only specific IPs can access
3. **Nginx Configuration** - Production-ready config
4. **User Management** - Easy add/remove users
5. **SSL Ready** - Works with Let's Encrypt
6. **Search Engine Protection** - No indexing

### Interactive Setup
Script asks for:
1. First username/password
2. Additional users (optional)
3. IP addresses to whitelist
4. Confirms choices

### What It Creates

**Files:**
- `/etc/nginx/.htpasswd-staging` - Password file (bcrypt)
- `/opt/peppertree-staging/nginx.staging-auth.conf` - Nginx config
- `/usr/local/bin/staging-users` - User management command

**Firewall:**
- Opens port 8080 (HTTP testing)
- Opens port 8443 (HTTPS production)

**Features:**
- Two-layer security (IP + password)
- Prevents search engine crawling
- WebSocket support
- HTTP → HTTPS redirect

## Usage

### Basic
```bash
sudo bash scripts/setup-staging-auth.sh
```

### With Parameters (Faster)
```bash
sudo bash scripts/setup-staging-auth.sh staging.17peppertree.co.za 102.165.34.56
```

### After Script Runs

1. **Configure DNS:**
   ```
   A record: staging.17peppertree.co.za → vps-ip
   ```

2. **Test HTTP (no SSL):**
   ```
   http://staging.17peppertree.co.za:8080
   ```

3. **Generate SSL:**
   ```bash
   sudo certbot certonly --standalone -d staging.17peppertree.co.za
   ```

4. **Update Docker Compose:**
   - Use `nginx.staging-auth.conf`
   - Mount SSL certificates
   - Mount `.htpasswd-staging`

5. **Deploy:**
   ```bash
   cd /opt/peppertree-staging
   docker compose -f docker-compose.staging.yml up -d
   ```

6. **Access:**
   ```
   https://staging.17peppertree.co.za
   ```

## User Management Command

Created: `staging-users`

```bash
staging-users add username      # Add user
staging-users remove username   # Remove user
staging-users password username # Change password
staging-users list              # List all users
```

After changes, restart nginx:
```bash
docker restart peppertree_nginx_staging
```

## Security Layers

### Layer 1: IP Whitelist
- Blocks all IPs except whitelisted
- Fast rejection (before password)
- 127.0.0.1 always allowed (SSH tunnels)

### Layer 2: Password
- HTTP Basic Auth
- Bcrypt encrypted
- Browser remembers per session

### Layer 3: Search Engines
- X-Robots-Tag header
- robots.txt disallow all
- No indexing possible

## Access Methods

1. **Direct HTTPS:** `https://staging.17peppertree.co.za`
2. **HTTP Testing:** `http://staging.17peppertree.co.za:8080`
3. **SSH Tunnel:** `ssh -L 8080:localhost:8080 user@vps`
4. **By IP:** `http://vps-ip:8080`

## Nginx Config Highlights

- Dual server blocks (HTTPS 443, HTTP 8080)
- IP whitelist appears 3 times (HTTPS, HTTP redirect, HTTP 8080)
- Basic auth on all blocks
- Security headers
- robots.txt inline
- Proxy to frontend/backend/keycloak
- WebSocket support

## Multi-Property Support

Run script multiple times for multiple properties:
```bash
setup-staging-auth.sh staging1.17peppertree.co.za
setup-staging-auth.sh staging2.property2.co.za
setup-staging-auth.sh test.property3.co.za
```

Each gets unique:
- Password file
- Nginx config  
- SSL cert
- Port mapping

## Troubleshooting

**401 Unauthorized:** Wrong password
- `staging-users password username`

**403 Forbidden:** IP not whitelisted
- Check IP: `curl ifconfig.me`
- Add to nginx config

**Can't access:** Firewall or containers down
- `docker ps | grep staging`
- `sudo ufw status | grep 8080`

## Integration Added to Main Setup

Updated `vps-secure-setup.sh` to mention staging setup:
```
Optional: Staging Authentication Setup
bash scripts/setup-staging-auth.sh staging.domain.com office-ip
```

## Documentation Created

1. `/scripts/setup-staging-auth.sh` (17KB) - Main script
2. `/docs/STAGING.md` (merged comprehensive staging guide)
3. Updated `/scripts/vps-secure-setup.sh` - Added staging info

## Full Documentation
See: `/docs/STAGING.md`
