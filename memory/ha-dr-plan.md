# HA/DR Plan Memory

**Date:** 2025-11-21

## Target Metrics
- **RTO** (Recovery Time Objective): 4 hours
- **RPO** (Recovery Point Objective): 24 hours
- **Uptime SLA**: 99.5% (~3.6 hours downtime/month)

## High Availability Strategy
- Single VPS deployment (cost-effective)
- Docker restart policies: `restart: unless-stopped`
- Health checks on all services
- Automated container recovery
- External uptime monitoring (UptimeRobot/Pingdom)

## Backup Strategy
- **Daily automated backups** at 2 AM
- Main database (peppertree) + Keycloak database
- Local storage: 30 days retention
- **Off-site backup**: Cloud storage via rclone
- Configuration backups: .env, docker-compose, nginx, SSL certs

## Disaster Recovery Scenarios
1. **Single container failure**: 2-5 min recovery (docker restart)
2. **Database corruption**: 15-30 min (restore from backup)
3. **Complete VPS failure**: 4-8 hours (new VPS + DNS)
4. **Security breach**: 8-24 hours (clean deploy)

## Critical Scripts
- `/scripts/backup.sh` - Automated daily backups
- Backup restoration: `gunzip -c backup.sql.gz | docker exec -i db psql`
- Off-site sync: `rclone sync /backups remote:peppertree-backups`

## Monitoring Thresholds
- CPU: Warning >70%, Critical >85%
- RAM: Warning >70% (5.6GB), Critical >85% (6.8GB)
- Disk: Warning >75%, Critical >90%
- Website down: 2 min warning, 5 min critical

## Monthly Costs
- Current DR: $52-65/month (VPS + cloud backup + monitoring)
- Full HA upgrade: +$90-150/month (managed DB, standby VPS, load balancer)

## Testing Schedule
- Weekly: Backup integrity checks
- Quarterly: Database restore drill
- Annually: Full system restore test

## Full Documentation
See: `/docs/HA_DR_PLAN.md`
