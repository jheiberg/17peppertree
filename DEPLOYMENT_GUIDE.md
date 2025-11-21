# 🚀 CI/CD Deployment Guide - 17 @ Peppertree

## Overview

This guide sets up a complete CI/CD pipeline using GitHub Actions, Docker, and automated deployment to your servers. The pipeline supports both staging and production environments with automatic testing, building, and deployment.

## 📋 Prerequisites

### Required Accounts & Services
- **GitHub repository** with your code
- **Docker Hub account** for image storage
- **Production server** (VPS/Cloud instance)
- **Staging server** (optional but recommended)
- **Domain name** with DNS access

### Server Requirements
- **OS**: Ubuntu 24.04 LTS
- **RAM**: Minimum 2GB (4GB+ recommended)
- **Storage**: Minimum 20GB SSD
- **CPU**: 2+ cores recommended
- **Network**: Static IP address

## 🛠️ Setup Instructions

### Step 1: Server Setup

#### 1.1 Initial Server Configuration
```bash
# Connect to your server
ssh root@your-server-ip

# Run the automated setup script
curl -O https://raw.githubusercontent.com/jheiberg/17peppertree/main/scripts/vps-secure-setup.sh
chmod +x vps-secure-setup.sh
sudo bash vps-secure-setup.sh
```

#### 1.2 Manual Configuration (Alternative)
If you prefer manual setup, follow these steps:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create project directories
sudo mkdir -p /opt/peppertree-production
sudo mkdir -p /opt/peppertree-staging
sudo mkdir -p /opt/peppertree-backups

# Create deploy user
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy
```

### Step 2: Repository Setup

#### 2.1 Clone Repository on Servers
```bash
# Production
cd /opt/peppertree-production
git clone https://github.com/yourusername/17-peppertree.git .

# Staging  
cd /opt/peppertree-staging
git clone https://github.com/yourusername/17-peppertree.git .
```

#### 2.2 Environment Configuration
```bash
# Production
cp /opt/peppertree-production/.env.example /opt/peppertree-production/.env
nano /opt/peppertree-production/.env

# Staging
cp /opt/peppertree-staging/.env.example /opt/peppertree-staging/.env
nano /opt/peppertree-staging/.env
```

### Step 3: SSL Certificate Setup

#### 3.1 Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx
```

#### 3.2 Generate SSL Certificate
```bash
# Stop nginx if running
sudo systemctl stop nginx

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Copy certificates to project directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/peppertree-production/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/peppertree-production/ssl/
sudo chown -R deploy:deploy /opt/peppertree-production/ssl/
```

#### 3.3 Setup Certificate Renewal
```bash
# Add to crontab
echo "0 3 * * 0 /usr/bin/certbot renew --quiet && /opt/peppertree-production/scripts/deploy.sh production" | sudo crontab -
```

### Step 4: GitHub Secrets Configuration

Go to your GitHub repository → Settings → Secrets and Variables → Actions

#### 4.1 Required Secrets

**Docker Hub:**
- `DOCKER_HUB_USERNAME`: Your Docker Hub username
- `DOCKER_HUB_TOKEN`: Docker Hub access token

**Production Server:**
- `PRODUCTION_HOST`: Your production server IP/domain
- `PRODUCTION_USERNAME`: SSH username (usually 'deploy')
- `PRODUCTION_SSH_KEY`: Private SSH key content
- `PRODUCTION_SSH_PORT`: SSH port (default: 22)
- `PRODUCTION_URL`: Your production URL (https://your-domain.com)

**Staging Server:**
- `STAGING_HOST`: Your staging server IP/domain
- `STAGING_USERNAME`: SSH username (usually 'deploy')
- `STAGING_SSH_KEY`: Private SSH key content
- `STAGING_SSH_PORT`: SSH port (default: 22)

**Application:**
- `REACT_APP_API_URL`: Your production API URL

**Optional:**
- `SLACK_WEBHOOK_URL`: For deployment notifications

#### 4.2 Generate SSH Keys for CI/CD
```bash
# On your local machine
ssh-keygen -t ed25519 -C "cicd@peppertree" -f ~/.ssh/peppertree_deploy

# Add public key to server
ssh-copy-id -i ~/.ssh/peppertree_deploy.pub deploy@your-server-ip

# Copy private key content to GitHub secret
cat ~/.ssh/peppertree_deploy
```

### Step 5: DNS Configuration

Point your domain to your server:
```
# A Records
your-domain.com     → Your-Server-IP
www.your-domain.com → Your-Server-IP

# For staging (optional)
staging.your-domain.com → Your-Staging-IP
```

### Step 6: First Deployment

#### 6.1 Manual First Deployment
```bash
# On production server
cd /opt/peppertree-production
sudo ./scripts/deploy.sh production
```

#### 6.2 Automated Deployment
Push to your repository:
```bash
# Deploy to staging
git push origin main

# Deploy to production  
git checkout production
git merge main
git push origin production
```

## 🔄 CI/CD Workflow

### Deployment Flow

1. **Code Push** → Triggers GitHub Actions
2. **Testing** → Runs frontend/backend tests
3. **Building** → Creates Docker images
4. **Publishing** → Pushes to Docker Hub
5. **Deployment** → Deploys to staging/production
6. **Health Checks** → Verifies deployment
7. **Notifications** → Sends status updates

### Branch Strategy

- **`main` branch** → Deploys to staging automatically
- **`production` branch** → Deploys to production automatically
- **Pull Requests** → Runs tests only (no deployment)

### Environment Mapping

| Branch | Environment | URL | Auto-Deploy |
|--------|-------------|-----|-------------|
| `main` | Staging | http://staging.your-domain.com:8080 | ✅ Yes |
| `production` | Production | https://your-domain.com | ✅ Yes |

## 📊 Monitoring & Maintenance

### Health Checks

The pipeline includes automatic health checks:
- **Container Health**: All services running
- **Database**: Connection and readiness
- **API**: Endpoint responsiveness
- **SSL**: Certificate validity

### Backup Strategy

**Automatic Backups:**
- **Daily**: Database backups at 2 AM
- **Retention**: 30 days
- **Location**: `/opt/peppertree-backups/`

**Manual Backup:**
```bash
/opt/peppertree-production/scripts/backup.sh production
```

### Log Management

**Log Locations:**
- **Application**: `/var/log/peppertree/`
- **Nginx**: `/opt/peppertree-*/logs/nginx/`
- **Docker**: `docker-compose logs`

**Log Rotation**: Automatic via logrotate (weekly)

### Monitoring Commands

```bash
# Check service status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Check resource usage
htop
docker stats

# Monitor disk space
df -h
du -sh /opt/peppertree-*
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Deployment Fails
```bash
# Check GitHub Actions logs
# Check server logs
tail -f /var/log/peppertree-deploy.log

# Manual deployment
cd /opt/peppertree-production
./scripts/deploy.sh production
```

#### 2. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew --dry-run
```

#### 3. Database Connection Issues
```bash
# Check database container
docker-compose -f docker-compose.production.yml exec db pg_isready -U postgres

# View database logs
docker-compose -f docker-compose.production.yml logs db
```

#### 4. Performance Issues
```bash
# Check resource usage
htop
docker stats

# Check disk space
df -h

# Clean up Docker
docker system prune -f
```

### Recovery Procedures

#### Database Recovery
```bash
# List available backups
ls -la /opt/peppertree-backups/

# Restore from backup
docker-compose -f docker-compose.production.yml exec -T db psql -U postgres peppertree < /backups/backup_production_YYYYMMDD_HHMMSS.sql
```

#### Rollback Deployment
```bash
# Rollback to previous version
git checkout production
git reset --hard HEAD~1
git push --force origin production
```

## 📞 Support & Updates

### Getting Help
- **Documentation**: Check this guide first
- **Logs**: Always check application and deployment logs
- **GitHub Issues**: Create an issue for bugs/features
- **Server Access**: Ensure you have SSH access

### Updating the Pipeline
- **Workflow**: Edit `.github/workflows/deploy.yml`
- **Docker**: Update Dockerfiles and compose files
- **Scripts**: Modify deployment scripts as needed
- **Environment**: Update environment variables

### Security Updates
- **Server**: Run `sudo apt update && sudo apt upgrade` monthly
- **Docker Images**: Rebuild images regularly
- **SSL**: Certificates auto-renew every 60 days
- **Secrets**: Rotate secrets quarterly

## ✅ Checklist

### Pre-Deployment
- [ ] Server is set up and accessible
- [ ] DNS is pointing to your server
- [ ] SSL certificate is installed
- [ ] Environment variables are configured
- [ ] GitHub secrets are set up
- [ ] SSH keys are configured for CI/CD

### Post-Deployment
- [ ] Website is accessible via HTTPS
- [ ] API endpoints are responding
- [ ] Database is connected and migrations ran
- [ ] Email functionality is working
- [ ] Monitoring is active
- [ ] Backups are scheduled

### Regular Maintenance
- [ ] Monitor server resources monthly
- [ ] Check backup integrity monthly
- [ ] Update server packages monthly
- [ ] Review security logs weekly
- [ ] Test disaster recovery quarterly

---

## 🎉 Congratulations!

Your CI/CD pipeline is now set up! Every push to `main` deploys to staging, and every push to `production` deploys to production with full testing, building, and health checks.

**Next Steps:**
1. Set up monitoring and alerting
2. Configure backup to cloud storage
3. Add performance monitoring
4. Set up log aggregation
5. Plan disaster recovery procedures