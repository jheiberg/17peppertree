from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from email_notifications import EmailNotification
from database import DatabaseManager, BookingRequest, db
from auth import init_auth_routes
from admin_routes import admin_bp

load_dotenv()

app = Flask(__name__)

# Configuration
DatabaseManager.configure_database(app)
EmailNotification.configure_email(app)

# Initialize extensions
DatabaseManager.initialize_database(app)

# Create database tables and triggers on app startup
def create_tables_and_triggers():
    """Create database tables and triggers on startup"""
    with app.app_context():
        DatabaseManager.create_tables()
        try:
            from migrations import create_updated_at_trigger
            create_updated_at_trigger()
        except Exception as e:
            app.logger.warning(f"Could not create trigger: {e}")

# Initialize database on startup (replaces before_first_request)
create_tables_and_triggers()

# Configure CORS with explicit settings for mobile/tablet access
cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000", 
    "http://192.168.1.102:3000",
    "http://0.0.0.0:3000"
]

CORS(app, 
     origins=cors_origins,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     supports_credentials=True)

mail = Mail(app)
email_service = EmailNotification(mail)

# Initialize authentication routes
init_auth_routes(app)

# Register admin blueprint
app.register_blueprint(admin_bp)

# API Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Peppertree API is running'})

@app.route('/api/booking', methods=['POST'])
def create_booking():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['checkin', 'checkout', 'guests', 'name', 'email', 'phone']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Parse dates
        checkin_date = datetime.strptime(data['checkin'], '%Y-%m-%d').date()
        checkout_date = datetime.strptime(data['checkout'], '%Y-%m-%d').date()
        
        # Validate dates
        if checkin_date >= checkout_date:
            return jsonify({'error': 'Check-out date must be after check-in date'}), 400
        
        if checkin_date < datetime.now().date():
            return jsonify({'error': 'Check-in date cannot be in the past'}), 400
        
        # Validate guests
        guests = int(data['guests'])
        if guests < 1 or guests > 2:
            return jsonify({'error': 'Number of guests must be between 1 and 2'}), 400
        
        # Create booking request
        booking = BookingRequest(
            checkin_date=checkin_date,
            checkout_date=checkout_date,
            guests=guests,
            guest_name=data['name'],
            email=data['email'],
            phone=data['phone'],
            special_requests=data.get('message', '')
        )
        
        db.session.add(booking)
        db.session.commit()
        
        # Send confirmation email to guest
        email_service.send_booking_confirmation(booking)
        
        # Send notification email to property owner
        email_service.send_owner_notification(booking)
        
        return jsonify({
            'message': 'Booking request submitted successfully',
            'booking_id': booking.id
        }), 201
        
    except ValueError as e:
        return jsonify({'error': 'Invalid date format. Please use YYYY-MM-DD'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'An error occurred while processing your request'}), 500

@app.route('/api/bookings', methods=['GET'])
def get_bookings():
    try:
        bookings = BookingRequest.query.order_by(BookingRequest.created_at.desc()).all()
        return jsonify([booking.to_dict() for booking in bookings])
    except Exception as e:
        return jsonify({'error': 'An error occurred while fetching bookings'}), 500

@app.route('/api/booking/<int:booking_id>', methods=['GET'])
def get_booking(booking_id):
    try:
        booking = BookingRequest.query.get_or_404(booking_id)
        return jsonify(booking.to_dict())
    except Exception as e:
        return jsonify({'error': 'Booking not found'}), 404

@app.route('/api/booking/<int:booking_id>/status', methods=['PUT'])
def update_booking_status(booking_id):
    try:
        data = request.get_json()
        status = data.get('status')
        
        if status not in ['pending', 'confirmed', 'rejected']:
            return jsonify({'error': 'Invalid status. Must be pending, confirmed, or rejected'}), 400
        
        booking = BookingRequest.query.get_or_404(booking_id)
        booking.status = status
        db.session.commit()
        
        # Send status update email to guest
        email_service.send_status_update_email(booking)
        
        return jsonify({
            'message': 'Booking status updated successfully',
            'booking': booking.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'An error occurred while updating booking status'}), 500

@app.route('/api/availability', methods=['GET'])
def get_availability():
    try:
        year = request.args.get('year', type=int)
        month = request.args.get('month', type=int)
        
        if not year or not month:
            return jsonify({'error': 'Year and month parameters are required'}), 400
        
        if month < 1 or month > 12:
            return jsonify({'error': 'Month must be between 1 and 12'}), 400
        
        # Get all confirmed bookings for the specified month
        start_date = datetime(year, month, 1).date()
        if month == 12:
            end_date = datetime(year + 1, 1, 1).date() - timedelta(days=1)
        else:
            end_date = datetime(year, month + 1, 1).date() - timedelta(days=1)
        
        # Query for confirmed bookings that overlap with the requested month
        confirmed_bookings = BookingRequest.query.filter(
            BookingRequest.status == 'confirmed',
            BookingRequest.checkin_date <= end_date,
            BookingRequest.checkout_date >= start_date
        ).all()
        
        # Generate list of unavailable dates
        unavailable_dates = set()
        
        for booking in confirmed_bookings:
            # Include all dates from check-in to checkout (exclusive)
            current_date = max(booking.checkin_date, start_date)
            end_booking_date = min(booking.checkout_date, end_date + timedelta(days=1))
            
            while current_date < end_booking_date:
                unavailable_dates.add(current_date.isoformat())
                current_date += timedelta(days=1)
        
        return jsonify({
            'year': year,
            'month': month,
            'unavailable_dates': list(unavailable_dates)
        })
        
    except Exception as e:
        return jsonify({'error': 'An error occurred while fetching availability'}), 500


# Database initialization is handled in the main block

if __name__ == '__main__':
    with app.app_context():
        DatabaseManager.create_tables()
        # Run database migrations
        from migrations import run_migrations
        run_migrations()
    # Development server - in production, use Gunicorn via wsgi.py
    app.run(host='0.0.0.0', port=5000, debug=os.getenv('FLASK_DEBUG', 'False').lower() == 'true')