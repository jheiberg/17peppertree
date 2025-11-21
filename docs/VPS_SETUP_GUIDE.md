# VPS Setup Guide

**Document Version:** 1.0  
**Last Updated:** 2025-11-21  
**Script:** `/scripts/vps-secure-setup.sh`

---

## Overview

This guide explains how to use the automated VPS setup script to prepare a fresh Ubuntu 24.04 LTS VPS for hosting the 17 @ Peppertree application with comprehensive security hardening.

## Prerequisites

- Fresh Ubuntu 24.04 LTS VPS
- Root or sudo access
- Minimum specs: 2 vCPU / 8 GB RAM / 60 GB SSD
- SSH access to the server

---

## VPS Specifications

### Current Single-Site Configuration

**Selected Configuration:** 2 vCPU / 8 GB RAM

#### Minimum Specs:
- **CPU:** 2 vCPUs
- **RAM:** 4 GB
- **Storage:** 40 GB SSD
- **Bandwidth:** 2 TB/month

#### Optimal Specs (Recommended):
- **CPU:** 2 vCPUs  
- **RAM:** 8 GB
- **Storage:** 60-80 GB SSD
- **Bandwidth:** 3-5 TB/month

### Docker Container Resource Allocation

The application runs 6 Docker containers:

| Service | Container | RAM Usage | CPU Usage |
|---------|-----------|-----------|-----------|
| Identity Management | Keycloak | ~512 MB | Medium |
| Identity Database | Keycloak PostgreSQL | ~256 MB | Low |
| Main Database | PostgreSQL | ~256 MB | Low |
| API Backend | Flask/Gunicorn | ~256 MB | Low-Medium |
| Frontend | React/Nginx | ~128 MB | Minimal |
| Reverse Proxy | Nginx | ~128 MB | Low |
| **Total** | | **~1.5-2 GB** | |

### Resource Headroom

With 8 GB RAM:
- Container usage: ~1.5-2 GB
- OS overhead: ~1 GB
- **Available buffer:** ~5-6 GB for traffic spikes, caching, and growth

### Storage Breakdown

| Component | Space Required |
|-----------|----------------|
| Docker images | 2-3 GB |
| PostgreSQL databases | 5-10 GB (with growth) |
| Application logs | 2-5 GB |
| SSL certificates & backups | 5 GB |
| Operating system | 10 GB |
| **Recommended Total** | **60-80 GB SSD** |

### Multi-Tenant Capacity Planning

The architecture allows multiple accommodation websites to share backend infrastructure:
- **Shared:** Backend API, Database, Keycloak, Nginx
- **Per-Site:** React frontend container (~128 MB RAM each)

**Capacity Estimates on 2 vCPU / 8 GB RAM:**

| Total Websites | Frontend RAM | Backend RAM | Total RAM Used | CPU Load | Status |
|----------------|--------------|-------------|----------------|----------|--------|
| 1 (current) | 128 MB | 1.5 GB | ~2.5 GB | Low | ✅ Current |
| 3 sites | 384 MB | 2 GB | ~3.4 GB | Low-Med | ✅ Safe |
| 5 sites | 640 MB | 2.5 GB | ~4.1 GB | Medium | ✅ Comfortable |
| 8 sites | 1 GB | 3.5 GB | ~5.5 GB | Med-High | ⚠️ Monitor Closely |
| 10+ sites | 1.3+ GB | 4+ GB | ~6.3+ GB | High | ❌ Upgrade Required |

**Safe Operating Zone:** 4-6 total properties

**When to Upgrade to 4 vCPU / 16 GB RAM:**
- Hosting 7+ properties
- Consistent RAM usage >70% (>5.6 GB)
- CPU load averages >1.5 consistently
- Database query response times degrading

---

## Quick Start

### 1. Connect to Your VPS

```bash
ssh root@your-vps-ip
```

### 2. Download and Run the Setup Script

#### Method 1: Direct Download (Raw GitHub URL) ⭐ **RECOMMENDED**

The easiest method - no authentication required:

```bash
# Download the script
curl -O https://raw.githubusercontent.com/jheiberg/17peppertree/main/scripts/vps-secure-setup.sh

# Make it executable
chmod +x vps-secure-setup.sh

# Run it
sudo bash vps-secure-setup.sh
```

**Why this works:**
- GitHub raw URLs are public (no authentication needed)
- Works immediately on fresh VPS
- Only requires `curl` (pre-installed on Ubuntu)

#### Method 2: From Git Repository

```bash
# Clone the repository
git clone https://github.com/jheiberg/17peppertree.git
cd 17peppertree

# Run the setup script
sudo bash scripts/vps-secure-setup.sh
```

**Note:** Requires Git to be installed first (`sudo apt install git`)

#### Method 3: Copy-Paste (For Very Fresh VPS)

```bash
# On VPS, create the file
nano vps-setup.sh

# Paste the script content (Ctrl+Shift+V)
# Save: Ctrl+O, Enter
# Exit: Ctrl+X

# Make executable and run
chmod +x vps-setup.sh
sudo bash vps-setup.sh
```

#### Alternative: Using Short URL or Custom Domain

You can create easier access URLs:

**GitHub Gist:**
```bash
curl -O https://gist.githubusercontent.com/yourusername/abc123/raw/vps-setup.sh
chmod +x vps-setup.sh
sudo bash vps-setup.sh
```

**Your Own Domain:**
```bash
curl -O https://setup.17peppertree.co.za/vps-setup.sh
chmod +x vps-setup.sh
sudo bash vps-setup.sh
```

**URL Shortener (bit.ly, tinyurl.com):**
```
Original: https://raw.githubusercontent.com/jheiberg/17peppertree/main/scripts/vps-secure-setup.sh
Short:    https://bit.ly/peppertree-vps-setup
```

### 3. Wait for Completion

The script takes approximately **10-15 minutes** to complete. It will:
- Update all system packages
- Install and configure Docker
- Harden system security
- Set up monitoring and backups
- Create project directories
- Configure logging and rotation

---

## What the Script Does

### 1. System Updates (2-3 minutes)
- Updates all system packages
- Installs essential utilities (curl, wget, git, vim, htop, etc.)
- Configures automatic security updates

### 2. Docker Installation (2-3 minutes)
- Installs latest Docker Engine
- Installs Docker Compose plugin
- Adds user to docker group
- Configures Docker security settings

### 3. Security Hardening (3-5 minutes)

#### Firewall (UFW)
- Denies all incoming by default
- Allows SSH (port 22 or custom)
- Allows HTTP (port 80)
- Allows HTTPS (port 443)

#### fail2ban
- Monitors SSH login attempts
- Blocks brute force attacks
- Protects Nginx from abuse
- Bans for 1 hour after 5 failed attempts

#### SSH Hardening
- Disables root login
- Disables password authentication
- Requires SSH key authentication only
- Reduces login attempts to 3
- Sets connection timeouts

#### Automatic Updates
- Enables unattended security upgrades
- Auto-installs critical patches
- Configured for minimal disruption

### 4. System Optimization (1 minute)

#### Swap Configuration
- Creates 2GB swap file
- Sets swappiness to 10 (prefer RAM)
- Enables on boot

#### Kernel Tuning
- Optimizes network parameters
- Improves memory management
- Enhances file system performance

#### System Limits
- Increases file descriptor limits
- Adjusts process limits
- Optimized for Docker workloads

### 5. Project Structure (1 minute)
Creates organized directory structure:
```
/opt/
├── peppertree-production/
│   ├── ssl/
│   ├── logs/nginx/
│   └── .env.example
├── peppertree-staging/
│   ├── ssl/
│   ├── logs/nginx/
│   └── .env.example
├── peppertree-backups/
└── /var/log/peppertree/
```

### 6. Backup System (1 minute)

#### Automated Backups
- Daily backups at 2 AM
- Backs up PostgreSQL databases (main + Keycloak)
- Backs up configuration files
- 30-day retention policy
- Cloud sync support (rclone)

#### Backup Verification
- Weekly integrity checks
- Automatic cleanup of old backups
- Logging to `/var/log/peppertree/backup.log`

### 7. Monitoring Tools (1 minute)

#### System Monitoring
- `htop` - CPU and memory monitoring
- `iotop` - Disk I/O monitoring
- `nethogs` - Network bandwidth monitoring
- `ncdu` - Disk usage analyzer

#### Custom Scripts
- `peppertree-status` - Quick system overview
- `peppertree-healthcheck` - Health validation
- `peppertree-security-audit` - Security review

### 8. Log Management (1 minute)

#### Log Rotation
- Daily rotation for application logs
- 30-day retention for system logs
- 14-day retention for Nginx logs
- Automatic compression
- Nginx log reopening on rotation

### 9. Deploy User (1 minute)
- Creates dedicated `deploy` user
- Adds to docker group
- Sets up SSH directory
- Ready for CI/CD integration

---

## Post-Setup Configuration

After the script completes, follow these steps:

### 1. Set Up SSH Key Authentication

**On your local machine:**
```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy public key to server
ssh-copy-id your-username@your-vps-ip
```

**Test SSH key login:**
```bash
ssh your-username@your-vps-ip
```

### 2. Configure rclone for Cloud Backups

```bash
# Run rclone configuration wizard
rclone config

# Follow prompts to add cloud provider:
# - Google Drive (free 15GB)
# - Dropbox
# - AWS S3
# - Backblaze B2
# - etc.

# Name your remote: peppertree

# Test connection
rclone lsd peppertree:

# Manual backup test
peppertree-backup
```

### 3. Configure Environment Variables

```bash
# Navigate to production directory
cd /opt/peppertree-production

# Copy and edit environment file
cp .env.example .env
nano .env
```

**Required variables to change:**
```env
# Generate secure passwords (use: openssl rand -base64 32)
POSTGRES_PASSWORD=your_secure_password_here
SECRET_KEY=your_super_long_secret_key_min_50_chars
KEYCLOAK_DB_PASSWORD=another_secure_password
KEYCLOAK_ADMIN_PASSWORD=keycloak_admin_password
KEYCLOAK_CLIENT_SECRET=client_secret_here

# Email configuration
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
MAIL_DEFAULT_SENDER=your-email@gmail.com
OWNER_EMAIL=owner@17peppertree.co.za

# Domain
DOMAIN=17peppertree.co.za
```

### 4. Clone Application Repository

```bash
# Navigate to production directory
cd /opt/peppertree-production

# Clone your repository
git clone https://github.com/jheiberg/17peppertree.git .

# Verify files
ls -la
```

### 5. Generate SSL Certificates

```bash
# Install certificates using Let's Encrypt
certbot --nginx -d 17peppertree.co.za -d www.17peppertree.co.za

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose redirect HTTP to HTTPS (recommended)

# Verify auto-renewal
certbot renew --dry-run
```

### 6. Deploy Application

```bash
# Navigate to production directory
cd /opt/peppertree-production

# Build and start containers
docker compose -f docker-compose.production.yml up -d --build

# Monitor deployment
docker compose -f docker-compose.production.yml logs -f

# Verify all containers are running
docker ps
```

### 7. Verify Deployment

```bash
# Run health check
peppertree-healthcheck

# Check system status
peppertree-status

# Test website
curl https://17peppertree.co.za

# Test API
curl https://17peppertree.co.za/api/health
```

### 8. Configure CI/CD (Optional)

```bash
# Add deploy user SSH key
nano /home/deploy/.ssh/authorized_keys
# Paste your CI/CD public key (GitHub Actions, GitLab CI, etc.)

# Test deploy user access
ssh deploy@your-vps-ip docker ps
```

### 9. Final Reboot

```bash
# Reboot to apply all kernel changes
sudo reboot
```

---

## Useful Commands

### System Management

```bash
# Check system status
peppertree-status

# Run health checks
peppertree-healthcheck

# Run security audit
peppertree-security-audit

# Monitor resources
htop                    # CPU and RAM
docker stats           # Container resources
df -h                  # Disk usage
free -h                # Memory usage
```

### Docker Management

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View container logs
docker logs peppertree_backend_prod
docker logs peppertree_backend_prod --tail 100 -f

# Restart a container
docker restart peppertree_backend_prod

# Restart all containers
docker compose -f docker-compose.production.yml restart

# Stop all containers
docker compose -f docker-compose.production.yml down

# Start all containers
docker compose -f docker-compose.production.yml up -d

# Rebuild and restart
docker compose -f docker-compose.production.yml up -d --build
```

### Backup Management

```bash
# Run manual backup
peppertree-backup

# List backups
ls -lh /opt/peppertree-backups/

# Test backup integrity
gunzip -t /opt/peppertree-backups/peppertree_prod_*.sql.gz

# Restore from backup
BACKUP_FILE="/opt/peppertree-backups/peppertree_prod_20250121_020000.sql.gz"
gunzip -c $BACKUP_FILE | docker exec -i peppertree_db_prod psql -U postgres peppertree
```

### Security Management

```bash
# Check firewall status
sudo ufw status verbose

# Check fail2ban status
sudo fail2ban-client status

# Check banned IPs
sudo fail2ban-client status sshd

# Unban an IP
sudo fail2ban-client set sshd unbanip 1.2.3.4

# View failed login attempts
sudo grep "Failed password" /var/log/auth.log | tail -20

# View successful logins
sudo last -20
```

### Log Management

```bash
# View application logs
tail -f /var/log/peppertree/backup.log
tail -f /opt/peppertree-production/logs/nginx/access.log
tail -f /opt/peppertree-production/logs/nginx/error.log

# View Docker logs
docker logs peppertree_backend_prod --tail 100
docker logs peppertree_nginx_prod --tail 100

# Disk usage by logs
ncdu /var/log
ncdu /opt/peppertree-production/logs
```

### Updates and Maintenance

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
cd /opt/peppertree-production
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d

# Clean up old Docker images
docker image prune -a

# Check for security updates
sudo apt list --upgradable
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs peppertree_backend_prod --tail 100

# Check if port is already in use
sudo netstat -tulpn | grep :5000

# Restart container
docker restart peppertree_backend_prod

# Rebuild container
docker compose -f docker-compose.production.yml up -d --build backend
```

### Website Not Accessible

```bash
# Check if Nginx is running
docker ps | grep nginx

# Check Nginx configuration
docker exec peppertree_nginx_prod nginx -t

# Check firewall
sudo ufw status

# Check if ports are listening
sudo netstat -tulpn | grep -E ':80|:443'

# View Nginx error logs
docker logs peppertree_nginx_prod --tail 50
```

### Database Connection Issues

```bash
# Check if database is running
docker ps | grep db

# Check database logs
docker logs peppertree_db_prod --tail 50

# Test database connection
docker exec -it peppertree_db_prod psql -U postgres -d peppertree

# Check environment variables
docker exec peppertree_backend_prod env | grep DATABASE
```

### High Memory Usage

```bash
# Check memory usage
free -h
docker stats --no-stream

# Restart services
docker compose -f docker-compose.production.yml restart

# Clear system cache
sudo sync && echo 3 | sudo tee /proc/sys/vm/drop_caches
```

### Disk Space Full

```bash
# Check disk usage
df -h
ncdu /

# Clean Docker
docker system prune -a --volumes
docker image prune -a

# Clean old logs
sudo journalctl --vacuum-time=7d
find /var/log -name "*.gz" -mtime +30 -delete

# Clean old backups
find /opt/peppertree-backups -name "*.sql.gz" -mtime +30 -delete
```

---

## Security Best Practices

### Regular Maintenance

**Weekly:**
- [ ] Review monitoring alerts
- [ ] Check disk space (`df -h`)
- [ ] Review logs for errors
- [ ] Verify backup completion

**Monthly:**
- [ ] Update system packages
- [ ] Update Docker images
- [ ] Review fail2ban logs
- [ ] Test backup restoration
- [ ] Review SSL certificate expiry

**Quarterly:**
- [ ] Run security audit (`peppertree-security-audit`)
- [ ] Review user access
- [ ] Test disaster recovery procedures
- [ ] Update documentation

### SSH Security Tips

1. **Use SSH keys only** (password auth disabled by script)
2. **Protect your private key**: `chmod 600 ~/.ssh/id_ed25519`
3. **Use SSH agent**: `ssh-add ~/.ssh/id_ed25519`
4. **Change SSH port** (optional): Edit `/etc/ssh/sshd_config`
5. **Monitor auth logs**: `tail -f /var/log/auth.log`

### Password Security

1. **Use strong passwords**: Minimum 20 characters
2. **Generate random passwords**: `openssl rand -base64 32`
3. **Never reuse passwords**: Each service should have unique password
4. **Store securely**: Use password manager
5. **Rotate regularly**: Change every 90 days

### Docker Security

1. **Keep images updated**: Run updates monthly
2. **Scan for vulnerabilities**: Use `docker scan`
3. **Limit container resources**: Set memory/CPU limits
4. **Use secrets**: Never store passwords in Dockerfiles
5. **Review logs**: Monitor for suspicious activity

---

## Performance Tuning

### For High Traffic

If hosting 5+ properties or experiencing high traffic:

**Increase Swap:**
```bash
sudo swapoff /swapfile
sudo fallocate -l 4G /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

**Optimize PostgreSQL:**
```bash
# Edit postgresql.conf in container
docker exec -it peppertree_db_prod bash
vi /var/lib/postgresql/data/postgresql.conf

# Recommended settings for 8GB RAM:
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
work_mem = 16MB
```

**Nginx Caching:**
```nginx
# Add to nginx.conf
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;
proxy_cache my_cache;
proxy_cache_valid 200 60m;
```

---

## Related Documentation

- [SYSTEM_REQUIREMENTS.md](./SYSTEM_REQUIREMENTS.md) - Complete system requirements and versions
- [HA_DR_PLAN.md](./HA_DR_PLAN.md) - Disaster recovery procedures
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Application deployment
- [DOCKER_SETUP.md](./DOCKER_SETUP.md) - Docker configuration details

---

**Support:** For issues or questions, contact technical support or review logs in `/var/log/peppertree/`
