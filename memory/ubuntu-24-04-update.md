# Ubuntu 24.04 LTS Update

**Date:** 2025-11-21

## Changes Made

All documentation and scripts updated to use **Ubuntu 24.04 LTS** as the standard.

### Files Updated

1. **docs/HA_DR_PLAN.md**
   - Changed: Ubuntu 22.04 → Ubuntu 24.04

2. **docs/VPS_SETUP_GUIDE.md**
   - Changed: "Ubuntu 22.04 VPS" → "Ubuntu 24.04 LTS VPS"
   - Removed: "(or Ubuntu 24.04)" - now standard

3. **docs/VPS_SPECIFICATIONS.md**
   - Changed: "Ubuntu 22.04 LTS or Debian 11+" → "Ubuntu 24.04 LTS"

4. **scripts/vps-secure-setup.sh**
   - Updated header: "Ubuntu 22.04 VPS" → "Ubuntu 24.04 LTS VPS"
   - Updated version check: Now checks for "Ubuntu 24.04" only
   - Added: Shows current OS version if not 24.04
   - Better error message

5. **DEPLOYMENT_GUIDE.md**
   - Changed: "Ubuntu 20.04 LTS or newer" → "Ubuntu 24.04 LTS"

6. **DEVELOPMENT_GUIDE.md**
   - Changed: "Ubuntu 20.04+ recommended" → "Ubuntu 24.04 LTS recommended"

7. **memory/vps-setup-script.md**
   - Changed: "Ubuntu 22.04 VPS" → "Ubuntu 24.04 LTS VPS"

### New Documentation

8. **docs/SYSTEM_REQUIREMENTS.md** (NEW)
   - Comprehensive system requirements document
   - All version specifications
   - Hardware requirements
   - Browser support
   - Performance benchmarks
   - Compatibility matrix
   - Upgrade paths

## Version Standards

### Operating System
- **Standard:** Ubuntu 24.04 LTS
- **Support Until:** April 2029 (5 years)
- **Alternative:** None (24.04 only)

### Runtime Versions
- **Python:** 3.11.x
- **Node.js:** 18.x LTS
- **Docker:** 24.x+
- **PostgreSQL:** 15.x
- **Nginx:** Alpine (latest)
- **Keycloak:** 23.0

## Script Behavior

### vps-secure-setup.sh

**Before:**
```bash
if ! grep -q "Ubuntu 22.04\|Ubuntu 24.04" /etc/os-release; then
    warning "This script is optimized for Ubuntu 22.04/24.04 LTS"
```

**After:**
```bash
if ! grep -q "Ubuntu 24.04" /etc/os-release; then
    warning "This script is optimized for Ubuntu 24.04 LTS"
    warning "You are running: $(grep PRETTY_NAME /etc/os-release | cut -d'"' -f2)"
```

Now shows the actual OS version and recommends 24.04 specifically.

## Compatibility Matrix

From SYSTEM_REQUIREMENTS.md:

| Ubuntu | Docker | Python | Node | PostgreSQL | Status |
|--------|--------|--------|------|------------|--------|
| 24.04 LTS | 24.0+ | 3.11 | 18 | 15 | ✅ Supported |
| 22.04 LTS | 24.0+ | 3.11 | 18 | 15 | ⚠️ Not tested |
| 20.04 LTS | 23.0+ | 3.11 | 18 | 15 | ❌ Not supported |

## Migration Notes

If currently on Ubuntu 22.04:

1. Backup all data
2. Test on 24.04 VPS (staging)
3. Update documentation
4. Deploy to new 24.04 VPS
5. Migrate DNS
6. Verify and monitor

**Estimated Downtime:** 2-4 hours

## Why Ubuntu 24.04 LTS?

1. **Latest LTS:** Released April 2024
2. **Long Support:** Until April 2029 (5 years)
3. **Modern Kernel:** Linux 6.8+
4. **Better Security:** Latest security features
5. **Docker Support:** Native support for latest Docker
6. **Performance:** Better resource management
7. **Package Updates:** Latest stable packages

## Docker Base Images

Note: Docker containers use their own base images:
- Python: `python:3.11-slim` (Debian-based)
- Node/Nginx: `node:18-alpine` and `nginx:alpine` (Alpine Linux)
- PostgreSQL: `postgres:15-alpine` (Alpine Linux)

VPS OS (Ubuntu 24.04) is for the host system only.

## Verification

All references checked:
- ✅ 0 old Ubuntu version references (except intentional compatibility matrix)
- ✅ 17 Ubuntu 24.04 LTS references
- ✅ All scripts updated
- ✅ All documentation updated
- ✅ Memory bank updated

## Related Files

All documentation now consistent:
- VPS setup guides
- Deployment guides
- HA/DR plan
- System requirements
- All scripts
- Memory bank

## Full Documentation
See: `/docs/SYSTEM_REQUIREMENTS.md`
