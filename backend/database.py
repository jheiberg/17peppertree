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
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected, cancelled, completed, deleted
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    
    # Payment fields
    payment_status = db.Column(db.String(20), default='pending')  # pending, paid, partial, refunded, cancelled
    payment_amount = db.Column(db.Numeric(10, 2))
    payment_date = db.Column(db.DateTime)
    payment_reference = db.Column(db.String(100))
    payment_method = db.Column(db.String(50))
    
    # Admin fields
    admin_notes = db.Column(db.Text)
    status_history = db.Column(db.JSON)
    deleted_at = db.Column(db.DateTime)
    deleted_by = db.Column(db.String(120))
    
    # Aliases for compatibility
    @property
    def check_in(self):
        return self.checkin_date
    
    @property
    def check_out(self):
        return self.checkout_date
    
    @property
    def guest_email(self):
        return self.email
    
    @property
    def guest_phone(self):
        return self.phone
    
    @property
    def message(self):
        return self.special_requests
    
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
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'payment_status': self.payment_status,
            'payment_amount': float(self.payment_amount) if self.payment_amount else None,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'payment_reference': self.payment_reference,
            'admin_notes': self.admin_notes
        }


class Rate(db.Model):
    """Database model for room rates and special pricing"""
    __tablename__ = 'rates'
    
    id = db.Column(db.Integer, primary_key=True)
    rate_type = db.Column(db.String(50), nullable=False)  # 'base' or 'special'
    guests = db.Column(db.Integer, nullable=False)  # 1 or 2
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    
    # Date range for special rates (NULL for base rates)
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    
    # Description for special rates
    description = db.Column(db.String(255))
    
    # Active status
    is_active = db.Column(db.Boolean, default=True)
    
    # Audit fields
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    created_by = db.Column(db.String(120))
    updated_by = db.Column(db.String(120))
    
    def to_dict(self):
        """Convert rate to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'rate_type': self.rate_type,
            'guests': self.guests,
            'amount': float(self.amount),
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'description': self.description,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'created_by': self.created_by,
            'updated_by': self.updated_by
        }