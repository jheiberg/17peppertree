"""
Secure API routes for client credentials and service-to-service communication
"""
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timezone
from secure_auth import client_credentials_required, user_or_client_required
from database import db, BookingRequest
from email_notifications import EmailNotification
from secure_api_client import get_secure_api_client
import logging

logger = logging.getLogger(__name__)

# Create secure API blueprint
secure_api_bp = Blueprint('secure_api', __name__, url_prefix='/api/secure')

@secure_api_bp.route('/health', methods=['GET'])
@client_credentials_required
def secure_health():
    """Secure health check endpoint for service-to-service communication"""
    return jsonify({
        'status': 'healthy',
        'message': 'Secure Peppertree API is running',
        'client_id': request.client['client_id'],
        'timestamp': datetime.now(timezone.utc).isoformat()
    })

@secure_api_bp.route('/bookings', methods=['GET'])
@user_or_client_required
def get_secure_bookings():
    """Get all bookings - accessible by both users and service accounts"""
    try:
        # Get query parameters
        status = request.args.get('status')
        payment_status = request.args.get('payment_status')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        # Build query
        query = BookingRequest.query

        if status:
            query = query.filter_by(status=status)

        if payment_status:
            query = query.filter_by(payment_status=payment_status)

        if start_date:
            query = query.filter(BookingRequest.checkin_date >= datetime.fromisoformat(start_date).date())

        if end_date:
            query = query.filter(BookingRequest.checkout_date <= datetime.fromisoformat(end_date).date())

        # Order by created date descending
        query = query.order_by(BookingRequest.created_at.desc())

        # Paginate results
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)

        bookings = []
        for booking in paginated.items:
            bookings.append({
                'id': booking.id,
                'guest_name': booking.guest_name,
                'email': booking.email,
                'phone': booking.phone,
                'checkin_date': booking.checkin_date.isoformat(),
                'checkout_date': booking.checkout_date.isoformat(),
                'guests': booking.guests,
                'special_requests': booking.special_requests,
                'status': booking.status,
                'payment_status': booking.payment_status,
                'payment_amount': float(booking.payment_amount) if booking.payment_amount else None,
                'payment_date': booking.payment_date.isoformat() if booking.payment_date else None,
                'payment_reference': booking.payment_reference,
                'admin_notes': booking.admin_notes,
                'created_at': booking.created_at.isoformat(),
                'updated_at': booking.updated_at.isoformat() if booking.updated_at else None
            })

        return jsonify({
            'bookings': bookings,
            'total': paginated.total,
            'pages': paginated.pages,
            'current_page': page,
            'per_page': per_page,
            'auth_type': request.auth_type,
            'client_id': request.client['client_id'] if request.auth_type == 'client' else None,
            'user_id': request.user['sub'] if request.auth_type == 'user' else None
        })

    except Exception as e:
        logger.error(f"Failed to fetch secure bookings: {e}")
        return jsonify({'error': 'Failed to fetch bookings'}), 500

@secure_api_bp.route('/booking', methods=['POST'])
@client_credentials_required
def create_secure_booking():
    """Create a new booking via secure API (service-to-service)"""
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

        # Send confirmation email to guest (if email service is configured)
        try:
            from flask_mail import Mail
            mail = Mail(current_app)
            email_service = EmailNotification(mail)
            email_service.send_booking_confirmation(booking)
            email_service.send_owner_notification(booking)
        except Exception as e:
            logger.warning(f"Failed to send booking emails: {e}")

        return jsonify({
            'message': 'Booking request submitted successfully via secure API',
            'booking_id': booking.id,
            'booking': {
                'id': booking.id,
                'guest_name': booking.guest_name,
                'email': booking.email,
                'checkin_date': booking.checkin_date.isoformat(),
                'checkout_date': booking.checkout_date.isoformat(),
                'guests': booking.guests,
                'status': booking.status,
                'created_at': booking.created_at.isoformat()
            },
            'client_id': request.client['client_id']
        }), 201

    except ValueError as e:
        return jsonify({'error': 'Invalid date format. Please use YYYY-MM-DD'}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to create secure booking: {e}")
        return jsonify({'error': 'An error occurred while processing your request'}), 500

@secure_api_bp.route('/booking/<int:booking_id>', methods=['GET'])
@user_or_client_required
def get_secure_booking(booking_id):
    """Get a specific booking via secure API"""
    try:
        booking = db.session.get(BookingRequest, booking_id)

        if not booking:
            return jsonify({'error': 'Booking not found'}), 404

        return jsonify({
            'booking': {
                'id': booking.id,
                'guest_name': booking.guest_name,
                'email': booking.email,
                'phone': booking.phone,
                'checkin_date': booking.checkin_date.isoformat(),
                'checkout_date': booking.checkout_date.isoformat(),
                'guests': booking.guests,
                'special_requests': booking.special_requests,
                'status': booking.status,
                'payment_status': booking.payment_status,
                'payment_amount': float(booking.payment_amount) if booking.payment_amount else None,
                'payment_date': booking.payment_date.isoformat() if booking.payment_date else None,
                'payment_reference': booking.payment_reference,
                'admin_notes': booking.admin_notes,
                'created_at': booking.created_at.isoformat(),
                'updated_at': booking.updated_at.isoformat() if booking.updated_at else None
            },
            'auth_type': request.auth_type,
            'client_id': request.client['client_id'] if request.auth_type == 'client' else None,
            'user_id': request.user['sub'] if request.auth_type == 'user' else None
        })

    except Exception as e:
        logger.error(f"Failed to fetch secure booking {booking_id}: {e}")
        return jsonify({'error': 'Failed to fetch booking details'}), 500

@secure_api_bp.route('/dashboard/stats', methods=['GET'])
@user_or_client_required
def get_secure_dashboard_stats():
    """Get dashboard statistics via secure API"""
    try:
        # Get booking statistics
        total_bookings = BookingRequest.query.count()
        pending_bookings = BookingRequest.query.filter_by(status='pending').count()
        approved_bookings = BookingRequest.query.filter_by(status='approved').count()

        # Get payment statistics
        pending_payments = BookingRequest.query.filter_by(payment_status='pending').count()
        paid_bookings = BookingRequest.query.filter_by(payment_status='paid').count()

        # Calculate total revenue
        total_revenue = db.session.query(
            db.func.sum(BookingRequest.payment_amount)
        ).filter_by(payment_status='paid').scalar() or 0

        # Get recent bookings
        recent_bookings = BookingRequest.query.order_by(
            BookingRequest.created_at.desc()
        ).limit(5).all()

        recent = []
        for booking in recent_bookings:
            recent.append({
                'id': booking.id,
                'guest_name': booking.guest_name,
                'checkin_date': booking.checkin_date.isoformat(),
                'status': booking.status,
                'payment_status': booking.payment_status
            })

        return jsonify({
            'stats': {
                'total_bookings': total_bookings,
                'pending_bookings': pending_bookings,
                'approved_bookings': approved_bookings,
                'pending_payments': pending_payments,
                'paid_bookings': paid_bookings,
                'total_revenue': float(total_revenue)
            },
            'recent_bookings': recent,
            'auth_type': request.auth_type,
            'client_id': request.client['client_id'] if request.auth_type == 'client' else None,
            'user_id': request.user['sub'] if request.auth_type == 'user' else None,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })

    except Exception as e:
        logger.error(f"Failed to fetch secure dashboard stats: {e}")
        return jsonify({'error': 'Failed to fetch dashboard statistics'}), 500

@secure_api_bp.route('/auth/test', methods=['GET'])
@client_credentials_required
def test_client_credentials():
    """Test endpoint for client credentials authentication"""
    return jsonify({
        'message': 'Client credentials authentication successful',
        'client': request.client,
        'timestamp': datetime.now(timezone.utc).isoformat()
    })

@secure_api_bp.route('/client/info', methods=['GET'])
@client_credentials_required
def get_client_info():
    """Get information about the authenticated client"""
    secure_client = get_secure_api_client()

    return jsonify({
        'client': request.client,
        'token_info': secure_client.get_token_info(),
        'timestamp': datetime.now(timezone.utc).isoformat()
    })