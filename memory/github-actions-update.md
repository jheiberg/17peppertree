# GitHub Actions CI/CD Update

**Date:** 2025-11-21

## Problem
CI/CD pipeline was NOT in sync with new staging authentication setup.

## Changes Made

### 1. Updated `.github/workflows/deploy.yml`

**Changed docker-compose to docker compose:**
```yaml
# Old (deprecated)
docker-compose -f docker-compose.staging.yml up -d

# New (Compose V2)
docker compose -f docker-compose.staging.yml up -d --build
```

**Added --build flag:**
Ensures latest changes are built on deployment.

**Added staging authentication health check:**
```yaml
- name: Health check (staging with auth)
  run: |
    curl -f -u "${{ secrets.STAGING_AUTH_USER }}:${{ secrets.STAGING_AUTH_PASSWORD }}" \
      https://staging.17peppertree.co.za/api/health || \
    curl -f -u "${{ secrets.STAGING_AUTH_USER }}:${{ secrets.STAGING_AUTH_PASSWORD }}" \
      http://${{ secrets.STAGING_HOST }}:8080/api/health || exit 1
```

**Logic:**
1. Try HTTPS with domain (after SSL configured)
2. Fallback to HTTP with IP:8080 (before SSL or for testing)
3. Both use HTTP Basic Auth with secrets

### 2. New Required Secrets

Add to GitHub repository secrets:

| Secret | Value | Purpose |
|--------|-------|---------|
| `STAGING_AUTH_USER` | `ci-bot` | Staging username for CI/CD |
| `STAGING_AUTH_PASSWORD` | `[password]` | Staging password for health checks |

**How to create user:**
```bash
# On VPS
staging-users add ci-bot
# Enter strong password
# Add password as GitHub secret
```

### 3. Updated Production Too

Changed production to use `docker compose` (no auth needed for production health check).

## What It Fixes

### Before (Broken)
- ❌ Health check failed (no auth credentials)
- ❌ Used deprecated docker-compose command
- ❌ Didn't rebuild on deploy (cached images)
- ❌ No fallback for HTTP testing

### After (Fixed)
- ✅ Health check with auth credentials
- ✅ Uses modern docker compose
- ✅ Always rebuilds on deploy (--build flag)
- ✅ Tries both HTTPS and HTTP (fallback)

## Pipeline Flow

```
1. Push to main branch
   ↓
2. Run tests (frontend + backend)
   ↓
3. Build Docker images
   ↓
4. Deploy to staging (/opt/peppertree-staging)
   ↓
5. Health check with auth
   ✓ https://staging.17peppertree.co.za/api/health
   ✓ Fallback: http://vps-ip:8080/api/health
   ↓
6. Success or fail
```

## Required Actions

### 1. Add New Secrets to GitHub

Navigate to: Repository → Settings → Secrets and variables → Actions

Add:
- `STAGING_AUTH_USER` = `ci-bot`
- `STAGING_AUTH_PASSWORD` = `[from staging-users]`

### 2. Create CI User on VPS

```bash
ssh deploy@vps-ip
staging-users add ci-bot
# Enter password (save for GitHub secret)
```

### 3. Test Pipeline

```bash
# Make small change
git checkout main
echo "Test" >> README.md
git commit -am "Test: CI/CD with auth"
git push origin main

# Watch Actions tab in GitHub
```

## Existing Secrets (Still Required)

### Docker Hub
- DOCKER_HUB_USERNAME
- DOCKER_HUB_TOKEN

### Staging SSH
- STAGING_HOST
- STAGING_USERNAME
- STAGING_SSH_KEY
- STAGING_SSH_PORT

### Production SSH
- PRODUCTION_HOST
- PRODUCTION_USERNAME
- PRODUCTION_SSH_KEY
- PRODUCTION_SSH_PORT
- PRODUCTION_URL

### Application
- REACT_APP_API_URL

### Optional
- SLACK_WEBHOOK_URL

## Health Check Logic

The health check is smart:

**Try 1: HTTPS with domain**
```bash
curl -u "user:pass" https://staging.17peppertree.co.za/api/health
```
Works after SSL certificate configured.

**Try 2: HTTP with IP (Fallback)**
```bash
curl -u "user:pass" http://154.12.34.56:8080/api/health
```
Works immediately, before SSL, or for testing.

**Both require auth**, so staging credentials needed.

## Potential Issues

### Issue 1: 403 Forbidden on Health Check

**Cause:** GitHub Actions runner IP not whitelisted

**Solution A:** Remove IP whitelist from /api/health endpoint only
```nginx
location /api/health {
    # No IP whitelist for health checks
    auth_basic "Staging";
    auth_basic_user_file /etc/nginx/.htpasswd-staging;
    proxy_pass http://staging_backend;
}
```

**Solution B:** Pipeline uses HTTP port 8080 (no IP whitelist by default)

### Issue 2: 401 Unauthorized

**Cause:** Wrong staging credentials in secrets

**Fix:** Verify credentials match staging-users

### Issue 3: Connection Timeout

**Cause:** Firewall blocking port 8080

**Fix:** 
```bash
sudo ufw allow 8080/tcp
sudo ufw reload
```

## Documentation Created

- `/docs/DEPLOYMENT_GUIDE.md` (includes GitHub Actions setup)
- Comprehensive guide with all secrets
- Troubleshooting steps
- Security best practices

## Full Documentation
See: `/docs/DEPLOYMENT_GUIDE.md`
