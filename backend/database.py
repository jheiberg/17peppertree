from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

db = SQLAlchemy()


class DatabaseManager:
    """Handles database configuration and initialization for the Peppertree booking system"""
    
    @staticmethod
    def configure_database(app):
        """Configure database settings for the Flask app"""
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:password@db:5432/peppertree')
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
    
    @staticmethod
    def initialize_database(app):
        """Initialize the database with the app"""
        db.init_app(app)
        return db
    
    @staticmethod
    def create_tables():
        """Create all database tables"""
        db.create_all()


class BookingRequest(db.Model):
    """Database model for booking requests"""
    __tablename__ = 'booking_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    checkin_date = db.Column(db.Date, nullable=False)
    checkout_date = db.Column(db.Date, nullable=False)
    guests = db.Column(db.Integer, nullable=False)
    guest_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    special_requests = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')  # pending, confirmed, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert booking request to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'checkin_date': self.checkin_date.isoformat(),
            'checkout_date': self.checkout_date.isoformat(),
            'guests': self.guests,
            'guest_name': self.guest_name,
            'email': self.email,
            'phone': self.phone,
            'special_requests': self.special_requests,
            'status': self.status,
            'created_at': self.created_at.isoformat()
        }