# Project Overview - 17 @ Peppertree

**Date:** 2025-11-21  
**Repository:** jheiberg/17peppertree  
**Site Name:** 17 @ Peppertree  
**Location:** Brackenfell, South Africa

## Project Description

Full-stack hospitality booking application for "17 @ Peppertree" accommodation. Features a React frontend with warm hospitality design and a Flask backend with PostgreSQL database, all containerized with Docker.

## Technology Stack

### Frontend
- **Framework:** React (Single Page Application)
- **Architecture:** Component-based with hooks
- **Styling:** Custom CSS with brown/cream/gold hospitality theme
- **Build:** npm/webpack

### Backend
- **Framework:** Flask (Python)
- **API:** RESTful endpoints
- **ORM:** SQLAlchemy
- **Email:** Flask-Mail for booking notifications

### Database
- **System:** PostgreSQL
- **Schema:**
  - `booking_requests` - Guest booking information
  - `property_settings` - Configuration and settings

### Infrastructure
- **Containerization:** Docker + Docker Compose V2
- **Web Server:** Nginx
- **Networking:** Docker networks
- **Storage:** Docker volumes (persistent PostgreSQL data)
- **Health Checks:** Configured for all services

## Architecture Overview

### Frontend Structure
- **Single Page Application** with component-based architecture
- **Component Organization:** Each component in its own directory with CSS and JS
- **Key Components:**
  - Header
  - Hero
  - Accommodation
  - Amenities
  - Location
  - Contact
  - Footer
- **API Integration:** Connects to Flask backend at `/api` endpoints

### Backend Structure
- **Flask API:** RESTful endpoints for booking management
- **Database:** PostgreSQL with SQLAlchemy ORM
- **Email Service:** Flask-Mail for booking notifications
- **Key Modules:**
  - `app.py` - Main Flask application and routes
  - `database.py` - Database models and operations
  - `email_notifications.py` - Email service functionality

### Docker Configuration
- **Multi-container setup:** Frontend, Backend, Database, Nginx, Keycloak
- **Networks:** All services on `peppertree_network`
- **Volumes:** Persistent PostgreSQL data storage
- **Health checks:** Configured for all services
- **Compose files:**
  - `docker-compose.yml` - Development
  - `docker-compose.staging.yml` - Staging
  - `docker-compose.production.yml` - Production

## Key API Endpoints

- `GET /api/health` - Health check
- `POST /api/booking` - Create booking request
- `GET /api/bookings` - List all bookings
- `GET /api/booking/{id}` - Get specific booking
- `PUT /api/booking/{id}/status` - Update booking status

## Development Commands

### Frontend (React)
```bash
# Development server
npm start

# Build production bundle
npm run build

# Run tests
npm test
```

### Backend (Flask)
```bash
# Local development (requires Python venv)
cd backend
source venv/bin/activate
python app.py

# Test backend API
cd backend
./test_booking_api.sh
```

### Docker Development
```bash
# Start all services (development)
docker compose up --build

# Start in background
docker compose up -d --build

# View logs
docker compose logs backend
docker compose logs frontend
docker compose logs db

# Connect to database
docker exec -it peppertree_db psql -U postgres -d peppertree
```

### Deployment
```bash
# Staging environment
docker compose -f docker-compose.staging.yml up -d --build

# Production environment
docker compose -f docker-compose.production.yml up -d --build

# Or use deploy script (recommended)
sudo bash scripts/deploy.sh staging
sudo bash scripts/deploy.sh production
```

## Environment Configuration

Required environment variables in `.env`:
- `MAIL_USERNAME` - Email service username
- `MAIL_PASSWORD` - Email service password
- `MAIL_DEFAULT_SENDER` - Default sender email
- `OWNER_EMAIL` - Property owner email
- Additional Keycloak configuration for authentication

## Access Points

### Development
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Database:** localhost:5432
- **Keycloak:** http://localhost:8080

### Staging
- **Frontend:** staging.17peppertree.co.za:8081
- **Backend API:** localhost:5000/api (internal)
- **Database:** localhost:5433
- **Keycloak:** localhost:8081

### Production
- **Frontend:** https://17peppertree.co.za
- **Backend API:** https://17peppertree.co.za/api
- **Nginx:** Port 80 (HTTP), Port 443 (HTTPS)

## Code Conventions

### React
- Functional components with hooks
- Component-scoped stylesheets
- Props and state management
- API integration via fetch/axios

### Python
- Flask patterns with SQLAlchemy ORM
- RESTful API design
- Database models with relationships
- Error handling and validation

### CSS
- Component-scoped stylesheets
- Hospitality theme colors (brown/cream/gold)
- Responsive design
- Mobile-first approach

### Docker
- Multi-stage builds with health checks
- Docker Compose V2 syntax
- Proper networking and volumes
- Security best practices

### Database
- PostgreSQL with proper indexing
- Foreign key constraints
- Migration scripts
- Backup procedures

## Project Structure

```
17peppertree/
├── backend/               # Flask API
│   ├── app.py            # Main application
│   ├── database.py       # Database models
│   └── email_notifications.py
├── src/                  # React frontend
│   ├── components/       # React components
│   ├── App.js
│   └── index.js
├── public/               # Static assets
├── scripts/              # Deployment scripts
│   ├── deploy.sh        # Unified deployment
│   ├── vps-secure-setup.sh
│   └── setup-staging-auth.sh
├── docs/                 # Documentation (18 files)
├── memory/               # Memory bank (10 files)
├── docker-compose.yml    # Development
├── docker-compose.staging.yml
├── docker-compose.production.yml
├── Dockerfile            # Backend image
├── Dockerfile.frontend   # Frontend image
├── nginx.conf            # Nginx config
├── package.json          # Frontend deps
├── requirements.txt      # Backend deps
└── README.md             # Project overview
```

## Repository Information

- **GitHub:** jheiberg/17peppertree
- **Main Branch:** main (production-ready)
- **Development Branch:** develop (active development)
- **Site Name:** 17 @ Peppertree (note: @ symbol)
- **Repository Name:** 17peppertree (no @ symbol)

## Related Documentation

- `docs/DEPLOYMENT_GUIDE.md` - Deployment procedures
- `docs/DEVELOPMENT_GUIDE.md` - Development workflows
- `docs/DOCKER_SETUP.md` - Docker configuration
- `docs/ADMIN_SETUP.md` - Admin portal setup
- `docs/AUTHENTICATION.md` - Keycloak authentication
- `memory/deploy-script.md` - Deploy script details
- `memory/vps-setup-script.md` - VPS setup details

## Quick Start

### First Time Setup
1. Clone repository
2. Copy `.env.example` to `.env` and configure
3. Run `docker compose up --build`
4. Access http://localhost:3000

### Development Workflow
1. Make changes in `src/` or `backend/`
2. Test locally with `docker compose up`
3. Commit to `develop` branch
4. Push to GitHub (triggers staging deployment)
5. Test on staging
6. Merge to `main` (triggers production deployment)

### Deployment Workflow
1. Test on staging: `sudo bash scripts/deploy.sh staging`
2. Verify staging works
3. Deploy to production: `sudo bash scripts/deploy.sh production`
4. Verify production works

## Key Features

- ✅ Guest booking system
- ✅ Admin portal for management
- ✅ Email notifications
- ✅ Keycloak authentication
- ✅ Responsive design
- ✅ Docker containerization
- ✅ CI/CD with GitHub Actions
- ✅ Staging and production environments
- ✅ Automated backups
- ✅ Health checks and monitoring

## Support

For detailed information, see the documentation in `docs/` directory or memory bank in `memory/`.
