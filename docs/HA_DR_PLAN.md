# High Availability (HA) and Disaster Recovery (DR) Plan

**Document Version:** 1.0  
**Last Updated:** 2025-11-21  
**Application:** 17 @ Peppertree Hospitality Booking System

---

## Executive Summary

This document outlines the High Availability and Disaster Recovery strategy for the 17 @ Peppertree application running on a **2 vCPU / 8 GB RAM VPS**. Given the budget-conscious nature of a small hospitality business, this plan balances cost-effectiveness with acceptable recovery objectives.

### Target Metrics

| Metric | Target | Justification |
|--------|--------|---------------|
| **RTO** (Recovery Time Objective) | 4 hours | Acceptable for non-critical booking system |
| **RPO** (Recovery Point Objective) | 24 hours | Daily bookings can be manually recovered if needed |
| **Uptime SLA** | 99.5% | ~3.6 hours downtime/month acceptable |

---

## 1. High Availability Strategy

### 1.1 Current Architecture Limitations

**Single VPS Deployment:**
- Single point of failure (SPOF)
- No automatic failover
- Limited by VPS provider uptime

**Rationale for Single VPS:**
- Cost-effective for small business
- Low traffic volume doesn't justify HA complexity
- Manual intervention acceptable for this use case

### 1.2 Application-Level HA Features

#### Docker Container Restart Policies
All services configured with `restart: unless-stopped`:

```yaml
services:
  backend:
    restart: unless-stopped
  frontend:
    restart: unless-stopped
  db:
    restart: unless-stopped
  keycloak:
    restart: unless-stopped
```

**Benefits:**
- Automatic recovery from container crashes
- Survives VPS reboots
- No manual intervention for common failures

#### Health Checks

All critical services have health checks configured:

```yaml
backend:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
    interval: 30s
    timeout: 10s
    retries: 3

db:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres"]
    interval: 10s
    timeout: 5s
    retries: 5

nginx:
  healthcheck:
    test: ["CMD", "nginx", "-t"]
    interval: 30s
    timeout: 10s
    retries: 3
```

**Benefits:**
- Early detection of service degradation
- Automatic container restarts on failure
- Dependency management (depends_on with conditions)

### 1.3 Database High Availability

#### Current Setup
- Single PostgreSQL 15 container
- Persistent volumes for data
- Daily automated backups

#### HA Enhancements (Optional - Higher Budget)

**Option 1: Managed Database Service**
- Migrate to managed PostgreSQL (e.g., DigitalOcean, AWS RDS, Azure Database)
- Cost: +$15-30/month
- Benefits: Automated backups, point-in-time recovery, automatic failover

**Option 2: PostgreSQL Replication**
- Requires second VPS or database server
- Cost: +$40-60/month
- Benefits: Hot standby, automatic failover with Patroni/pgpool

**Recommendation:** Stick with single database + robust backups for now.

### 1.4 Monitoring and Alerting

#### Essential Monitoring

**1. Uptime Monitoring (External)**
- Service: UptimeRobot (free tier) or Pingdom
- Monitor: https://17peppertree.co.za
- Check interval: 5 minutes
- Alert methods: Email, SMS
- Cost: Free to $10/month

**2. Server Resource Monitoring**
```bash
# Install monitoring tools
apt install htop iotop nethogs

# View real-time stats
htop                    # CPU/RAM usage
docker stats           # Container resources
df -h                  # Disk usage
```

**3. Application Logging**
```yaml
# Already configured in docker-compose
volumes:
  - ./logs/nginx:/var/log/nginx
```

**Log Retention:**
- Nginx access logs: 14 days
- Nginx error logs: 30 days
- Application logs: 30 days
- Database logs: 7 days

#### Alerting Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| CPU Usage | >70% | >85% | Investigate load, consider upgrade |
| RAM Usage | >70% (5.6GB) | >85% (6.8GB) | Restart services, add swap |
| Disk Usage | >75% | >90% | Clean logs, expand storage |
| Website Down | 2 min | 5 min | Execute DR plan |
| Database Down | 1 min | 3 min | Execute DB recovery |

### 1.5 Proactive Maintenance

#### Weekly Tasks
- [ ] Review monitoring alerts
- [ ] Check disk space usage
- [ ] Review application logs for errors
- [ ] Verify backup completion

#### Monthly Tasks
- [ ] Update Docker images (security patches)
- [ ] Review and rotate logs
- [ ] Test backup restoration (quarterly minimum)
- [ ] Review SSL certificate expiry dates

#### Quarterly Tasks
- [ ] Full DR drill/test
- [ ] Security audit and updates
- [ ] Performance review and optimization
- [ ] Capacity planning review

---

## 2. Disaster Recovery Plan

### 2.1 Backup Strategy

#### Database Backups

**Automated Daily Backups:**
```bash
#!/bin/bash
# /scripts/backup.sh (already exists)

# PostgreSQL backup
docker exec peppertree_db_prod pg_dump -U postgres peppertree > \
  /backups/peppertree_$(date +%Y%m%d_%H%M%S).sql

# Keycloak database backup
docker exec peppertree_keycloak_db_prod pg_dump -U keycloak keycloak > \
  /backups/keycloak_$(date +%Y%m%d_%H%M%S).sql

# Compress backups
gzip /backups/*.sql

# Keep last 30 days
find /backups -name "*.sql.gz" -mtime +30 -delete
```

**Cron Schedule:**
```bash
# Daily at 2 AM
0 2 * * * /home/jako/Development/17@peppertree/scripts/backup.sh >> /var/log/backup.log 2>&1
```

#### Off-Site Backup Storage

**Option 1: Cloud Storage (Recommended)**
```bash
# Install rclone
curl https://rclone.org/install.sh | sudo bash

# Configure (one-time setup)
rclone config  # Add cloud provider (Google Drive, Dropbox, S3, etc.)

# Automated sync
rclone sync /backups remote:peppertree-backups --log-file=/var/log/rclone.log
```

**Backup Locations:**
1. **Local:** VPS `/backups` directory (immediate access)
2. **Off-site:** Cloud storage (disaster recovery)
3. **Optional:** Local workstation (manual download monthly)

**Backup Verification:**
```bash
# Weekly backup integrity check
gunzip -t /backups/peppertree_latest.sql.gz && echo "Backup OK" || echo "Backup CORRUPTED"
```

#### Configuration Backups

**Critical Files to Backup:**
- `.env` files (encrypted storage)
- `docker-compose.production.yml`
- `nginx.production.conf`
- SSL certificates (`/ssl` directory)
- Keycloak configuration exports

**Backup Script Addition:**
```bash
# Add to backup.sh
tar -czf /backups/config_$(date +%Y%m%d).tar.gz \
  /home/jako/Development/17@peppertree/.env \
  /home/jako/Development/17@peppertree/docker-compose.production.yml \
  /home/jako/Development/17@peppertree/nginx.production.conf \
  /home/jako/Development/17@peppertree/ssl
```

### 2.2 Disaster Scenarios and Recovery Procedures

#### Scenario 1: Single Container Failure

**Symptoms:**
- One service down (backend, frontend, database)
- Other services operational
- Health check failures in logs

**Recovery Steps:**
```bash
# 1. Identify failed container
docker ps -a

# 2. Check logs
docker logs peppertree_backend_prod --tail 100

# 3. Restart container
docker restart peppertree_backend_prod

# 4. Verify recovery
docker ps
curl https://17peppertree.co.za/api/health

# Recovery Time: 2-5 minutes
```

#### Scenario 2: Database Corruption

**Symptoms:**
- Database connection errors
- Application unable to read/write data
- PostgreSQL container crash loop

**Recovery Steps:**
```bash
# 1. Stop application services
docker stop peppertree_backend_prod peppertree_frontend_prod

# 2. Backup current (corrupted) database
docker exec peppertree_db_prod pg_dump -U postgres peppertree > /backups/corrupted_$(date +%Y%m%d).sql

# 3. Stop database
docker stop peppertree_db_prod

# 4. Remove corrupted volume (DESTRUCTIVE)
docker volume rm postgres_data_prod

# 5. Restore from latest backup
docker start peppertree_db_prod
sleep 10

# Find latest backup
LATEST_BACKUP=$(ls -t /backups/peppertree_*.sql.gz | head -1)
gunzip -c $LATEST_BACKUP | docker exec -i peppertree_db_prod psql -U postgres peppertree

# 6. Restart application
docker start peppertree_backend_prod peppertree_frontend_prod

# Recovery Time: 15-30 minutes
# Data Loss: Up to 24 hours (last backup)
```

#### Scenario 3: Complete VPS Failure

**Symptoms:**
- VPS unresponsive
- SSH connection timeout
- Website completely down

**Recovery Steps:**

**Phase 1: Immediate Response (0-30 minutes)**
```bash
# 1. Contact VPS provider support
# 2. Check provider status page
# 3. Notify stakeholders via communication plan
# 4. Set up temporary holding page if needed (optional)
```

**Phase 2: Provision New VPS (30 minutes - 2 hours)**
```bash
# 1. Provision new VPS (same or better specs)
#    - 2 vCPU / 8 GB RAM / 80 GB SSD
#    - Ubuntu 24.04 LTS

# 2. Initial server setup
ssh root@new-vps-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Create user
adduser peppertree
usermod -aG docker peppertree
su - peppertree
```

**Phase 3: Deploy Application (2-3 hours)**
```bash
# 1. Clone repository or copy files
git clone https://github.com/yourusername/17peppertree.git
cd 17peppertree

# 2. Restore configuration files from backup
# (Download from cloud storage)
rclone copy remote:peppertree-backups/config_latest.tar.gz .
tar -xzf config_latest.tar.gz

# 3. Set up environment
cp .env.example .env
nano .env  # Configure with backed up values

# 4. Restore SSL certificates
cp -r ssl/ /home/peppertree/17peppertree/ssl/

# 5. Deploy containers
docker compose -f docker-compose.production.yml up -d

# 6. Wait for database to initialize
sleep 30
```

**Phase 4: Database Restoration (3-4 hours)**
```bash
# 1. Download latest database backup
rclone copy remote:peppertree-backups/peppertree_latest.sql.gz .
rclone copy remote:peppertree-backups/keycloak_latest.sql.gz .

# 2. Restore main database
gunzip -c peppertree_latest.sql.gz | \
  docker exec -i peppertree_db_prod psql -U postgres peppertree

# 3. Restore Keycloak database
gunzip -c keycloak_latest.sql.gz | \
  docker exec -i peppertree_keycloak_db_prod psql -U keycloak keycloak

# 4. Restart services
docker compose -f docker-compose.production.yml restart
```

**Phase 5: DNS and Verification (4 hours)**
```bash
# 1. Update DNS A record to new VPS IP
#    - TTL should be 5 minutes for faster propagation
#    - DNS propagation: 5 minutes to 48 hours

# 2. Verify all services
curl -k https://new-vps-ip/api/health
docker ps -a
docker logs peppertree_backend_prod

# 3. Test booking flow
# 4. Notify stakeholders of restoration

# Total Recovery Time: 4-8 hours (depends on DNS propagation)
# Data Loss: Up to 24 hours (last backup)
```

#### Scenario 4: Ransomware/Security Breach

**Symptoms:**
- Encrypted files
- Unauthorized access detected
- Suspicious database modifications

**Recovery Steps:**
```bash
# 1. IMMEDIATE: Isolate system
#    - Shut down VPS
#    - Block all incoming traffic
#    - Document evidence

# 2. Assess damage
#    - Review logs
#    - Identify breach vector
#    - Determine data exposure

# 3. Deploy to new clean VPS
#    - Follow "Complete VPS Failure" procedure
#    - Use backup from BEFORE breach date
#    - Change ALL credentials

# 4. Security hardening
#    - Update all software
#    - Implement firewall rules
#    - Enable fail2ban
#    - Review access logs

# 5. Notify affected parties if data exposed

# Recovery Time: 8-24 hours
# Data Loss: Variable (depends on breach timing)
```

### 2.3 Recovery Testing

#### Quarterly DR Drill

**Test 1: Database Restore (Every Quarter)**
```bash
# 1. Create test VPS or local environment
# 2. Restore latest backup
# 3. Verify data integrity
# 4. Document time taken and issues
# 5. Update procedures if needed
```

**Test 2: Full System Restore (Annually)**
```bash
# 1. Provision new test VPS
# 2. Execute complete DR procedure
# 3. Verify functionality end-to-end
# 4. Document RTO/RPO actual vs. target
# 5. Update DR plan with lessons learned
```

---

## 3. Communication Plan

### 3.1 Stakeholder Notification

**During Incident:**

| Stakeholder | Method | Timing | Information |
|-------------|--------|--------|-------------|
| Property Owner | Phone + Email | Immediately | Outage notification, ETA |
| Technical Team | SMS + Slack | Immediately | Incident details, actions |
| Guests (if needed) | Email | Within 1 hour | Service interruption notice |

**Template Email:**
```
Subject: [URGENT] 17 @ Peppertree Website Temporary Outage

Dear [Owner/Guest],

We are currently experiencing technical difficulties with the 17 @ Peppertree 
booking website. Our team is working to resolve the issue.

Status: [Brief description]
Expected Resolution: [ETA or "investigating"]
Alternative Booking: [Phone number or email]

We apologize for any inconvenience and will update you as soon as service is restored.

Best regards,
Technical Support Team
```

### 3.2 Incident Log

**Document for Each Incident:**
- Date and time of detection
- Type of failure
- Root cause analysis
- Recovery actions taken
- Actual RTO/RPO achieved
- Lessons learned
- Preventive measures implemented

**Template:** `/docs/incident-log-template.md`

---

## 4. Preventive Measures

### 4.1 Security Hardening

**Firewall Configuration:**
```bash
# UFW firewall setup
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

**SSH Security:**
```bash
# Disable password authentication
# /etc/ssh/sshd_config
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes

# Use SSH keys only
# Implement fail2ban for brute force protection
apt install fail2ban
```

**Docker Security:**
```bash
# Run containers as non-root user
# Limit container resources
# Keep images updated
docker compose pull
docker compose up -d
```

### 4.2 Automated Updates

**Security Updates (Unattended Upgrades):**
```bash
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

**Docker Image Updates (Monthly):**
```bash
#!/bin/bash
# /scripts/update-images.sh

cd /home/peppertree/17peppertree
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d
docker image prune -f
```

### 4.3 Performance Optimization

**PostgreSQL Tuning:**
```sql
-- Periodic vacuum and analyze
VACUUM ANALYZE booking_requests;

-- Monitor slow queries
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

**Log Rotation:**
```bash
# /etc/logrotate.d/peppertree
/home/peppertree/17peppertree/logs/nginx/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        docker exec peppertree_nginx_prod nginx -s reopen
    endscript
}
```

---

## 5. Cost Analysis

### 5.1 Current DR Costs

| Item | Cost | Frequency |
|------|------|-----------|
| VPS (Primary) | $50 | Monthly |
| Cloud Backup Storage (100GB) | $2-5 | Monthly |
| Uptime Monitoring | Free-$10 | Monthly |
| SSL Certificate | Free (Let's Encrypt) | - |
| **Total** | **$52-65** | **Monthly** |

### 5.2 Enhanced HA Options (Future)

| Enhancement | Cost | Benefit |
|-------------|------|---------|
| Managed Database | +$15-30/mo | Automated backups, failover |
| Load Balancer | +$10-20/mo | Better uptime, traffic distribution |
| Second VPS (Standby) | +$50/mo | Hot failover, <5min RTO |
| Advanced Monitoring (DataDog, etc.) | +$15-50/mo | Better insights, alerting |
| **Full HA Setup** | **+$90-150/mo** | **99.9%+ uptime** |

### 5.3 Cost-Benefit Recommendation

**Current Plan: Acceptable for small business**
- Low cost ($52-65/mo)
- Reasonable RTO (4 hours)
- Manual intervention acceptable
- Focus on robust backups

**When to Upgrade:**
- Hosting 5+ properties (shared revenue)
- Consistent high traffic
- Critical booking periods (holiday seasons)
- Revenue loss from downtime exceeds HA costs

---

## 6. Recovery Runbooks

### 6.1 Quick Reference Guide

**Emergency Contacts:**
```
VPS Provider Support: [Phone/Ticket URL]
DNS Provider: [Login URL]
Backup Storage: [Access URL]
Technical Lead: [Name/Phone]
Property Owner: [Name/Phone]
```

**Critical Access Information:**
```
VPS IP: [Document separately - secure location]
SSH Key Location: [Path]
.env Backup Location: [Encrypted storage path]
Cloud Backup: [rclone remote name]
```

### 6.2 Service Restoration Checklist

**Step-by-Step Recovery:**
- [ ] Assess situation and identify failure type
- [ ] Notify stakeholders
- [ ] Document incident start time
- [ ] Execute appropriate recovery procedure
- [ ] Verify all services operational
- [ ] Test critical functionality (booking flow)
- [ ] Monitor for 24 hours post-recovery
- [ ] Complete incident report
- [ ] Update DR plan if needed

---

## 7. Compliance and Data Protection

### 7.1 Data Backup Compliance

**Booking Data:**
- Contains PII (names, emails, phone numbers)
- Backed up encrypted
- Retained for 7 years (financial records)
- Secure deletion after retention period

**GDPR/POPI Considerations:**
- Right to erasure: Backup retention policy
- Data breach notification: Within 72 hours
- Backup encryption: AES-256

### 7.2 Backup Encryption

```bash
# Encrypt backups before cloud upload
gpg --symmetric --cipher-algo AES256 backup.sql.gz

# Decrypt for restore
gpg --decrypt backup.sql.gz.gpg > backup.sql.gz
```

---

## 8. Continuous Improvement

### 8.1 Post-Incident Review

After each incident or DR test:
1. Conduct post-mortem meeting
2. Document what went well
3. Identify improvements
4. Update procedures
5. Implement preventive measures

### 8.2 Plan Maintenance

**Review Schedule:**
- **Monthly:** Update contact information, verify backups
- **Quarterly:** DR drill, procedure validation
- **Annually:** Full plan review and update

**Version Control:**
- Keep DR plan in git repository
- Document changes in commit messages
- Maintain changelog section

---

## 9. Conclusion

This HA/DR plan provides a cost-effective disaster recovery strategy suitable for a small hospitality business running on a single VPS. The focus is on:

1. **Robust daily backups** with off-site storage
2. **Automated monitoring** and alerting
3. **Clear recovery procedures** for common scenarios
4. **Acceptable RTO/RPO** for business continuity
5. **Proactive maintenance** to prevent incidents

### Key Success Factors

✅ **Automated daily backups** tested quarterly  
✅ **Off-site backup storage** (cloud)  
✅ **Documented recovery procedures** accessible offline  
✅ **Regular DR testing** with timing documentation  
✅ **Clear communication plan** for stakeholders  
✅ **Cost-effective** solution matching business size  

**Next Steps:**
1. Implement automated backup script with cron
2. Configure off-site backup sync (rclone)
3. Set up uptime monitoring (UptimeRobot)
4. Schedule first DR test
5. Print critical procedures for offline access

---

## Related Documentation

- [VPS_SPECIFICATIONS.md](./VPS_SPECIFICATIONS.md) - Infrastructure requirements
- [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) - Deployment procedures
- [DOCKER_SETUP.md](../DOCKER_SETUP.md) - Container configuration

---

**Document Owner:** Technical Team  
**Review Date:** 2026-02-21 (Quarterly)  
**Approval:** [Property Owner Name]
