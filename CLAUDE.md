# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a full-stack hospitality booking application for "17 @ Peppertree" accommodation in Brackenfell. The application features a React frontend with warm hospitality design and a Flask backend with PostgreSQL database, all containerized with Docker.

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

### Production Deployment
```bash
# Production environment
docker compose -f docker-compose.production.yml up -d --build

# Staging environment  
docker compose -f docker-compose.staging.yml up -d --build
```

## Architecture

### Frontend Structure
- **Single Page Application**: React app with component-based architecture
- **Component Organization**: Each component has its own directory with CSS and JS files
- **Components**: Header, Hero, Accommodation, Amenities, Location, Contact, Footer
- **Styling**: Custom CSS with brown/cream/gold hospitality theme
- **API Integration**: Connects to Flask backend at `/api` endpoints

### Backend Structure  
- **Flask API**: RESTful endpoints for booking management
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Email Service**: Flask-Mail for booking notifications
- **Modules**:
  - `app.py`: Main Flask application and routes
  - `database.py`: Database models and operations
  - `email_notifications.py`: Email service functionality

### Database Schema
- **booking_requests**: Stores guest booking information
- **property_settings**: Configuration and settings storage

### Docker Configuration
- **Multi-container setup**: Frontend, Backend, Database, Nginx
- **Networks**: All services on `peppertree_network`
- **Volumes**: Persistent PostgreSQL data storage
- **Health checks**: Configured for all services

## Key API Endpoints
- `GET /api/health` - Health check
- `POST /api/booking` - Create booking request
- `GET /api/bookings` - List all bookings
- `GET /api/booking/{id}` - Get specific booking
- `PUT /api/booking/{id}/status` - Update booking status

## Environment Configuration
Required environment variables in `.env`:
- `MAIL_USERNAME`: Email service username
- `MAIL_PASSWORD`: Email service password  
- `MAIL_DEFAULT_SENDER`: Default sender email
- `OWNER_EMAIL`: Property owner email

## Access Points
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Database: localhost:5432
- Nginx (Production): http://localhost:80

## Code Conventions
- **React**: Functional components with hooks
- **Python**: Flask patterns with SQLAlchemy ORM
- **CSS**: Component-scoped stylesheets
- **Docker**: Multi-stage builds with health checks
- **Database**: PostgreSQL with proper indexing and constraints