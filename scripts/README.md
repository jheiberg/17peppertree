# Scripts Directory

This directory contains all automation scripts for the 17 @ Peppertree application, organized by purpose.

## Directory Structure

```
scripts/
├── setup/           # One-time setup and initialization scripts
│   ├── setup-keycloak.sh              # Initial Keycloak configuration
│   ├── setup-backend-client.sh        # Backend API client setup
│   ├── setup-server.sh                # VPS server configuration
│   ├── setup-staging-auth.sh          # Staging authentication setup
│   └── vps-secure-setup.sh            # VPS security hardening
│
├── config/          # Runtime configuration scripts
│   ├── configure-production-pkce.sh   # Production PKCE S256 setup
│   ├── configure-staging-pkce.sh      # Staging PKCE S256 setup
│   ├── update-keycloak-redirect-dev.sh    # Dev redirect URIs
│   └── update-keycloak-redirect-staging.sh # Staging redirect URIs
│
├── test/            # Testing and validation scripts
│   ├── test-ical-sync.sh              # iCal sync functionality tests
│   ├── test-pkce-flow.sh              # OAuth2 PKCE flow testing
│   └── test_all.sh                    # Complete test suite
│
└── deployment/      # Deployment and maintenance scripts
    ├── deploy.sh                      # Application deployment
    └── backup.sh                      # Database and file backups
```

## Quick Reference

### First-Time Setup
```bash
./scripts/setup/vps-secure-setup.sh      # Secure the server
./scripts/setup/setup-server.sh          # Configure server
./scripts/setup/setup-keycloak.sh        # Set up authentication
./scripts/config/configure-production-pkce.sh  # Enable PKCE for HTTPS
```

### Development
```bash
./scripts/test/test_all.sh               # Run all tests
./scripts/test/test-ical-sync.sh         # Test calendar sync
./scripts/config/update-keycloak-redirect-dev.sh  # Update dev config
```

### Deployment
```bash
./scripts/deployment/backup.sh           # Create backup
./scripts/deployment/deploy.sh staging   # Deploy to staging
./scripts/deployment/deploy.sh production # Deploy to production
```

## Documentation

For detailed documentation on each script, including:
- What each script does
- When to run it
- Prerequisites and dependencies
- Usage examples and parameters
- Expected output and next steps
- Troubleshooting tips

**See: [/docs/SCRIPTS.md](../docs/SCRIPTS.md)**

## Making Scripts Executable

If you encounter permission errors, make scripts executable:

```bash
chmod +x scripts/**/*.sh
```

Or for a specific script:

```bash
chmod +x scripts/setup/setup-keycloak.sh
```

## Best Practices

1. **Read the documentation first** - Check [SCRIPTS.md](../docs/SCRIPTS.md) before running scripts
2. **Review script content** - Understand what a script does before executing
3. **Check prerequisites** - Ensure all dependencies are met
4. **Backup before changes** - Run backup script before major operations
5. **Test in staging first** - Validate changes in staging before production
6. **Monitor execution** - Watch script output for errors or warnings

## Getting Help

- Full script documentation: [/docs/SCRIPTS.md](../docs/SCRIPTS.md)
- Admin setup guide: [/docs/ADMIN_SETUP.md](../docs/ADMIN_SETUP.md)
- Deployment guide: [/docs/DEPLOYMENT_GUIDE.md](../docs/DEPLOYMENT_GUIDE.md)
- Development guide: [/docs/DEVELOPMENT_GUIDE.md](../docs/DEVELOPMENT_GUIDE.md)

## Contributing

When adding new scripts:
1. Place in appropriate category directory
2. Make executable (`chmod +x`)
3. Add header comment with purpose and usage
4. Document in [/docs/SCRIPTS.md](../docs/SCRIPTS.md)
5. Update this README if adding new categories
