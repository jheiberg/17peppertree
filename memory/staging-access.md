# Staging Access Memory

**Date:** 2025-11-21

## Problem
How to run staging environment on VPS without public viewing it?

## 5 Solutions (Ranked)

### 1. Subdomain + HTTP Basic Auth ⭐ RECOMMENDED
- **URL:** `https://staging.17peppertree.co.za`
- **Security:** Password popup before access
- **Setup:** Medium (DNS + SSL + password file)
- **Best for:** Most teams

**Quick Setup:**
```bash
# Create password file
sudo htpasswd -c /etc/nginx/.htpasswd-staging admin

# Add to nginx config:
auth_basic "Staging - Authorized Only";
auth_basic_user_file /etc/nginx/.htpasswd-staging;
```

### 2. Non-Standard Port
- **URL:** `http://vps-ip:8080`
- **Security:** Obscurity only
- **Setup:** Very easy (just map port)
- **Best for:** Quick internal testing

### 3. IP Whitelist
- **URL:** `https://staging.17peppertree.co.za`
- **Security:** Only specific IPs allowed
- **Setup:** Medium (firewall rules)
- **Best for:** Fixed office/home IPs

**Nginx config:**
```nginx
allow 102.165.34.56;  # Office
allow 41.12.34.89;    # Home
deny all;
```

### 4. VPN Access (WireGuard)
- **URL:** `http://10.8.0.1:8080`
- **Security:** Encrypted tunnel required
- **Setup:** Complex
- **Best for:** Maximum security

### 5. Hosts File (No DNS)
- **URL:** `http://staging.peppertree.local:8080`
- **Security:** No public DNS record
- **Setup:** Manual per machine
- **Best for:** Developers only

## Recommended: Combined Approach

**Best security + usability:**

1. Subdomain with Basic Auth (primary method)
2. IP Whitelist (blocks brute force)
3. SSH Tunnel (developer backup access)

**Nginx config:**
```nginx
server {
    listen 443 ssl http2;
    server_name staging.17peppertree.co.za;
    
    # Layer 1: IP Whitelist
    allow 102.165.34.56;
    allow 127.0.0.1;
    deny all;
    
    # Layer 2: Password
    auth_basic "Staging Access";
    auth_basic_user_file /etc/nginx/.htpasswd-staging;
    
    # Prevent search engines
    add_header X-Robots-Tag "noindex, nofollow" always;
}
```

## Prevent Search Engine Indexing

Always add to staging nginx config:
```nginx
add_header X-Robots-Tag "noindex, nofollow, noarchive" always;
```

And create `robots.txt`:
```
User-agent: *
Disallow: /
```

## Quick Commands

```bash
# Add staging user
sudo htpasswd /etc/nginx/.htpasswd-staging newuser

# Check who can access
cat /etc/nginx/.htpasswd-staging | cut -d: -f1

# SSH tunnel for developers
ssh -L 8080:localhost:8080 user@vps-ip

# Check current IP (for whitelist)
curl ifconfig.me
```

## Port Mapping for Same VPS

- Production: 443 (HTTPS), 80 (HTTP)
- Staging: 8443 (HTTPS), 8080 (HTTP)
- Or use subdomain with same ports but different virtual host

## Multi-Property Staging

Each property gets own staging subdomain:
```
staging1.17peppertree.co.za
staging2.property2.co.za
staging3.property3.co.za
```

All behind Basic Auth with unique passwords.

## Full Documentation
See: `/docs/STAGING.md`
