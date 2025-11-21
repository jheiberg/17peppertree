# VPS Setup Script Memory

**Date:** 2025-11-21  
**Last Updated:** 2025-11-21

## Setup Scripts

### Main Script: `vps-secure-setup.sh` ⭐
Comprehensive VPS setup (23KB, 873 lines)

### Deprecated: `setup-server.sh`
Now a wrapper that calls vps-secure-setup.sh (backwards compatibility)

## What It Does
Automated setup for Ubuntu 24.04 LTS VPS (10-15 minutes):

### 1. System Updates
- Updates all packages
- Installs 30+ essential utilities
- Configures automatic security updates

### 2. Docker Installation
- Latest Docker Engine + Compose
- Security-hardened daemon.json
- User added to docker group

### 3. Security Hardening
- **UFW Firewall**: Deny all incoming, allow SSH/HTTP/HTTPS
- **fail2ban**: Blocks brute force (3 SSH attempts, 1hr ban)
- **SSH**: Root login disabled, password auth disabled, key-only
- **Auto-updates**: Unattended security upgrades enabled

### 4. System Optimization
- 2GB swap file (swappiness=10)
- Kernel parameter tuning
- File descriptor limits increased
- Memory/network optimizations for 8GB RAM

### 5. Project Structure
```
/opt/peppertree-production/
/opt/peppertree-staging/
/opt/peppertree-backups/
/var/log/peppertree/
```

### 6. Backup System
- Daily backups at 2AM (cron)
- rclone for cloud sync
- 30-day retention
- Automatic verification

### 7. Custom Scripts Created
- `peppertree-status` - System overview
- `peppertree-healthcheck` - Health validation
- `peppertree-backup` - Manual backup
- `peppertree-security-audit` - Security review

### 8. Log Management
- Daily rotation, 30-day retention
- Nginx logs: 14 days
- Automatic compression

### 9. Deploy User
- CI/CD user created
- SSH directory configured
- Docker group access

## Usage

### Recommended (Direct):
```bash
curl -O https://raw.githubusercontent.com/jheiberg/17peppertree/main/scripts/vps-secure-setup.sh
chmod +x vps-secure-setup.sh
sudo bash vps-secure-setup.sh
```

### Alternative (Backwards Compatible):
```bash
# This still works - automatically calls vps-secure-setup.sh
sudo bash scripts/setup-server.sh
```

## Post-Setup Required
1. Set up SSH key authentication
2. Configure rclone for cloud backups
3. Copy and edit .env files
4. Clone application repository
5. Generate SSL certificates (certbot)
6. Deploy application (docker compose up)
7. Reboot server

## Security Features
- UFW firewall (SSH/HTTP/HTTPS only)
- fail2ban (max 3 SSH attempts)
- SSH key-only authentication
- Automatic security updates
- No root login
- 2GB swap, optimized kernel params
- Docker security: no-new-privileges, icc=false

## Monitoring Commands
- `peppertree-status` - Quick overview
- `peppertree-healthcheck` - Full health check
- `peppertree-security-audit` - Security review
- `htop` - Resource monitoring
- `docker stats` - Container resources

## Full Documentation
See: `/docs/VPS_SETUP_GUIDE.md`
