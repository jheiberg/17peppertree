# Deploy Script Memory

**Date:** 2025-11-21  
**Last Updated:** 2025-11-21

## Script Purpose: `deploy.sh`

**Application deployment** and updates for both production and staging environments.

## Usage

```bash
# Deploy to staging
sudo bash scripts/deploy.sh staging

# Deploy to production  
sudo bash scripts/deploy.sh production

# Default is staging if no argument
sudo bash scripts/deploy.sh
```

## What It Does

### 1. Pre-Deployment
- Validates environment (staging/production)
- Sets environment-specific variables
- Checks Docker and Docker Compose V2
- Creates pre-deployment database backup (compressed)

### 2. Code Update
- Fetches latest from Git
- **Production:** Pulls from `main` branch
- **Staging:** Pulls from `develop` branch

### 3. Container Management
- Pulls latest Docker images
- Stops existing containers gracefully
- Builds and starts new containers
- Waits 30 seconds for services

### 4. Health Checks
- Verifies all containers are running
- Tests database connectivity (pg_isready)
- Checks backend API health endpoint
  - Production: http://localhost/api/health (port 80/443)
  - Staging: http://localhost:5000/api/health (port 5000)
- Retries up to 10 times with 10-second delays

### 5. Database Migrations
- Runs migrations.py if available
- Falls back to db.create_all() if needed
- Continues on failure (warning only)

### 6. Cleanup
- Prunes unused Docker resources
- Removes old backups (keeps last 10)

### 7. Summary & Notifications
- Shows deployment summary
- Lists running containers
- Sends Slack notification (if configured)

## Environment Configuration

### Production
- **Directory:** `/opt/peppertree-production`
- **Compose File:** `docker-compose.production.yml`
- **Git Branch:** `main`
- **Ports:** 80 (HTTP), 443 (HTTPS)
- **API URL:** `http://localhost/api/health`

### Staging
- **Directory:** `/opt/peppertree-staging`
- **Compose File:** `docker-compose.staging.yml`
- **Git Branch:** `develop`
- **Ports:** 8081 (Keycloak), 5000 (API), 5433 (DB)
- **API URL:** `http://localhost:5000/api/health`

## Backups

Location: `/opt/peppertree-backups/`

Format: `backup_<environment>_YYYYMMDD_HHMMSS.sql.gz`

Examples:
- `backup_production_20251121_140530.sql.gz`
- `backup_staging_20251121_093022.sql.gz`

Retention: Last 10 backups kept per environment

## Prerequisites

1. **VPS Setup** must be complete:
   - Docker and Docker Compose V2 installed
   - Project directories created
   - Git repository cloned

2. **Environment Files** must exist:
   - `/opt/peppertree-production/.env`
   - `/opt/peppertree-staging/.env`

3. **Git Access** configured:
   - SSH keys or credentials set up
   - Able to pull from repository

4. **Docker Permissions:**
   - Script must run as root/sudo
   - Deploy user in docker group (for CI/CD)

## CI/CD Integration

This script is called by GitHub Actions workflow:

```yaml
- name: Deploy to staging
  run: ssh deploy@vps "cd /opt/peppertree-staging && sudo bash scripts/deploy.sh staging"
```

## Health Check Retry Logic

```
Attempt 1: Check API → Wait 10s if failed
Attempt 2: Check API → Wait 10s if failed
...
Attempt 10: Check API → Exit with error if failed
```

Total wait time: Up to 100 seconds for API to respond

## Logging

Log file: `/var/log/peppertree-deploy.log`

All deployment actions are logged with timestamps.

## Slack Notifications

If `SLACK_WEBHOOK_URL` is set in `.env`:
- Sends success notification after deployment
- Message: "✅ Peppertree deployment to {environment} completed successfully"

## Common Issues & Solutions

### Issue: Docker Compose command not found
**Solution:** Run vps-secure-setup.sh to install Docker Compose V2

### Issue: Git pull fails
**Solution:** 
- Check SSH keys: `ssh -T git@github.com`
- Check branch exists: `git branch -a`
- Ensure repository cloned in correct directory

### Issue: Health check fails
**Solution:**
- Check container logs: `docker compose -f docker-compose.{env}.yml logs`
- Verify .env file exists and is configured
- Check port conflicts: `sudo netstat -tulpn | grep LISTEN`

### Issue: Database backup fails
**Solution:**
- Check database container is running
- Verify disk space: `df -h`
- Check backup directory permissions

### Issue: Migrations fail
**Solution:**
- Check migrations.py exists in backend/
- Verify database connection in .env
- Check container logs: `docker logs peppertree_backend_{env}`

## Differences from setup-staging-auth.sh

`deploy.sh` and `setup-staging-auth.sh` serve COMPLETELY DIFFERENT purposes:

| Feature | deploy.sh | setup-staging-auth.sh |
|---------|-----------|----------------------|
| **Purpose** | Deploy application | Configure staging security |
| **When** | Every deployment | One-time setup |
| **Frequency** | Multiple times/day | Once |
| **What** | Code/containers | Authentication |
| **Does** | Pull code, restart | HTTP Basic Auth, IP whitelist |
| **Affects** | Application state | Nginx configuration |
| **Run by** | CI/CD or manually | Admin manually |

## Production vs Staging Differences

### Code Branch
- **Production:** `main` (stable, tested)
- **Staging:** `develop` (latest features)

### Ports
- **Production:** 80/443 (standard HTTP/HTTPS)
- **Staging:** 8081/5000/5433 (non-standard)

### Security
- **Production:** 
  - SSL/TLS required
  - Public access
  - nginx:alpine

- **Staging:**
  - HTTP Basic Auth (setup-staging-auth.sh)
  - IP whitelist available
  - Optional SSL

### Monitoring
- **Production:** 
  - Slack notifications
  - More critical health checks
  
- **Staging:**
  - Less critical
  - Testing environment

## Deployment Flow

```
1. Deploy script runs
   ↓
2. Backup current database
   ↓
3. Pull latest code (main/develop)
   ↓
4. Pull Docker images
   ↓
5. Stop old containers
   ↓
6. Start new containers (with --build)
   ↓
7. Wait 30 seconds
   ↓
8. Health checks (up to 100s)
   ↓
9. Run migrations
   ↓
10. Cleanup old resources
   ↓
11. Summary + notification
```

## Manual Rollback

If deployment fails:

```bash
# 1. Check what went wrong
docker compose -f docker-compose.production.yml logs

# 2. Find last good backup
ls -lht /opt/peppertree-backups/backup_production_*.sql.gz | head -5

# 3. Restore database
gunzip -c /opt/peppertree-backups/backup_production_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose -f docker-compose.production.yml exec -T db psql -U postgres peppertree

# 4. Checkout previous commit
git log --oneline -10
git checkout <previous-commit-hash>

# 5. Redeploy
sudo bash scripts/deploy.sh production
```

## Best Practices

1. **Always test on staging first**
   ```bash
   sudo bash scripts/deploy.sh staging
   # Test thoroughly
   sudo bash scripts/deploy.sh production
   ```

2. **Monitor logs during deployment**
   ```bash
   tail -f /var/log/peppertree-deploy.log
   ```

3. **Check backups regularly**
   ```bash
   ls -lh /opt/peppertree-backups/
   ```

4. **Test rollback procedure**
   Practice restoring from backup in staging

5. **Keep backups offsite**
   Use rclone to sync to cloud storage

## Related Scripts

- `vps-secure-setup.sh` - Initial VPS setup
- `setup-staging-auth.sh` - Staging authentication
- `backup.sh` - Manual/scheduled backups
- `peppertree-status` - System status check
- `peppertree-healthcheck` - Health validation

## Docker Compose V2

The script uses **Docker Compose V2** (plugin):

```bash
# V2 (current) ✅
docker compose up

# V1 (deprecated) ❌
docker-compose up
```

All `docker-compose` commands updated to `docker compose`

## Recent Updates

**2025-11-21:**
- ✅ Updated to Docker Compose V2 syntax
- ✅ Fixed branch names (main/develop, not production/main)
- ✅ Fixed staging API port (5000, not 8080)
- ✅ Use migrations.py script
- ✅ Compress backups with gzip
- ✅ Add --build flag to docker compose up

## Quick Reference

```bash
# Deploy staging
sudo bash scripts/deploy.sh staging

# Deploy production
sudo bash scripts/deploy.sh production

# View logs
tail -f /var/log/peppertree-deploy.log

# Check deployment status
docker compose -f docker-compose.production.yml ps

# View container logs
docker logs peppertree_backend_production

# Manual backup
peppertree-backup

# Restore backup
gunzip -c backup.sql.gz | docker compose -f docker-compose.production.yml exec -T db psql -U postgres peppertree
```
