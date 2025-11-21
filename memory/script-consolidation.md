# VPS Setup Scripts Consolidation

**Date:** 2025-11-21

## What Changed

Merged `setup-server.sh` into `vps-secure-setup.sh` to eliminate duplication.

## Scripts Overview

### Main Setup Script: `vps-secure-setup.sh`

**Comprehensive VPS setup** (23KB, 873 lines):
- Ubuntu 24.04 LTS compatibility check
- System updates and essential packages
- Docker and Docker Compose V2 installation
- Security hardening (SSH, fail2ban, UFW)
- Automatic security updates (unattended-upgrades)
- 2GB swap file creation
- Kernel optimization (network, memory, filesystem)
- Deploy user creation for CI/CD
- Project directories (/opt/peppertree-*)
- Backup system with rclone support
- Monitoring tools (peppertree-status, peppertree-healthcheck)
- Security audit script
- Log rotation configuration
- Timezone configuration (Africa/Johannesburg)
- Environment file templates
- 15 well-organized sections with progress indicators

### Wrapper Script: `setup-server.sh`

**Deprecated wrapper** (98 lines):
- Shows deprecation notice
- Explains benefits of comprehensive setup
- Calls `vps-secure-setup.sh` automatically
- Downloads from GitHub if not found locally
- Maintained for backwards compatibility

### Staging Authentication: `setup-staging-auth.sh`

**Separate purpose** (17KB, 561 lines):
- HTTP Basic Auth configuration
- IP whitelist management
- Nginx configuration generation
- User management tool (staging-users)
- SSL/HTTPS ready
- Search engine blocking

## Usage

### Recommended (Direct):
```bash
curl -O https://raw.githubusercontent.com/jheiberg/17peppertree/main/scripts/vps-secure-setup.sh
chmod +x vps-secure-setup.sh
sudo bash vps-secure-setup.sh
```

### Backwards Compatible:
```bash
# Still works - automatically calls vps-secure-setup.sh
sudo bash scripts/setup-server.sh
```

### Staging Setup (After VPS Setup):
```bash
sudo bash scripts/setup-staging-auth.sh staging.yourdomain.com
```

## Why Consolidate?

### Before:
- `setup-server.sh`: 284 lines (basic setup)
- `vps-secure-setup.sh`: 873 lines (comprehensive)
- **Problem:** Code duplication, confusion about which to use

### After:
- `vps-secure-setup.sh`: 873 lines (comprehensive - unchanged)
- `setup-server.sh`: 98 lines (wrapper only)
- **Result:** Single source of truth, no duplication

## What's Different?

### setup-server.sh (Old Version):
- Basic system updates
- Docker installation
- Firewall configuration
- fail2ban basic config
- Project directories
- Deploy user creation
- Log rotation
- System limits
- Kernel optimization (basic)

### vps-secure-setup.sh (Comprehensive):
**All of the above PLUS:**
- ✅ Ubuntu 24.04 version check
- ✅ SSH hardening (no root, no passwords)
- ✅ Enhanced fail2ban with custom rules
- ✅ Automatic security updates
- ✅ 2GB swap file
- ✅ Advanced kernel tuning
- ✅ Monitoring scripts (status, healthcheck, audit)
- ✅ Cloud backup with rclone
- ✅ Security audit tool
- ✅ Better progress indicators
- ✅ Comprehensive error handling
- ✅ Detailed logging
- ✅ NTP time synchronization

## Features Comparison

| Feature | setup-server.sh | vps-secure-setup.sh |
|---------|-----------------|---------------------|
| System Updates | ✅ | ✅ |
| Docker Install | ✅ | ✅ |
| Firewall (UFW) | ✅ | ✅ Enhanced |
| fail2ban | ✅ Basic | ✅ Advanced |
| SSH Hardening | ❌ | ✅ |
| Auto Updates | ❌ | ✅ |
| Swap File | ❌ | ✅ 2GB |
| Kernel Tuning | ✅ Basic | ✅ Advanced |
| Deploy User | ✅ | ✅ |
| Directories | ✅ | ✅ |
| Log Rotation | ✅ | ✅ |
| Monitoring Tools | ❌ | ✅ 4 scripts |
| Cloud Backup | ❌ | ✅ rclone |
| Security Audit | ❌ | ✅ |
| Version Check | ❌ | ✅ Ubuntu 24.04 |
| NTP Config | ❌ | ✅ |
| Progress UI | ❌ | ✅ Sections |

## Monitoring Tools Created

**By vps-secure-setup.sh:**

1. `peppertree-status` - System and container status
2. `peppertree-healthcheck` - Health checks (disk, memory, API)
3. `peppertree-backup` - Manual backup trigger
4. `peppertree-security-audit` - Security configuration audit

**Commands:**
```bash
peppertree-status          # Check everything
peppertree-healthcheck     # Run health checks
peppertree-backup          # Backup now
peppertree-security-audit  # Audit security
```

## Migration Path

### If using old setup-server.sh:

**No action needed!** It automatically calls vps-secure-setup.sh now.

**Optional:** Update any documentation to reference vps-secure-setup.sh directly.

## Documentation Updated

- [x] DEPLOYMENT_GUIDE.md - Changed to vps-secure-setup.sh
- [x] DEVELOPMENT_GUIDE.md - Changed to vps-secure-setup.sh
- [x] memory/script-consolidation.md - Created (this file)
- [x] memory/vps-setup-script.md - Already references vps-secure-setup.sh

## Quick Reference

### VPS Initial Setup:
```bash
# Download and run comprehensive setup
curl -O https://raw.githubusercontent.com/jheiberg/17peppertree/main/scripts/vps-secure-setup.sh
chmod +x vps-secure-setup.sh
sudo bash vps-secure-setup.sh
```

### After Setup:
```bash
# Reboot
sudo reboot

# Configure staging (optional)
sudo bash scripts/setup-staging-auth.sh staging.17peppertree.co.za

# Check status
peppertree-status

# Run health check
peppertree-healthcheck

# Security audit
peppertree-security-audit
```

## Benefits of Consolidation

1. **Single Source of Truth** - One script to maintain
2. **Better Security** - Comprehensive hardening by default
3. **No Confusion** - Clear which script to use
4. **Less Maintenance** - 241 fewer lines to maintain
5. **Backwards Compatible** - Old scripts still work
6. **Better Features** - Everyone gets monitoring tools
7. **Consistent Setup** - All servers configured identically

## Script Locations

```
scripts/
├── vps-secure-setup.sh      (Main - Comprehensive VPS setup)
├── setup-server.sh           (Wrapper - Calls vps-secure-setup.sh)
├── setup-staging-auth.sh     (Separate - Staging authentication)
├── backup.sh                 (Backup operations)
└── deploy.sh                 (Deployment operations)
```

## Related Memory Files

- `vps-setup-script.md` - VPS setup script details
- `staging-setup-script.md` - Staging authentication
- `vps-specifications.md` - Hardware requirements
- `ha-dr-plan.md` - Disaster recovery

## Commit History

- `e0a3b63` - Refactor: Merge setup-server.sh into wrapper
- `34d78cb` - Fix: Handle NTP not supported gracefully
- `a8124ad` - Fix: Correct GitHub repository name
- `4f42bda` - Docs: Add VPS setup quick access methods
- `915c70e` - Feat: Complete VPS infrastructure setup

## Future Enhancements

Possible improvements to vps-secure-setup.sh:

1. **Interactive Mode** - Ask questions instead of defaults
2. **Multiple Timezone Support** - Not just Africa/Johannesburg
3. **Docker Registry Options** - Private registries
4. **Custom Firewall Rules** - User-defined ports
5. **Database Options** - PostgreSQL tuning presets
6. **Monitoring Integration** - Datadog, New Relic setup
7. **Backup Destination** - AWS S3, Google Cloud, Dropbox
8. **Multi-Site Support** - Setup multiple properties at once

## Summary

**Before:** Two separate scripts with overlapping functionality
**After:** One comprehensive script with backwards-compatible wrapper
**Result:** Better security, easier maintenance, clear documentation
