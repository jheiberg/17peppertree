# 🚀 Development & Production Setup Guide - 17 @ Peppertree

## Overview

This guide explains how to run the 17 @ Peppertree booking application in both development and production environments. The application consists of a React frontend and Flask backend with PostgreSQL database.

## 📋 Prerequisites

### Development Environment
- **Node.js** (v16+)
- **Python** (3.9+)
- **PostgreSQL** (12+) or Docker
- **Git**

### Production Environment
- **Docker** and **Docker Compose**
- **Linux server** (Ubuntu 24.04 LTS recommended)
- **Domain name** with SSL certificate
- **2GB+ RAM** recommended

---

## 🛠️ Development Setup

### Step 1: Clone Repository
```bash
git clone <your-repository-url>
cd 17@peppertree
```

### Step 2: Environment Configuration
```bash
# Copy environment template
cp .env.example .env
cp backend/.env.example backend/.env

# Edit with your development values
nano .env
nano backend/.env
```

**Development Environment Variables:**
```bash
# Database (use local PostgreSQL or Docker)
DATABASE_URL=postgresql://postgres:password@localhost:5432/peppertree

# Security (use simple values for dev)
SECRET_KEY=dev-secret-key-change-in-production

# Email (use mailtrap.io or similar for testing)
MAIL_SERVER=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-mailtrap-username
MAIL_PASSWORD=your-mailtrap-password
MAIL_DEFAULT_SENDER=noreply@peppertree-dev.local
OWNER_EMAIL=owner@peppertree-dev.local

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=1

# React API URL
REACT_APP_API_URL=http://localhost:5000/api
```

### Step 3: Database Setup

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE peppertree;
CREATE USER peppertree_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE peppertree TO peppertree_user;
\q
```

#### Option B: Docker PostgreSQL
```bash
# Start PostgreSQL container
docker run --name peppertree-db \
  -e POSTGRES_DB=peppertree \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### Step 4: Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Initialize database
python app.py  # This will create tables automatically
```

### Step 5: Frontend Setup
```bash
cd ..  # Back to root directory

# Install dependencies
npm install

# Start development server
npm start
```

### Step 6: Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python app.py
```
Backend will run on: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
npm start
```
Frontend will run on: http://localhost:3000

### Development URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **API Health Check**: http://localhost:5000/api/health

---

## 🏗️ Production Deployment

### Method 1: Docker Compose (Recommended)

#### Step 1: Server Preparation
```bash
# Run automated setup script
curl -O https://raw.githubusercontent.com/jheiberg/17peppertree/main/scripts/vps-secure-setup.sh
chmod +x vps-secure-setup.sh
sudo bash vps-secure-setup.sh
```

#### Step 2: Clone Repository
```bash
cd /opt/peppertree-production
git clone <your-repository-url> .
```

#### Step 3: Production Environment
```bash
# Copy and configure environment
cp .env.example .env
nano .env
```

**Production Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://postgres:STRONG_PASSWORD@db:5432/peppertree
POSTGRES_PASSWORD=STRONG_POSTGRES_PASSWORD

# Security (generate strong keys!)
SECRET_KEY=your-super-secure-64-character-secret-key-for-production
REDIS_PASSWORD=strong-redis-password

# Email (use real SMTP service)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-production-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
MAIL_DEFAULT_SENDER=noreply@peppertree.co.za
OWNER_EMAIL=bookings@peppertree.co.za

# Docker Hub
DOCKER_HUB_USERNAME=your-dockerhub-username

# Domain
DOMAIN_NAME=peppertree.co.za
DOMAIN_WWW=www.peppertree.co.za

# Production API URL
REACT_APP_API_URL=https://peppertree.co.za/api
```

#### Step 4: SSL Certificate
```bash
# Generate Let's Encrypt certificate
sudo certbot certonly --standalone -d peppertree.co.za -d www.peppertree.co.za

# Copy certificates
sudo cp /etc/letsencrypt/live/peppertree.co.za/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/peppertree.co.za/privkey.pem ./ssl/
sudo chown -R deploy:deploy ./ssl/
```

#### Step 5: Deploy Application
```bash
# Build and start services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### Method 2: Manual Production Setup

#### Step 1: Build Frontend
```bash
# Build production React app
npm run build

# Serve with nginx (configure separately)
```

#### Step 2: Deploy Backend
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start with Gunicorn
gunicorn --config gunicorn.conf.py wsgi:application
```

#### Step 3: Process Manager (PM2 or systemd)
```bash
# Using PM2
npm install -g pm2
pm2 start gunicorn.conf.py --name peppertree-backend

# Or create systemd service
sudo nano /etc/systemd/system/peppertree.service
```

---

## 🔧 Development vs Production Comparison

| Feature | Development | Production |
|---------|-------------|------------|
| **Server** | Flask dev server | Gunicorn WSGI |
| **Database** | Local/Docker PostgreSQL | PostgreSQL container |
| **Frontend** | React dev server | Nginx static files |
| **SSL** | None (HTTP) | Let's Encrypt (HTTPS) |
| **Environment** | FLASK_DEBUG=1 | FLASK_ENV=production |
| **Hot Reload** | ✅ Enabled | ❌ Disabled |
| **Error Details** | ✅ Full stack traces | ❌ Generic messages |
| **Email** | Test service (Mailtrap) | Real SMTP |
| **Monitoring** | Manual | Docker health checks |
| **Backups** | None | Automated daily |
| **Security** | Relaxed | Hardened |

---

## 🚨 Troubleshooting

### Development Issues

#### Backend Not Starting
```bash
# Check Python environment
python --version
pip list | grep Flask

# Check database connection
psql -h localhost -U postgres -d peppertree

# Check logs
python app.py  # Look for error messages
```

#### Frontend Not Loading
```bash
# Check Node version
node --version
npm --version

# Clear cache
npm run build
rm -rf node_modules package-lock.json
npm install

# Check environment variables
echo $REACT_APP_API_URL
```

#### CORS Issues
```bash
# Verify backend CORS configuration
# Check that FLASK_ENV=development in backend/.env
# Ensure REACT_APP_API_URL matches backend URL
```

### Production Issues

#### Health Check Failures
```bash
# Check container status
docker-compose -f docker-compose.production.yml ps

# Check individual service health
curl http://localhost:5000/api/health

# View service logs
docker-compose -f docker-compose.production.yml logs backend
```

#### Database Connection Issues
```bash
# Check database container
docker-compose -f docker-compose.production.yml exec db pg_isready

# Connect to database
docker-compose -f docker-compose.production.yml exec db psql -U postgres peppertree

# Check connection from backend
docker-compose -f docker-compose.production.yml exec backend python -c "
from database import DatabaseManager
print('Database connection:', DatabaseManager.test_connection())
"
```

#### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Test certificate renewal
sudo certbot renew --dry-run

# Check nginx configuration
docker-compose -f docker-compose.production.yml exec nginx nginx -t
```

---

## 🔄 Common Development Workflows

### Making Code Changes

#### Frontend Changes
```bash
# Changes are automatically reloaded in development
# For production, rebuild:
npm run build
docker-compose -f docker-compose.production.yml restart frontend
```

#### Backend Changes
```bash
# Development: Flask auto-reloads
# Production: Restart container
docker-compose -f docker-compose.production.yml restart backend
```

### Database Migrations
```bash
# Development
cd backend
python app.py  # Creates tables automatically

# Production
docker-compose -f docker-compose.production.yml exec backend python app.py
```

### Testing API Endpoints
```bash
# Health check
curl http://localhost:5000/api/health

# Create booking (development)
curl -X POST http://localhost:5000/api/booking \
  -H "Content-Type: application/json" \
  -d '{
    "checkin": "2024-03-15",
    "checkout": "2024-03-17", 
    "guests": 2,
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+27123456789"
  }'

# Check availability
curl http://localhost:5000/api/availability?month=2024-03
```

---

## 📝 Environment Variables Reference

### Backend Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/database

# Security  
SECRET_KEY=your-secret-key

# Email
MAIL_SERVER=smtp.server.com
MAIL_PORT=587
MAIL_USERNAME=username
MAIL_PASSWORD=password  
MAIL_DEFAULT_SENDER=sender@domain.com
OWNER_EMAIL=owner@domain.com

# Flask
FLASK_ENV=development|production
FLASK_DEBUG=0|1
```

### Frontend Variables
```bash
# API endpoint
REACT_APP_API_URL=http://localhost:5000/api  # Dev
REACT_APP_API_URL=https://domain.com/api     # Prod

# Optional
REACT_APP_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
```

### Docker Variables
```bash
# Database
POSTGRES_PASSWORD=secure-password

# Redis
REDIS_PASSWORD=redis-password

# Docker Hub
DOCKER_HUB_USERNAME=username
```

---

## 🎯 Next Steps

### Development
1. Set up your local environment following Step 1-6
2. Make your code changes
3. Test thoroughly with the API endpoints
4. Commit and push to your repository

### Production
1. Follow the deployment guide for CI/CD setup
2. Configure your server and domain
3. Set up monitoring and backups
4. Test the production deployment

### Maintenance
- Monitor logs regularly
- Update dependencies monthly  
- Backup database weekly
- Renew SSL certificates (automatic with Let's Encrypt)

---

## 📞 Support

- **Documentation**: Check this guide and DEPLOYMENT_GUIDE.md
- **Logs**: Always check application logs for errors
- **Health Checks**: Use `/api/health` endpoint to verify backend
- **GitHub Issues**: Create issues for bugs or feature requests