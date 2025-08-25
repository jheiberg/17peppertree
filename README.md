# 17 @ Peppertree - Hospitality Booking Application

A full-stack web application for the 17 @ Peppertree guest accommodation in Vredekloof, Brackenfell. Features a React frontend with warm hospitality design and a Flask backend with PostgreSQL database, all containerized with Docker.

## 🏠 Features

### Frontend (React)
- **Warm hospitality design** with brown, cream, and gold color scheme
- **Responsive layout** optimized for desktop and mobile
- **Interactive components**: Navigation, booking form, image galleries
- **Google Maps integration** for location display
- **Real property images** from Travelground
- **Form validation** and user feedback

### Backend (Flask + PostgreSQL)
- **RESTful API** for booking management
- **PostgreSQL database** with proper indexing and constraints
- **Email notifications** for guests and property owners
- **Input validation** and error handling
- **CORS support** for frontend integration

### Infrastructure (Docker)
- **Multi-container setup** with Docker Compose
- **Nginx reverse proxy** with rate limiting and security headers
- **Health checks** for all services
- **Volume persistence** for database data
- **Production-ready configuration**

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git (to clone the repository)

### 1. Clone and Setup
```bash
cd /home/jako/Development/17@peppertree
cp .env.example .env
# Edit .env file with your email configuration
```

### 2. Build and Run
```bash
# Start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 3. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Nginx (Production)**: http://localhost:80
- **Database**: localhost:5432

## 📧 Email Configuration

Edit the `.env` file with your email settings:

```bash
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=your-email@gmail.com
OWNER_EMAIL=owner@peppertree.com
```

For Gmail, use an App Password (not your regular password).

## 🗄️ Database

The PostgreSQL database is automatically initialized with:
- **booking_requests** table for storing reservations
- **property_settings** table for configuration
- **Indexes** for optimal performance
- **Constraints** for data integrity

## 🔧 API Endpoints

### Booking Management
- `GET /api/health` - Health check
- `POST /api/booking` - Create booking request
- `GET /api/bookings` - List all bookings
- `GET /api/booking/{id}` - Get specific booking
- `PUT /api/booking/{id}/status` - Update booking status

### Example Booking Request
```json
{
  "checkin": "2024-03-15",
  "checkout": "2024-03-17",
  "guests": 2,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "063 630 7345",
  "message": "Special dietary requirements"
}
```

## 🏗️ Development

### Frontend Development
```bash
cd /home/jako/Development/17@peppertree
npm start
```

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Database Management
```bash
# Connect to PostgreSQL
docker exec -it peppertree_db psql -U postgres -d peppertree

# View logs
docker-compose logs backend
docker-compose logs db
```

## 🛡️ Security Features

- **Rate limiting** on API endpoints
- **CORS configuration** for cross-origin requests
- **Input validation** and sanitization
- **SQL injection protection** via SQLAlchemy ORM
- **Security headers** via Nginx
- **Non-root containers** for better security

## 📱 Mobile Responsiveness

The application is fully responsive with:
- **Adaptive navigation** with hamburger menu
- **Flexible grid layouts** that stack on mobile
- **Touch-friendly buttons** and form elements
- **Optimized images** for different screen sizes

## 🎨 Design System

### Color Palette
- **Primary**: `#8B4513` (Saddle Brown)
- **Secondary**: `#D2B48C` (Tan)
- **Accent**: `#CD853F` (Peru)
- **Warm White**: `#FAF7F2`
- **Gold**: `#DAA520`

### Typography
- **Headers**: Playfair Display (serif)
- **Body**: Inter (sans-serif)
- **Warm, welcoming tone** throughout

## 🔄 Deployment Options

### Development
```bash
docker-compose up --build
```

### Production
1. Configure SSL certificates in `nginx.conf`
2. Update environment variables for production
3. Set up proper domain and DNS
4. Use Docker secrets for sensitive data

### Cloud Deployment
The application can be deployed to:
- **AWS** (ECS, RDS, ALB)
- **Google Cloud** (Cloud Run, Cloud SQL)
- **Azure** (Container Instances, PostgreSQL)
- **DigitalOcean** (App Platform, Managed Database)

## 📊 Monitoring

Health checks are configured for:
- **Frontend**: HTTP GET to port 3000
- **Backend**: HTTP GET to `/api/health`
- **Database**: PostgreSQL connection check
- **Nginx**: Built-in health endpoint

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 5000, 5432, 80 are available
2. **Email not sending**: Check MAIL_USERNAME and MAIL_PASSWORD in .env
3. **Database connection failed**: Verify PostgreSQL is running
4. **Build fails**: Clear Docker cache with `docker system prune`

### Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

## 📞 Support

For support with this application:
- **Property Contact**: 063 630 7345
- **Address**: 17 Peperboom Crescent, Vredekloof, Brackenfell, 7560

## 📄 License

This project is proprietary software for 17 @ Peppertree accommodation.

---

Built with ❤️ for 17 @ Peppertree - Creating unforgettable memories in Brackenfell.