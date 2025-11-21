# Configuration Directory

**Created:** 2025-11-21  
**Last Updated:** 2025-11-21

---

## Configuration File Organization

All nginx configuration files are stored in the **`./config`** directory.

### Location
```
/config/nginx.conf              # Development environment
/config/nginx.production.conf   # Production environment  
/config/nginx.staging.conf      # Staging environment
/config/nginx-frontend.conf     # Frontend-only configuration
```

### Purpose
- Centralized configuration management
- Clear separation from application code
- Easy to locate and maintain
- Consistent organization

### Files Previously in Root
Moved on 2025-11-21:
1. `nginx.conf` → `config/nginx.conf`
2. `nginx.production.conf` → `config/nginx.production.conf`
3. `nginx.staging.conf` → `config/nginx.staging.conf`
4. `nginx-frontend.conf` → `config/nginx-frontend.conf`

### References Updated
All references updated in:
- `docker-compose.production.yml`
- `docker-compose.staging.yml`
- `scripts/vps-secure-setup.sh`
- `docs/HA_DR_PLAN.md`
- `docs/DOCKER_SETUP.md`
- `README.md`
- `memory/project-overview.md`

### Docker Compose Volume Mounts
```yaml
# Production
volumes:
  - ./config/nginx.production.conf:/etc/nginx/nginx.conf

# Staging
volumes:
  - ./config/nginx.staging.conf:/etc/nginx/nginx.conf
```

### Backup Strategy
Include in backups:
```bash
tar -czf config_backup.tar.gz \
  config/ \
  .env \
  docker-compose*.yml \
  ssl/
```

---

## Future Configuration Files

Other configuration files that could be moved to `./config`:
- Environment-specific settings
- Application configuration files
- Service configuration files
- Certificate configurations

Keep the config directory for infrastructure/service configurations only,
not application-level configs which belong in their respective directories
(e.g., `/backend/config` for backend app config).
