# VPS Specifications Memory

**Date:** 2025-11-21

## Selected VPS Configuration
- **CPU:** 2 vCPUs
- **RAM:** 8 GB
- **Storage:** 60-80 GB SSD
- **Bandwidth:** 3-5 TB/month

## Multi-Tenant Capacity
- **Current:** 1 property (17 @ Peppertree)
- **Safe capacity:** 4-6 total properties
- **Upgrade threshold:** 7+ properties → 4 vCPU / 16 GB RAM

## Resource Usage
- Container baseline: ~1.5-2 GB RAM
- OS overhead: ~1 GB
- Available buffer: ~5-6 GB
- Per additional frontend: ~128 MB RAM

## Key Architectural Notes
- Shared backend infrastructure (Flask, PostgreSQL, Keycloak, Nginx)
- Per-site React frontend containers
- Multi-tenant requires: property_id in database, virtual hosting in Nginx
- Low traffic patterns = CPU adequate, RAM is critical resource

## Monitoring Thresholds
- RAM alert: >70% (5.6 GB)
- CPU alert: load average >1.5
- Upgrade trigger: Sustained high usage or 7+ properties

## Full Documentation
See: `/docs/VPS_SPECIFICATIONS.md`
