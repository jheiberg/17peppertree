# Staging Environment Access Guide

**Document Version:** 1.0  
**Last Updated:** 2025-11-21

---

## Overview

This guide explains how to set up and access a staging environment on your VPS that is **hidden from public view**. The staging environment allows you to test changes before deploying to production, without exposing work-in-progress to website visitors.

---

## Staging Access Methods

You have **5 options** for keeping staging private, ranging from simple to most secure:

### Method 1: Subdomain with HTTP Basic Auth ⭐ **RECOMMENDED**
- **URL:** `https://staging.17peppertree.co.za`
- **Security:** Password-protected
- **Effort:** Low
- **Best for:** Most use cases

### Method 2: Non-Standard Port
- **URL:** `http://your-vps-ip:8080`
- **Security:** Obscurity (port not publicly advertised)
- **Effort:** Very Low
- **Best for:** Quick testing, internal team

### Method 3: IP Whitelist
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

## Method 1: Subdomain with HTTP Basic Auth (RECOMMENDED)

This is the **most practical** approach for most teams.

### Architecture
```
Internet → DNS (staging.17peppertree.co.za) → VPS Port 443 → Nginx Basic Auth → Staging Containers
```

### Step 1: DNS Configuration

Add a subdomain DNS record:

```
Type: A
Name: staging
Value: your-vps-ip
TTL: 300 (5 minutes)
```

**Example:**
- Main site: `17peppertree.co.za` → VPS IP
- Staging: `staging.17peppertree.co.za` → Same VPS IP

### Step 2: Create Nginx Configuration

Create `/opt/peppertree-staging/nginx.staging.conf`:

```nginx
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

    # Upstream backends
    upstream staging_frontend {
        server frontend:3000;
    }
    
    upstream staging_backend {
        server backend:5000;
    }

    # Staging server with Basic Auth
    server {
        listen 443 ssl http2;
        server_name staging.17peppertree.co.za;

        # SSL certificates (Let's Encrypt)
        ssl_certificate /etc/nginx/ssl/staging.17peppertree.co.za/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/staging.17peppertree.co.za/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # HTTP Basic Authentication
        auth_basic "Staging Environment - Authorized Access Only";
        auth_basic_user_file /etc/nginx/.htpasswd-staging;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Robots-Tag "noindex, nofollow" always;

        # API routes
        location /api/ {
            proxy_pass http://staging_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Keycloak auth routes
        location /auth/ {
            proxy_pass http://keycloak:8080/auth/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Frontend
        location / {
            proxy_pass http://staging_frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name staging.17peppertree.co.za;
        return 301 https://$server_name$request_uri;
    }
}
```

### Step 3: Create Password File

```bash
# Install htpasswd utility
sudo apt install apache2-utils

# Create password file
sudo htpasswd -c /etc/nginx/.htpasswd-staging admin

# Add more users
sudo htpasswd /etc/nginx/.htpasswd-staging developer
sudo htpasswd /etc/nginx/.htpasswd-staging designer

# Set permissions
sudo chmod 644 /etc/nginx/.htpasswd-staging
```

### Step 4: Generate SSL Certificate

```bash
# Generate Let's Encrypt certificate for staging subdomain
sudo certbot certonly --standalone -d staging.17peppertree.co.za

# Certificate will be saved to:
# /etc/letsencrypt/live/staging.17peppertree.co.za/
```

### Step 5: Update Docker Compose

Ensure `docker-compose.staging.yml` uses the Nginx config:

```yaml
services:
  nginx:
    image: nginx:alpine
    container_name: peppertree_nginx_staging
    ports:
      - "8443:443"  # Different port to avoid conflict with production
      - "8080:80"
    volumes:
      - ./nginx.staging.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt/live/staging.17peppertree.co.za:/etc/nginx/ssl/staging.17peppertree.co.za:ro
      - /etc/nginx/.htpasswd-staging:/etc/nginx/.htpasswd-staging:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - frontend
      - backend
    networks:
      - peppertree_network
    restart: unless-stopped
```

### Step 6: Deploy Staging

```bash
cd /opt/peppertree-staging
docker compose -f docker-compose.staging.yml up -d --build
```

### Step 7: Access Staging

1. Navigate to `https://staging.17peppertree.co.za`
2. Enter username and password when prompted
3. Test your staging application

### Managing Users

```bash
# Add new user
sudo htpasswd /etc/nginx/.htpasswd-staging newuser

# Remove user
sudo htpasswd -D /etc/nginx/.htpasswd-staging olduser

# Change password
sudo htpasswd /etc/nginx/.htpasswd-staging existinguser

# View all users
cat /etc/nginx/.htpasswd-staging | cut -d: -f1
```

---

## Method 2: Non-Standard Port (Quickest)

### Configuration

Use existing `docker-compose.staging.yml` with port mapping:

```yaml
services:
  nginx:
    ports:
      - "8080:80"  # Access via http://your-vps-ip:8080
```

### Firewall Configuration

```bash
# Open port 8080 (only if needed)
sudo ufw allow 8080/tcp comment 'Staging'

# Or keep it closed and access via SSH tunnel (more secure)
```

### Access via SSH Tunnel (More Secure)

```bash
# On your local machine
ssh -L 8080:localhost:8080 user@your-vps-ip

# Then access staging at:
# http://localhost:8080
```

### Pros & Cons

✅ **Pros:**
- Very quick to set up
- No DNS changes needed
- No SSL certificate needed

❌ **Cons:**
- Not truly "hidden" (anyone with IP and port can access)
- Must remember non-standard port
- No HTTPS (unless configured)

---

## Method 3: IP Whitelist

### Nginx Configuration

Add to your staging server block:

```nginx
server {
    listen 443 ssl http2;
    server_name staging.17peppertree.co.za;

    # IP Whitelist - ONLY these IPs can access
    allow 102.165.34.56;      # Office IP
    allow 41.12.34.89;        # Home IP
    allow 192.168.1.0/24;     # Local network
    deny all;                 # Deny everyone else

    # Rest of configuration...
}
```

### Firewall Level (More Secure)

```bash
# Allow staging port only from specific IPs
sudo ufw allow from 102.165.34.56 to any port 8080 comment 'Office to Staging'
sudo ufw allow from 41.12.34.89 to any port 8080 comment 'Home to Staging'

# Deny all others (implicit with UFW default deny)
```

### Dynamic IP Solution

If your IP changes frequently, use a Dynamic DNS service:

```bash
# Install ddclient for dynamic DNS
sudo apt install ddclient

# Configure to update your IP with DynDNS, No-IP, etc.
```

### Pros & Cons

✅ **Pros:**
- Very secure
- No password to remember
- Fast access (no auth prompts)

❌ **Cons:**
- Requires static or dynamic DNS
- Mobile/remote work difficult
- Must update whitelist when IPs change

---

## Method 4: VPN Access

### Option A: WireGuard VPN (Recommended)

#### Install WireGuard on VPS

```bash
# Install WireGuard
sudo apt update
sudo apt install wireguard

# Generate server keys
wg genkey | sudo tee /etc/wireguard/server_private.key
sudo cat /etc/wireguard/server_private.key | wg pubkey | sudo tee /etc/wireguard/server_public.key

# Generate client keys
wg genkey | tee client_private.key
cat client_private.key | wg pubkey > client_public.key
```

#### Configure WireGuard Server

Create `/etc/wireguard/wg0.conf`:

```ini
[Interface]
PrivateKey = <server_private_key>
Address = 10.8.0.1/24
ListenPort = 51820
SaveConfig = true

# Port forwarding
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT

[Peer]
# Client 1
PublicKey = <client_public_key>
AllowedIPs = 10.8.0.2/32

[Peer]
# Client 2
PublicKey = <client2_public_key>
AllowedIPs = 10.8.0.3/32
```

#### Start WireGuard

```bash
# Enable and start
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0

# Open VPN port
sudo ufw allow 51820/udp
```

#### Client Configuration

Create client config `staging-vpn.conf`:

```ini
[Interface]
PrivateKey = <client_private_key>
Address = 10.8.0.2/24
DNS = 8.8.8.8

[Peer]
PublicKey = <server_public_key>
Endpoint = your-vps-ip:51820
AllowedIPs = 10.8.0.0/24
PersistentKeepalive = 25
```

#### Access Staging

1. Connect to VPN
2. Access staging at `http://10.8.0.1:8080`

### Option B: OpenVPN

Similar setup but more complex configuration.

### Pros & Cons

✅ **Pros:**
- Maximum security
- Encrypted connection
- Access entire internal network

❌ **Cons:**
- Complex setup
- Requires VPN client installation
- Can be slow if misconfigured

---

## Method 5: Hosts File (Developer Only)

### VPS Configuration

**Do NOT create public DNS record** for staging subdomain.

### Configure Nginx

Use a custom hostname like `staging.peppertree.local`:

```nginx
server {
    listen 8080;
    server_name staging.peppertree.local;
    # ... rest of config
}
```

### Client Configuration

Edit hosts file on **each developer machine**:

**Linux/Mac:** `/etc/hosts`
**Windows:** `C:\Windows\System32\drivers\etc\hosts`

Add:
```
your-vps-ip staging.peppertree.local
```

### Access

Navigate to `http://staging.peppertree.local:8080`

### Pros & Cons

✅ **Pros:**
- No public DNS exposure
- Free SSL with self-signed certs
- Fast local resolution

❌ **Cons:**
- Must configure each machine
- Hard to share with non-technical users
- No mobile access (without hosts file editing)

---

## Recommended Setup: Combined Approach

For best balance of security and usability:

### Configuration

1. **Subdomain with Basic Auth** (Primary)
   - `https://staging.17peppertree.co.za`
   - Password protected
   - SSL enabled

2. **IP Whitelist** (Additional layer)
   - Only allow office/known IPs
   - Blocks password brute force from random IPs

3. **SSH Tunnel** (Developer access)
   - Developers can bypass firewall via SSH
   - Most secure for development work

### Implementation

```nginx
server {
    listen 443 ssl http2;
    server_name staging.17peppertree.co.za;

    # IP Whitelist (First layer)
    allow 102.165.34.56;      # Office
    allow 41.12.34.89;        # Home
    allow 127.0.0.1;          # Localhost (for SSH tunnels)
    deny all;

    # Basic Auth (Second layer)
    auth_basic "Staging - Authorized Only";
    auth_basic_user_file /etc/nginx/.htpasswd-staging;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/staging.17peppertree.co.za/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.17peppertree.co.za/privkey.pem;

    # Prevent search engines
    add_header X-Robots-Tag "noindex, nofollow, noarchive" always;

    # ... rest of config
}
```

---

## Preventing Search Engine Indexing

Even with access control, prevent search engine crawlers:

### Method 1: robots.txt

Create `/opt/peppertree-staging/public/robots.txt`:

```
User-agent: *
Disallow: /
```

### Method 2: Meta Tags

Add to React `public/index.html`:

```html
<meta name="robots" content="noindex, nofollow, noarchive">
```

### Method 3: Nginx Headers (Best)

Already included in recommended config:

```nginx
add_header X-Robots-Tag "noindex, nofollow, noarchive" always;
```

### Method 4: Password Protection

Basic Auth automatically prevents indexing since crawlers can't authenticate.

---

## Multi-Tenant Staging

If hosting multiple properties, each can have its own staging:

```
staging1.17peppertree.co.za
staging2.otherproperty.co.za
staging3.anotherproperty.co.za
```

All behind Basic Auth, different passwords per property.

---

## Testing Checklist

Before moving to production:

- [ ] Staging accessible via chosen method
- [ ] Basic Auth working (if used)
- [ ] SSL certificate valid (if used)
- [ ] IP whitelist blocking unauthorized IPs (if used)
- [ ] Search engines blocked (robots meta/headers)
- [ ] Database separate from production
- [ ] Environment variables correct (.env.staging)
- [ ] Email sending disabled or to test accounts only
- [ ] Payment gateway in test/sandbox mode
- [ ] Backup system not running (avoid duplicate backups)

---

## Troubleshooting

### Can't Access Staging

```bash
# Check if containers are running
docker ps | grep staging

# Check if port is open
sudo netstat -tulpn | grep 8080

# Check firewall
sudo ufw status | grep 8080

# Check Nginx logs
docker logs peppertree_nginx_staging --tail 50
```

### 401 Unauthorized (Basic Auth)

```bash
# Verify password file exists
ls -la /etc/nginx/.htpasswd-staging

# Test password
sudo htpasswd -v /etc/nginx/.htpasswd-staging username

# Reload Nginx
docker restart peppertree_nginx_staging
```

### 403 Forbidden (IP Block)

```bash
# Check your current IP
curl ifconfig.me

# Check Nginx config
docker exec peppertree_nginx_staging nginx -t

# Add your IP to whitelist
# Edit nginx.staging.conf and add:
# allow YOUR.IP.ADDRESS.HERE;
```

### SSL Certificate Issues

```bash
# Check certificate
sudo certbot certificates

# Renew if needed
sudo certbot renew --dry-run

# Restart Nginx
docker restart peppertree_nginx_staging
```

---

## Security Best Practices

1. **Always use HTTPS** for staging (free with Let's Encrypt)
2. **Use strong passwords** for Basic Auth (20+ chars)
3. **Rotate passwords** every 90 days
4. **Monitor access logs** for suspicious activity
5. **Disable staging** when not actively testing
6. **Never use production data** in staging
7. **Use test email addresses** to avoid spamming real guests

---

## Related Documentation

- [VPS_SETUP_GUIDE.md](./VPS_SETUP_GUIDE.md) - VPS configuration
- [HA_DR_PLAN.md](./HA_DR_PLAN.md) - Disaster recovery
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment procedures

---

**Recommended Method:** Subdomain with HTTP Basic Auth + IP Whitelist

This provides the best balance of security, usability, and ease of management for small teams.
