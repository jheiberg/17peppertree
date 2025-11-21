# System Requirements and Versions

**Document Version:** 1.0  
**Last Updated:** 2025-11-21

---

## Overview

This document specifies all system requirements, software versions, and dependencies for the 17 @ Peppertree application.

---

## Server Requirements (VPS)

### Operating System
- **Required:** Ubuntu 24.04 LTS
- **Alternative:** Ubuntu 24.04 LTS (no other versions officially supported)
- **Architecture:** x86_64 (amd64)

### Minimum Hardware (Single Property)
- **CPU:** 2 vCPUs
- **RAM:** 4 GB
- **Storage:** 40 GB SSD
- **Bandwidth:** 2 TB/month

### Recommended Hardware (Production)
- **CPU:** 2 vCPUs
- **RAM:** 8 GB
- **Storage:** 60-80 GB SSD
- **Bandwidth:** 3-5 TB/month

### Multi-Tenant Capacity (4-6 Properties)
- **CPU:** 2 vCPUs (sufficient)
- **RAM:** 8 GB (recommended)
- **Storage:** 80-100 GB SSD
- **Bandwidth:** 5 TB/month

---

## Software Versions

### Core Runtime Environments

| Software | Version | Used In | Notes |
|----------|---------|---------|-------|
| **Ubuntu** | 24.04 LTS | VPS | Long-term support until 2029 |
| **Docker** | 24.x+ | All environments | Compose V2 plugin required |
| **Docker Compose** | 2.x+ (plugin) | All environments | Use `docker compose` not `docker-compose` |
| **Python** | 3.11 | Backend | Used in Flask application |
| **Node.js** | 18.x LTS | Frontend build | Used for React compilation |
| **PostgreSQL** | 15 | Database | Alpine Linux image |
| **Nginx** | Alpine latest | Reverse proxy | Alpine Linux image |
| **Keycloak** | 23.0 | Authentication | Quay.io official image |

### Frontend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| React | 18.2.0 | UI framework |
| React Router | 6.20.1 | Client-side routing |
| Axios | 1.6.2 | HTTP client |
| Keycloak JS | 23.0.3 | Authentication client |
| React Toastify | 11.0.5 | Notifications |
| React Scripts | 5.0.1 | Build tooling |
| Tailwind CSS | 3.4.17 | Styling |

### Backend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| Flask | 2.3.3 | Web framework |
| Flask-SQLAlchemy | 3.0.5 | ORM |
| Flask-CORS | 4.0.0 | Cross-origin support |
| Flask-Mail | 0.9.1 | Email service |
| psycopg2-binary | 2.9.10 | PostgreSQL driver |
| Gunicorn | 21.2.0 | WSGI server |
| PyJWT | 2.8.0 | JWT handling |
| cryptography | 41.0.7 | Encryption |

### Testing Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| pytest | 7.4.3 | Python testing |
| pytest-flask | 1.3.0 | Flask test utilities |
| pytest-cov | 4.1.0 | Coverage reporting |
| @testing-library/react | 13.4.0 | React testing |
| @testing-library/jest-dom | 6.1.4 | DOM matchers |

---

## Development Environment

### Local Development Requirements

**Operating Systems:**
- Linux (Ubuntu 24.04 LTS recommended)
- macOS 11+ (Big Sur or later)
- Windows 10/11 with WSL2 (Ubuntu 24.04)

**Required Software:**
- Git 2.x+
- Docker Desktop 4.x+ (includes Docker Compose)
- Node.js 18.x LTS
- Python 3.11+
- Text editor/IDE (VS Code recommended)

**Optional Tools:**
- GitHub CLI (`gh`)
- PostgreSQL client (`psql`)
- Postman or similar API testing tool

### VS Code Extensions (Recommended)

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.vscode-pylance",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-azuretools.vscode-docker",
    "bradlc.vscode-tailwindcss"
  ]
}
```

---

## Production Environment

### Required Services

| Service | Container | Image | Port(s) |
|---------|-----------|-------|---------|
| PostgreSQL (Main) | peppertree_db_prod | postgres:15-alpine | 5432 |
| PostgreSQL (Keycloak) | peppertree_keycloak_db_prod | postgres:15-alpine | Internal |
| Flask Backend | peppertree_backend_prod | Custom (Python 3.11) | 5000 |
| React Frontend | peppertree_frontend_prod | Custom (Node 18 + Nginx) | 3000 |
| Keycloak | peppertree_keycloak_prod | quay.io/keycloak/keycloak:23.0 | 8080/8443 |
| Nginx | peppertree_nginx_prod | nginx:alpine | 80/443 |

### Network Ports

**External (Public):**
- 80/tcp - HTTP (redirects to HTTPS)
- 443/tcp - HTTPS (production)
- 22/tcp - SSH (for deployment)

**Staging Ports:**
- 8080/tcp - HTTP staging
- 8443/tcp - HTTPS staging

**Internal (Docker network only):**
- 5000 - Backend API
- 3000 - Frontend
- 5432 - PostgreSQL
- 8080 - Keycloak

---

## Security Requirements

### SSL/TLS
- **Provider:** Let's Encrypt (free)
- **Renewal:** Automatic via certbot
- **Protocols:** TLS 1.2, TLS 1.3
- **Ciphers:** HIGH:!aNULL:!MD5

### Firewall (UFW)
- **Default:** Deny all incoming
- **Allowed:** SSH (22), HTTP (80), HTTPS (443)
- **Staging:** 8080, 8443 (optional)

### Authentication
- **Admin:** Keycloak OAuth2/OIDC
- **Staging:** HTTP Basic Auth + IP Whitelist
- **Password Policy:** Minimum 20 characters, bcrypt hashing

### Automatic Updates
- **System:** Unattended security upgrades enabled
- **Docker:** Monthly manual updates
- **Dependencies:** Regular npm/pip audits

---

## Browser Support

### Supported Browsers

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |
| Mobile Safari | iOS 14+ |
| Chrome Mobile | Android 8+ |

### Not Supported
- Internet Explorer (any version)
- Opera Mini
- Legacy browsers without ES6 support

---

## Database Requirements

### PostgreSQL Configuration

**Main Database:**
- Name: `peppertree`
- User: `postgres`
- Encoding: UTF-8
- Locale: en_US.UTF-8
- Timezone: UTC

**Keycloak Database:**
- Name: `keycloak`
- User: `keycloak`
- Encoding: UTF-8
- Locale: en_US.UTF-8

### Recommended PostgreSQL Settings (8GB RAM VPS)

```ini
# Memory Configuration
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
work_mem = 16MB

# Connection Settings
max_connections = 100

# Write-Ahead Log
wal_buffers = 16MB
checkpoint_completion_target = 0.9

# Query Tuning
random_page_cost = 1.1  # For SSD
```

---

## Performance Benchmarks

### Expected Performance (8GB VPS, Single Property)

| Metric | Target | Notes |
|--------|--------|-------|
| API Response Time | <100ms | Average, excluding network |
| Page Load Time | <2s | First contentful paint |
| Database Queries | <50ms | Simple CRUD operations |
| Concurrent Users | 100-200 | Without performance degradation |
| Memory Usage | <4GB | Under normal load |
| CPU Usage | <50% | Under normal load |

### Load Testing Results

**Test Scenario:** 100 concurrent users, 10 requests/second

| Metric | Value |
|--------|-------|
| Average Response | 85ms |
| 95th Percentile | 150ms |
| 99th Percentile | 250ms |
| Error Rate | <0.1% |
| Memory Peak | 3.2GB |
| CPU Peak | 45% |

---

## CI/CD Requirements

### GitHub Actions

**Runner:** ubuntu-latest (GitHub-hosted)

**Required Secrets:**
- DOCKER_HUB_USERNAME
- DOCKER_HUB_TOKEN
- STAGING_HOST
- STAGING_USERNAME
- STAGING_SSH_KEY
- STAGING_SSH_PORT
- STAGING_AUTH_USER
- STAGING_AUTH_PASSWORD
- PRODUCTION_HOST
- PRODUCTION_USERNAME
- PRODUCTION_SSH_KEY
- PRODUCTION_SSH_PORT
- PRODUCTION_URL
- REACT_APP_API_URL

### Deployment Requirements

**VPS Access:**
- SSH key-based authentication
- Deploy user with docker group membership
- Sudo access (for initial setup only)

**Services:**
- Docker daemon running
- UFW firewall configured
- Certbot installed (for SSL)

---

## Backup Requirements

### Backup Storage

**Local (VPS):**
- Location: `/opt/peppertree-backups`
- Retention: 30 days
- Space Required: ~5-10GB

**Off-Site (Cloud):**
- Provider: Any rclone-compatible (Google Drive, S3, Dropbox, etc.)
- Retention: 90 days
- Space Required: ~20-30GB

### Backup Schedule

- **Daily:** Full database backup (2 AM)
- **Weekly:** Integrity verification (Sunday 3 AM)
- **Monthly:** Full system backup including configs
- **Quarterly:** Disaster recovery drill

---

## Monitoring Requirements

### Essential Metrics

**System Level:**
- CPU usage (target: <70%)
- RAM usage (target: <70% = 5.6GB)
- Disk usage (target: <75%)
- Network I/O
- Swap usage

**Application Level:**
- Container status (all running)
- API health endpoint (/api/health)
- Response times
- Error rates
- Database connections

**Security:**
- Failed login attempts
- SSH access logs
- Firewall blocks
- fail2ban bans

### Monitoring Tools

**Basic (Included):**
- peppertree-status (custom script)
- peppertree-healthcheck (custom script)
- htop (system monitoring)
- docker stats (container monitoring)

**Advanced (Optional):**
- Prometheus + Grafana
- Datadog
- New Relic
- UptimeRobot (external)

---

## Upgrade Path

### When to Upgrade VPS

**Triggers:**
- Consistent RAM usage >70% (5.6GB)
- CPU load average >1.5 for extended periods
- Hosting 7+ properties
- Response times degrading (>200ms average)
- Disk space >75% full

**Recommended Upgrade:**
- From: 2 vCPU / 8 GB RAM
- To: 4 vCPU / 16 GB RAM
- Cost: ~$80-120/month (vs $50-60/month)

### Version Upgrade Policy

**Operating System:**
- Major upgrade: Every LTS cycle (4 years)
- Security patches: Automatic (unattended-upgrades)
- Manual upgrades: Quarterly review

**Docker Images:**
- Python: Stay on 3.11.x (update monthly)
- Node: Stay on 18.x LTS (update monthly)
- PostgreSQL: Stay on 15.x (update quarterly)
- Nginx: Update monthly (Alpine rolling)
- Keycloak: Update on major releases (test thoroughly)

**Dependencies:**
- npm audit fix: Weekly
- pip updates: Monthly with testing
- Breaking changes: Plan 2-week testing window

---

## Compatibility Matrix

### Tested Configurations

| Ubuntu | Docker | Python | Node | PostgreSQL | Status |
|--------|--------|--------|------|------------|--------|
| 24.04 LTS | 24.0+ | 3.11 | 18 | 15 | ✅ Supported |
| 22.04 LTS | 24.0+ | 3.11 | 18 | 15 | ⚠️ Not tested |
| 20.04 LTS | 23.0+ | 3.11 | 18 | 15 | ❌ Not supported |

### Migration Path

**From Ubuntu 22.04 to 24.04:**

1. Backup all data
2. Test application on 24.04 VPS (staging)
3. Update documentation references
4. Deploy to new 24.04 VPS
5. Migrate DNS
6. Verify and monitor

**Estimated Downtime:** 2-4 hours

---

## Support and EOL Dates

| Software | Current Version | EOL Date | Action Required |
|----------|----------------|----------|-----------------|
| Ubuntu 24.04 LTS | 24.04.1 | April 2029 | None (5 years support) |
| Python 3.11 | 3.11.x | October 2027 | Plan upgrade to 3.12+ in 2026 |
| Node 18 LTS | 18.x | April 2025 | Upgrade to Node 20 LTS in Q1 2025 |
| PostgreSQL 15 | 15.x | November 2027 | Monitor for 16.x migration |
| Docker | 24.x | Rolling | Keep updated monthly |

---

## Related Documentation

- [VPS_SETUP_GUIDE.md](./VPS_SETUP_GUIDE.md) - VPS setup and hardware details
- [VPS_SETUP_GUIDE.md](./VPS_SETUP_GUIDE.md) - Installation guide
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment procedures
- [HA_DR_PLAN.md](./HA_DR_PLAN.md) - Disaster recovery

---

**Maintained By:** Technical Team  
**Review Schedule:** Quarterly  
**Last Audit:** 2025-11-21
