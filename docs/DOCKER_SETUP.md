# Docker Setup Guide - 17 @ Peppertree

## Available Dockerfiles

### 1. `Dockerfile` (Development Frontend)
- **Purpose**: React development server
- **Port**: 3000
- **Features**: Hot reload, development tools
- **Usage**: `docker build -t peppertree-frontend-dev .`

### 2. `Dockerfile.frontend` (Production Frontend)
- **Purpose**: Production-optimized React build with nginx
- **Port**: 80
- **Features**: Optimized build, nginx serving, gzip compression
- **Usage**: `docker build -t peppertree-frontend-prod -f Dockerfile.frontend .`

### 3. `backend/Dockerfile` (Backend API)
- **Purpose**: Flask/Python backend API
- **Port**: 5000
- **Features**: PostgreSQL integration, email services
- **Usage**: `docker build -t peppertree-backend ./backend`

## Quick Start Commands

### Development Mode (Individual Services)

#### Frontend Development Server:
```bash
# Build and run React dev server
docker build -t peppertree-frontend .
docker run -p 3000:3000 -v $(pwd):/app -v /app/node_modules peppertree-frontend
```

#### Backend API:
```bash
# Build and run backend (requires database)
cd backend
docker build -t peppertree-backend .
docker run -p 5000:5000 -e DATABASE_URL=postgresql://user:pass@host:5432/db peppertree-backend
```

### Full Stack with Docker Compose

#### Development Environment:
```bash
# Start all services (frontend, backend, database)
docker-compose up

# Start specific services
docker-compose up frontend backend db

# Run in background
docker-compose up -d
```

#### Production Environment:
```bash
# Start with nginx proxy
docker-compose --profile production up

# Or build production frontend
docker build -t peppertree-prod -f Dockerfile.frontend .
docker run -p 80:80 peppertree-prod
```

## Service Endpoints

When running with docker-compose:

- **Frontend**: http://localhost:3000 (development) or http://localhost:80 (production)
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432
- **Nginx Proxy**: http://localhost:80 (when using production profile)

## Environment Variables

Create a `.env` file in the root directory:

```env
# Email Configuration
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=your-email@gmail.com
OWNER_EMAIL=owner@example.com

# Database (when not using docker-compose)
DATABASE_URL=postgresql://postgres:password@localhost:5432/peppertree

# Security
SECRET_KEY=your-super-secure-secret-key-change-in-production
```

## Troubleshooting

### Build Issues
```bash
# Clear Docker cache and rebuild
docker system prune -a
docker-compose build --no-cache

# Check logs
docker-compose logs frontend
docker-compose logs backend
```

### Port Conflicts
```bash
# Check what's using ports
lsof -i :3000
lsof -i :5000

# Change ports in docker-compose.yml if needed
```

### Database Connection Issues
```bash
# Check database status
docker-compose exec db pg_isready -U postgres

# Reset database
docker-compose down -v
docker-compose up db
```

## File Structure

```
17@peppertree/
├── Dockerfile                 # Frontend development
├── Dockerfile.frontend        # Frontend production
├── nginx-frontend.conf        # Frontend nginx config
├── docker-compose.yml         # Full stack orchestration
├── .dockerignore             # Build optimization
├── backend/
│   ├── Dockerfile            # Backend API
│   ├── requirements.txt      # Python dependencies
│   └── .dockerignore         # Backend-specific ignores
└── src/                      # React source code
```

## Production Deployment

For production deployment:

1. **Use production Dockerfile**: `Dockerfile.frontend`
2. **Set proper environment variables**
3. **Use HTTPS**: Configure SSL in nginx
4. **Database**: Use managed PostgreSQL service
5. **Email**: Configure proper SMTP settings
6. **Monitoring**: Add health checks and logging

```bash
# Production build example
docker build -t peppertree-prod -f Dockerfile.frontend .
docker run -d -p 80:80 --name peppertree peppertree-prod
```