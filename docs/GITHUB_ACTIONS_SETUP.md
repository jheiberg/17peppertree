# GitHub Actions CI/CD Setup Guide

**Document Version:** 1.0  
**Last Updated:** 2025-11-21  
**Workflow:** `.github/workflows/deploy.yml`

---

## Overview

This guide explains how to configure GitHub Actions secrets and environment variables for the CI/CD pipeline. The pipeline has been **updated to work with the staging authentication setup**.

---

## CI/CD Pipeline Flow

### Trigger Events
- **Push to `main` branch** → Deploy to staging
- **Push to `production` branch** → Deploy to production
- **Pull requests to `main`** → Run tests only

### Jobs Sequence

```
1. frontend-build (tests + build React)
2. backend-test (tests Flask with PostgreSQL)
3. docker-build (builds and pushes Docker images)
4. deploy-staging (deploys to staging - main branch only)
   OR
   deploy-production (deploys to production - production branch only)
5. notify (sends Slack notification - optional)
```

---

## Required GitHub Secrets

### Navigate to GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Docker Hub Secrets

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `DOCKER_HUB_USERNAME` | `your-dockerhub-username` | Docker Hub username |
| `DOCKER_HUB_TOKEN` | `dckr_pat_xxxxxxxxxxxx` | Docker Hub access token |

**Get Docker Hub Token:**
```bash
# Visit: https://hub.docker.com/settings/security
# Click "New Access Token"
# Name: github-actions-peppertree
# Access: Read & Write
# Copy the token (shows only once)
```

### Staging Server Secrets (NEW - Updated for Auth)

| Secret Name | Value | Example |
|-------------|-------|---------|
| `STAGING_HOST` | VPS IP address | `154.12.34.56` |
| `STAGING_USERNAME` | SSH username | `deploy` |
| `STAGING_SSH_KEY` | Private SSH key | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `STAGING_SSH_PORT` | SSH port | `22` |
| `STAGING_AUTH_USER` | 🆕 Staging username | `admin` or `ci-bot` |
| `STAGING_AUTH_PASSWORD` | 🆕 Staging password | `[from staging-users]` |

**🆕 New Secrets for Staging Authentication:**

The pipeline now requires staging credentials for health checks. Create a dedicated CI/CD user:

```bash
# On VPS, add CI/CD user to staging
staging-users add ci-bot
# Enter a strong password
# Save this password as STAGING_AUTH_PASSWORD secret
```

### Production Server Secrets

| Secret Name | Value | Example |
|-------------|-------|---------|
| `PRODUCTION_HOST` | VPS IP address | `154.12.34.56` |
| `PRODUCTION_USERNAME` | SSH username | `deploy` |
| `PRODUCTION_SSH_KEY` | Private SSH key | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PRODUCTION_SSH_PORT` | SSH port | `22` |
| `PRODUCTION_URL` | Production URL | `https://17peppertree.co.za` |

### Application Secrets

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `REACT_APP_API_URL` | `/api` or `https://domain.com/api` | Backend API URL |

### Optional Notification Secrets

| Secret Name | Value | Required |
|-------------|-------|----------|
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/...` | Optional |

---

## Setting Up SSH Keys for CI/CD

### Step 1: Generate SSH Key Pair

On your local machine:

```bash
# Generate new SSH key for CI/CD
ssh-keygen -t ed25519 -C "github-actions-peppertree" -f ~/.ssh/peppertree-deploy

# This creates:
# - peppertree-deploy (private key - add to GitHub secrets)
# - peppertree-deploy.pub (public key - add to VPS)
```

### Step 2: Add Public Key to VPS

```bash
# Copy public key content
cat ~/.ssh/peppertree-deploy.pub

# SSH to VPS and add to deploy user
ssh root@your-vps-ip

# Add to deploy user authorized_keys
sudo su - deploy
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Paste the public key content
# Save and exit

# Set permissions
chmod 600 ~/.ssh/authorized_keys
exit
```

### Step 3: Add Private Key to GitHub Secrets

```bash
# Copy private key content
cat ~/.ssh/peppertree-deploy

# Copy entire output including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# [key content]
# -----END OPENSSH PRIVATE KEY-----
```

Add to GitHub as `STAGING_SSH_KEY` and `PRODUCTION_SSH_KEY`.

### Step 4: Test SSH Connection

```bash
# Test from local machine
ssh -i ~/.ssh/peppertree-deploy deploy@your-vps-ip

# If it works without password, GitHub Actions will work too
```

---

## Updated Staging Deployment (With Auth)

The pipeline has been **updated** to handle staging authentication:

### Changes Made

**1. Updated Health Check:**
```yaml
- name: Health check (staging with auth)
  run: |
    curl -f -u "${{ secrets.STAGING_AUTH_USER }}:${{ secrets.STAGING_AUTH_PASSWORD }}" \
      https://staging.17peppertree.co.za/api/health || \
    curl -f -u "${{ secrets.STAGING_AUTH_USER }}:${{ secrets.STAGING_AUTH_PASSWORD }}" \
      http://${{ secrets.STAGING_HOST }}:8080/api/health || exit 1
```

**2. Changed docker-compose to docker compose:**
```bash
# Old (deprecated)
docker-compose -f docker-compose.staging.yml up -d

# New (updated)
docker compose -f docker-compose.staging.yml up -d --build
```

**3. Added Build Flag:**
```bash
docker compose up -d --build
# Ensures latest changes are built
```

### Health Check Logic

The health check tries:
1. **First:** HTTPS with domain (`https://staging.17peppertree.co.za/api/health`)
2. **Fallback:** HTTP with IP and port (`http://vps-ip:8080/api/health`)

Both use HTTP Basic Auth credentials.

---

## GitHub Environments (Optional but Recommended)

### Create Staging Environment

1. Go to **Settings** → **Environments**
2. Click **New environment**
3. Name: `staging`
4. Configure:
   - ✅ **Required reviewers:** (optional - add team members)
   - ✅ **Wait timer:** 0 minutes
   - ✅ **Deployment branches:** `main` only

### Create Production Environment

1. Name: `production`
2. Configure:
   - ✅ **Required reviewers:** Add yourself and team leads
   - ✅ **Wait timer:** 0 minutes (or 5 minutes for safety)
   - ✅ **Deployment branches:** `production` only

**Benefits:**
- Manual approval for production deployments
- Deployment history tracking
- Environment-specific secrets
- Protection rules

---

## Complete Secrets Checklist

Before first deployment, ensure all these secrets are set:

### Docker (Required)
- [ ] `DOCKER_HUB_USERNAME`
- [ ] `DOCKER_HUB_TOKEN`

### Staging (Required)
- [ ] `STAGING_HOST`
- [ ] `STAGING_USERNAME`
- [ ] `STAGING_SSH_KEY`
- [ ] `STAGING_SSH_PORT`
- [ ] 🆕 `STAGING_AUTH_USER`
- [ ] 🆕 `STAGING_AUTH_PASSWORD`

### Production (Required)
- [ ] `PRODUCTION_HOST`
- [ ] `PRODUCTION_USERNAME`
- [ ] `PRODUCTION_SSH_KEY`
- [ ] `PRODUCTION_SSH_PORT`
- [ ] `PRODUCTION_URL`

### Application (Required)
- [ ] `REACT_APP_API_URL`

### Notifications (Optional)
- [ ] `SLACK_WEBHOOK_URL`

---

## Deployment Workflow

### Staging Deployment (Automatic)

```bash
# 1. Make changes on feature branch
git checkout -b feature/new-feature
# ... make changes ...
git commit -m "Add new feature"
git push origin feature/new-feature

# 2. Create pull request to main
# GitHub Actions runs tests automatically

# 3. Merge to main
# Triggers automatic deployment to staging

# 4. Access staging to verify
https://staging.17peppertree.co.za
# Login with staging credentials
```

### Production Deployment (Manual)

```bash
# 1. Ensure staging is working
# Test all features on staging

# 2. Merge main to production branch
git checkout production
git merge main
git push origin production

# 3. GitHub Actions deploys to production
# If environment protection enabled, approve deployment

# 4. Verify production
https://17peppertree.co.za/api/health
```

---

## Monitoring Deployments

### View Workflow Runs

1. Go to **Actions** tab in GitHub
2. Click on workflow run
3. View logs for each job

### Common Issues

#### Deployment Fails with "Permission denied"

**Cause:** SSH key not added to VPS or wrong permissions

**Fix:**
```bash
# On VPS, check deploy user authorized_keys
sudo cat /home/deploy/.ssh/authorized_keys
# Should contain your GitHub Actions public key

# Check permissions
sudo ls -la /home/deploy/.ssh/
# Should be:
# drwx------ .ssh
# -rw------- authorized_keys
```

#### Health Check Fails with 401 Unauthorized

**Cause:** Staging credentials wrong or not set

**Fix:**
```bash
# Verify secrets in GitHub:
# STAGING_AUTH_USER and STAGING_AUTH_PASSWORD

# Test manually:
curl -u "username:password" https://staging.17peppertree.co.za/api/health
```

#### Health Check Fails with 403 Forbidden

**Cause:** GitHub Actions runner IP not whitelisted

**Fix:**

**Option 1: Remove IP whitelist from health endpoint**

Edit `/opt/peppertree-staging/nginx.staging-auth.conf`:

```nginx
location /api/health {
    # No IP whitelist for health checks
    # Still requires password
    auth_basic "Staging Environment";
    auth_basic_user_file /etc/nginx/.htpasswd-staging;
    
    proxy_pass http://staging_backend;
    # ... rest of proxy config
}
```

**Option 2: Whitelist GitHub Actions IPs**

Not recommended (IPs change frequently).

**Option 3: Use HTTP port without IP whitelist**

Health check already tries both HTTPS and HTTP fallback.

#### Docker Compose Not Found

**Cause:** Old docker-compose vs new docker compose command

**Fix:** Already updated in pipeline (uses `docker compose` not `docker-compose`)

---

## Testing the Pipeline

### Test Without Deploying

```bash
# Run tests locally to verify they pass
npm test
cd backend && pytest

# Ensure Docker builds work
docker build -t test-frontend -f Dockerfile.frontend .
docker build -t test-backend -f backend/Dockerfile ./backend
```

### Test Staging Deployment

```bash
# 1. Create a test branch
git checkout -b test/pipeline-check

# 2. Make a small change (like README)
echo "Test deployment" >> README.md
git commit -am "Test: Pipeline check"

# 3. Push to main (or create PR and merge)
git checkout main
git merge test/pipeline-check
git push origin main

# 4. Watch GitHub Actions
# Go to Actions tab and monitor deployment

# 5. Verify staging
curl -u "admin:password" https://staging.17peppertree.co.za/api/health
```

---

## Security Best Practices

### SSH Keys

1. **Use separate keys** for CI/CD (not your personal key)
2. **Rotate keys** every 6-12 months
3. **Use ed25519** (more secure than RSA)
4. **Never commit** private keys to repository

### Passwords

1. **Strong staging passwords** (20+ characters)
2. **Different from production**
3. **Rotate every 90 days**
4. **Use GitHub secret scanning** (enabled by default)

### Docker Hub

1. **Use access token** (not account password)
2. **Read & Write only** (not admin)
3. **Rotate tokens** annually
4. **Monitor usage** in Docker Hub

### Slack Webhooks

1. **Create channel-specific** webhooks
2. **Rotate if exposed**
3. **Monitor for unauthorized** posts

---

## Advanced: Multi-Environment Setup

### Separate Staging and Production Secrets

If using same VPS for both:

```yaml
# Staging uses different credentials
STAGING_AUTH_USER: staging-admin
STAGING_AUTH_PASSWORD: [staging password]

# Production doesn't have auth (or different auth)
PRODUCTION_USERNAME: deploy
```

### Multiple Staging Environments

For multiple properties:

```yaml
# Property 1 Staging
STAGING1_HOST: vps-ip
STAGING1_AUTH_USER: admin-property1
STAGING1_URL: https://staging1.17peppertree.co.za

# Property 2 Staging
STAGING2_HOST: vps-ip
STAGING2_AUTH_USER: admin-property2
STAGING2_URL: https://staging2.anotherproperty.co.za
```

Update workflow to deploy to multiple staging environments.

---

## Rollback Procedure

If deployment fails or introduces bugs:

### Automatic Rollback (Not Configured)

Currently not automated. Manual rollback required.

### Manual Rollback

```bash
# SSH to server
ssh deploy@vps-ip

# Staging rollback
cd /opt/peppertree-staging
git log --oneline -5  # Find previous commit
git checkout PREVIOUS_COMMIT_SHA
docker compose -f docker-compose.staging.yml up -d --build

# Or use docker images
docker images | grep peppertree
docker tag old-image:sha new-image:latest
docker compose -f docker-compose.staging.yml up -d
```

### Future Enhancement

Add rollback workflow:

```yaml
workflow_dispatch:
  inputs:
    environment:
      description: 'Environment to rollback'
      required: true
      type: choice
      options:
        - staging
        - production
    commit:
      description: 'Commit SHA to rollback to'
      required: true
```

---

## Troubleshooting Checklist

Before deployment:

- [ ] All secrets configured in GitHub
- [ ] SSH key added to deploy user on VPS
- [ ] Docker Hub credentials valid
- [ ] Staging auth user created (`staging-users add ci-bot`)
- [ ] VPS accessible from internet (ports 22, 8080, 8443)
- [ ] DNS configured for staging subdomain
- [ ] SSL certificate generated for staging
- [ ] Docker compose files present on VPS

After deployment fails:

- [ ] Check GitHub Actions logs
- [ ] SSH to VPS and check docker logs
- [ ] Verify staging is accessible manually
- [ ] Check firewall rules (`ufw status`)
- [ ] Check nginx configuration (`docker exec ... nginx -t`)
- [ ] Review recent changes that may have broken deployment

---

## Related Documentation

- [STAGING_SETUP_QUICK_START.md](./STAGING_SETUP_QUICK_START.md) - Staging authentication setup
- [STAGING_ACCESS_GUIDE.md](./STAGING_ACCESS_GUIDE.md) - All staging access methods
- [VPS_SETUP_GUIDE.md](./VPS_SETUP_GUIDE.md) - VPS initial configuration
- [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) - Manual deployment procedures

---

## Quick Reference

### View Workflow Status
```bash
# Using GitHub CLI
gh workflow list
gh run list
gh run view [run-id]
gh run watch
```

### Trigger Manual Deployment
```bash
# Not configured yet, but can add:
gh workflow run deploy.yml
```

### Check Staging After Deployment
```bash
# Health check
curl -u "ci-bot:password" https://staging.17peppertree.co.za/api/health

# Full test
curl -u "ci-bot:password" https://staging.17peppertree.co.za
```

### Check Production After Deployment
```bash
# Health check
curl https://17peppertree.co.za/api/health

# Full test
curl https://17peppertree.co.za
```

---

**Pipeline Status:** ✅ Updated for staging authentication  
**Required Action:** Add `STAGING_AUTH_USER` and `STAGING_AUTH_PASSWORD` secrets to GitHub
