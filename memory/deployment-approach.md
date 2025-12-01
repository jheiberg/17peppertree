# Deployment Approach

**Created:** 2025-11-21  
**Last Updated:** 2025-11-21

---

## Deployment Strategy

The project uses a **direct GitHub download approach** for VPS deployment scripts.

### Current Approach ✅

Download scripts directly from GitHub:

```bash
# Download VPS setup script
curl -O https://raw.githubusercontent.com/jheiberg/17peppertree/main/scripts/setup/vps-secure-setup.sh

# Download staging auth script
curl -O https://raw.githubusercontent.com/jheiberg/17peppertree/main/scripts/setup/setup-staging-auth.sh

# Make executable and run
chmod +x vps-secure-setup.sh
sudo bash vps-secure-setup.sh
```

### Benefits

✓ **Always latest version** - Downloads from main branch  
✓ **Version controlled** - Scripts tracked in git  
✓ **No duplication** - Single source of truth in `scripts/`  
✓ **No sync issues** - No need to manually package  
✓ **Simple workflow** - One curl command  
✓ **Auditable** - Full git history available  

### Deployment Scripts Location

All deployment scripts are in the **`scripts/`** directory:

```
scripts/
  ├── setup/
  │   ├── vps-secure-setup.sh      # VPS initial setup & security
  │   └── setup-staging-auth.sh    # Staging environment auth
  └── deployment/
      └── deploy.sh                # Deploy to staging/production
```

### Application Deployment

For deploying the application itself (not server setup):

```bash
# On VPS, in project directory
cd /opt/peppertree-production  # or peppertree-staging
sudo bash scripts/deployment/deploy.sh production  # or staging
```

The `deploy.sh` script:
- Pulls latest code from GitHub
- Creates database backup
- Rebuilds containers
- Runs health checks
- Performs migrations

---

## Historical Note

### Removed: Deployment Package (2025-11-21)

Previously had:
- `deployment-package/` directory (gitignored)
- `peppertree-deployment-package.tar.gz` (gitignored)

**Why removed:**
1. Duplicated scripts from `scripts/` directory
2. Got out of sync with latest changes
3. Required manual packaging after each update
4. Not version controlled (gitignored)

**Replaced with:** Direct GitHub downloads (simpler, always current)

---

## VPS Setup Workflow

### Initial Server Setup

1. **Provision VPS** with Ubuntu 24.04 LTS
2. **Download setup script:**
   ```bash
   curl -O https://raw.githubusercontent.com/jheiberg/17peppertree/main/scripts/setup/vps-secure-setup.sh
   chmod +x vps-secure-setup.sh
   ```

3. **Run setup:**
   ```bash
   sudo bash vps-secure-setup.sh
   ```

4. **Reboot:**
   ```bash
   sudo reboot
   ```

5. **Clone repository:**
   ```bash
   cd /opt/peppertree-production
   git clone https://github.com/jheiberg/17peppertree.git .
   ```

6. **Configure environment:**
   ```bash
   cp .env.example .env
   nano .env  # Add credentials
   ```

7. **Deploy:**
   ```bash
   sudo bash scripts/deployment/deploy.sh production
   ```

### Staging Setup

After initial VPS setup:

```bash
# Download staging auth script
curl -O https://raw.githubusercontent.com/jheiberg/17peppertree/main/scripts/setup/setup-staging-auth.sh
chmod +x setup-staging-auth.sh

# Configure staging with basic auth
sudo bash setup-staging-auth.sh staging.17peppertree.co.za
```

---

## Script Updates

To update deployment scripts on VPS:

```bash
# Pull latest changes
cd /opt/peppertree-production
git pull origin main

# Scripts are now updated
# Next deployment will use new versions
```

---

## Best Practices

### For Script Development

1. **Edit in `scripts/` subdirectories** - Single source of truth
2. **Test locally** - Use Docker Compose for testing
3. **Commit and push** - Scripts go to GitHub
4. **Document changes** - Update docs/SCRIPTS.md and this memory bank

### For VPS Deployment

1. **Use curl downloads** - Always get latest
2. **Verify script content** - Check what you're running
3. **Keep backups** - deploy.sh creates automatic backups
4. **Monitor logs** - Check `/var/log/peppertree-deploy.log`

### Security

- **Review scripts** before running on VPS
- **Use HTTPS URLs** for downloads
- **Verify GitHub source** - Ensure correct repository
- **Check file permissions** after download

---

## Troubleshooting

### Script Download Fails

```bash
# Check connectivity
ping raw.githubusercontent.com

# Try with verbose output
curl -v https://raw.githubusercontent.com/jheiberg/17peppertree/main/scripts/vps-secure-setup.sh

# Alternative: Use git clone
git clone https://github.com/jheiberg/17peppertree.git
cd 17peppertree/scripts
```

### Wrong Script Version

```bash
# Check current branch
cd /opt/peppertree-production
git branch --show-current

# Ensure on correct branch
git checkout main  # or develop
git pull
```

---

## Related Documentation

- `docs/VPS_DEPLOYMENT.md` - Full VPS setup guide
- `docs/HA_DR_PLAN.md` - High availability & disaster recovery
- `docs/SCRIPTS.md` - Complete scripts documentation
- `scripts/setup/vps-secure-setup.sh` - Server setup script
- `scripts/deployment/deploy.sh` - Application deployment script
