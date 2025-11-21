# VPS Specifications for 17 @ Peppertree Application

**Document Version:** 1.0  
**Last Updated:** 2025-11-21

## Overview

This document outlines the Virtual Private Server (VPS) specifications required to run the 17 @ Peppertree hospitality booking application, including capacity planning for multi-tenant deployments.

---

## Current Single-Site Configuration

### Recommended VPS Specifications

**Selected Configuration:** 2 vCPU / 8 GB RAM

#### Minimum Specs:
- **CPU:** 2 vCPUs
- **RAM:** 4 GB
- **Storage:** 40 GB SSD
- **Bandwidth:** 2 TB/month

#### Optimal Specs (Selected):
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

---

## Multi-Tenant Capacity Planning

### Scalability Model

The architecture allows multiple accommodation websites to share backend infrastructure:
- **Shared:** Backend API, Database, Keycloak, Nginx
- **Per-Site:** React frontend container (~128 MB RAM each)

### Capacity Estimates on 2 vCPU / 8 GB RAM

| Total Websites | Frontend RAM | Backend RAM | Total RAM Used | CPU Load | Status |
|----------------|--------------|-------------|----------------|----------|--------|
| 1 (current) | 128 MB | 1.5 GB | ~2.5 GB | Low | ✅ Current |
| 3 sites | 384 MB | 2 GB | ~3.4 GB | Low-Med | ✅ Safe |
| 5 sites | 640 MB | 2.5 GB | ~4.1 GB | Medium | ✅ Comfortable |
| 8 sites | 1 GB | 3.5 GB | ~5.5 GB | Med-High | ⚠️ Monitor Closely |
| 10+ sites | 1.3+ GB | 4+ GB | ~6.3+ GB | High | ❌ Upgrade Required |

### Recommended Multi-Tenant Limits

**Safe Operating Zone:** 4-6 total properties

**Rationale:**
- Low to moderate traffic patterns (typical accommodation booking sites)
- Simple CRUD operations for bookings
- Minimal real-time processing requirements
- Adequate RAM buffer for traffic spikes

### When to Upgrade

Consider upgrading to **4 vCPU / 16 GB RAM** when:
- Hosting 7+ properties
- Consistent RAM usage >70% (>5.6 GB)
- CPU load averages >1.5 consistently
- Database query response times degrading
- Frequent memory pressure or swap usage

---

## Architecture Requirements for Multi-Tenant

### Backend Modifications Required

1. **Database Schema:**
   ```sql
   ALTER TABLE booking_requests ADD COLUMN property_id INTEGER;
   CREATE INDEX idx_property_id ON booking_requests(property_id);
   ```

2. **Virtual Hosting (Nginx):**
   - Configure server blocks for multiple domains
   - Route traffic to appropriate frontend containers

3. **Environment Configuration:**
   - Separate React builds per property
   - Property-specific branding and configuration
   - Domain-specific environment variables

4. **Keycloak Multi-Tenancy:**
   - Option A: Single realm with multiple clients
   - Option B: Separate realms per property

---

## System Requirements

### Operating System
- **Recommended:** Ubuntu 24.04 LTS
- **Required Software:** Docker 24.x+, Docker Compose 2.x+

### Network Configuration
- **Required Ports:** 80 (HTTP), 443 (HTTPS)
- **Firewall:** UFW or equivalent configured
- **SSL/TLS:** Let's Encrypt or commercial certificates

### Additional Configuration
- **Swap Space:** 2 GB recommended for memory spike protection
- **Backup Strategy:** External backup solution required
- **Monitoring:** htop, docker stats, or monitoring service

---

## Optimization Recommendations

### Docker Resource Limits

Set memory limits per container to prevent resource exhaustion:

```yaml
services:
  keycloak:
    deploy:
      resources:
        limits:
          memory: 768M
        reservations:
          memory: 512M
```

### PostgreSQL Tuning

For 8 GB system, configure `postgresql.conf`:
```ini
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
work_mem = 16MB
```

### Monitoring Strategy

1. **System Monitoring:**
   - CPU load average (target: <1.5 on 2 vCPU)
   - Memory usage (alert at 70% = 5.6 GB)
   - Disk I/O and space usage

2. **Application Monitoring:**
   - Docker container stats
   - Database connection pool
   - API response times
   - Nginx access patterns

3. **Tools:**
   - Basic: `htop`, `docker stats`, `df -h`
   - Advanced: Prometheus + Grafana, or managed monitoring service

---

## Performance Expectations

### Single Property (Current)
- **Concurrent Users:** Hundreds
- **API Response Time:** <100ms average
- **Page Load Time:** <2 seconds
- **Uptime Target:** 99.9%

### Multi-Tenant (5 Properties)
- **Concurrent Users:** 50-100 per site
- **API Response Time:** <150ms average  
- **Page Load Time:** <2.5 seconds
- **Uptime Target:** 99.5%

### Traffic Assumptions
- Peak booking periods: Weekends, holidays
- Low constant traffic between peaks
- Mostly read operations (browsing > booking)
- Admin access: Low frequency

---

## Upgrade Paths

### Horizontal Scaling
Not recommended for this architecture. Better to upgrade vertically.

### Vertical Scaling Options

| Tier | vCPU | RAM | Properties | Price Point |
|------|------|-----|------------|-------------|
| **Current** | 2 | 8 GB | 1-6 | $ |
| **Next Tier** | 4 | 16 GB | 7-15 | $$ |
| **Enterprise** | 8 | 32 GB | 15-30 | $$$ |

### Migration Strategy
1. Provision new VPS at higher tier
2. Set up Docker environment
3. Migrate PostgreSQL databases
4. Update DNS records
5. Minimal downtime deployment

---

## Cost Considerations

### Typical VPS Pricing (Estimate)
- **2 vCPU / 8 GB RAM:** $40-60/month
- **4 vCPU / 16 GB RAM:** $80-120/month
- **8 vCPU / 32 GB RAM:** $160-240/month

### Additional Costs
- **Domain names:** $10-15/year per domain
- **SSL certificates:** Free (Let's Encrypt) or $50-200/year
- **Backups:** $5-20/month depending on provider
- **Monitoring:** Free (basic) to $20+/month (advanced)

### Cost per Property (2 vCPU / 8 GB)
- 1 property: $50/month
- 3 properties: ~$17/month per property
- 5 properties: ~$10/month per property

---

## Conclusion

The **2 vCPU / 8 GB RAM VPS specification** is well-suited for the 17 @ Peppertree application and can efficiently scale to host 4-6 accommodation properties before requiring an upgrade. The generous RAM allocation provides excellent headroom for growth and traffic spikes, while the dual-core CPU is adequate for the low-to-moderate traffic patterns typical of hospitality booking websites.

---

## Related Documentation

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment procedures
- [DOCKER_SETUP.md](./DOCKER_SETUP.md) - Docker configuration
- [README.md](../README.md) - Project overview
