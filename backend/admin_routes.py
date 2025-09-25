"""
Admin routes for managing bookings and payments
"""
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from auth import admin_required
from database import db, BookingRequest
from email_notifications import EmailNotification
import logging

logger = logging.getLogger(__name__)

# Create admin blueprint
admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


@admin_bp.route('/bookings', methods=['GET'])
@admin_required
def get_all_bookings():
    """Get all bookings with filtering options"""
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
            'per_page': per_page
        })
    
    except Exception as e:
        logger.error(f"Failed to fetch bookings: {e}")
        return jsonify({'error': 'Failed to fetch bookings'}), 500


@admin_bp.route('/booking/<int:booking_id>', methods=['GET'])
@admin_required
def get_booking_details(booking_id):
    """Get detailed information for a specific booking"""
    try:
        booking = BookingRequest.query.get(booking_id)
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        return jsonify({
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
    
    except Exception as e:
        logger.error(f"Failed to fetch booking {booking_id}: {e}")
        return jsonify({'error': 'Failed to fetch booking details'}), 500


@admin_bp.route('/booking/<int:booking_id>/status', methods=['PUT'])
@admin_required
def update_booking_status(booking_id):
    """Update booking status (approve/reject/cancel)"""
    try:
        booking = BookingRequest.query.get(booking_id)
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        data = request.get_json()
        new_status = data.get('status')
        admin_notes = data.get('admin_notes')
        notify_guest = data.get('notify_guest', True)
        
        # Validate status
        valid_statuses = ['pending', 'approved', 'rejected', 'cancelled', 'completed']
        if new_status not in valid_statuses:
            return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
        
        # Update status history
        if not booking.status_history:
            booking.status_history = []
        
        booking.status_history.append({
            'status': new_status,
            'changed_by': request.user['email'],
            'changed_at': datetime.utcnow().isoformat(),
            'notes': admin_notes
        })
        
        # Update booking
        old_status = booking.status
        booking.status = new_status
        if admin_notes:
            booking.admin_notes = admin_notes
        booking.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Send notification email if requested
        if notify_guest and old_status != new_status:
            try:
                from flask_mail import Mail
                mail = Mail(current_app)
                email_service = EmailNotification(mail)
                email_service.send_status_update_email(booking)
            except Exception as e:
                logger.error(f"Failed to send status email: {e}")
        
        return jsonify({
            'message': 'Booking status updated successfully',
            'booking_id': booking.id,
            'status': booking.status
        })
    
    except Exception as e:
        logger.error(f"Failed to update booking status: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update booking status'}), 500


@admin_bp.route('/booking/<int:booking_id>/payment', methods=['PUT'])
@admin_required
def update_payment_status(booking_id):
    """Update payment information for a booking"""
    try:
        booking = BookingRequest.query.get(booking_id)
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        data = request.get_json()
        payment_status = data.get('payment_status')
        payment_amount = data.get('payment_amount')
        payment_reference = data.get('payment_reference')
        payment_method = data.get('payment_method')
        
        # Validate payment status
        valid_payment_statuses = ['pending', 'paid', 'partial', 'refunded', 'cancelled']
        if payment_status and payment_status not in valid_payment_statuses:
            return jsonify({'error': f'Invalid payment status. Must be one of: {", ".join(valid_payment_statuses)}'}), 400
        
        # Update payment information
        if payment_status:
            booking.payment_status = payment_status
        
        if payment_amount is not None:
            booking.payment_amount = payment_amount
        
        if payment_reference:
            booking.payment_reference = payment_reference
        
        if payment_method:
            booking.payment_method = payment_method
        
        # Set payment date if marking as paid
        if payment_status == 'paid' and not booking.payment_date:
            booking.payment_date = datetime.utcnow()
        
        booking.updated_at = datetime.utcnow()
        
        # Add to status history
        if not booking.status_history:
            booking.status_history = []
        
        booking.status_history.append({
            'type': 'payment_update',
            'payment_status': payment_status,
            'payment_amount': payment_amount,
            'changed_by': request.user['email'],
            'changed_at': datetime.utcnow().isoformat()
        })
        
        db.session.commit()
        
        return jsonify({
            'message': 'Payment information updated successfully',
            'booking_id': booking.id,
            'payment_status': booking.payment_status,
            'payment_amount': float(booking.payment_amount) if booking.payment_amount else None
        })
    
    except Exception as e:
        logger.error(f"Failed to update payment status: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update payment information'}), 500


@admin_bp.route('/booking/<int:booking_id>', methods=['DELETE'])
@admin_required
def delete_booking(booking_id):
    """Delete a booking (soft delete)"""
    try:
        booking = BookingRequest.query.get(booking_id)
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        # Soft delete by setting status to deleted
        booking.status = 'deleted'
        booking.deleted_at = datetime.utcnow()
        booking.deleted_by = request.user['email']
        booking.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Booking deleted successfully',
            'booking_id': booking.id
        })
    
    except Exception as e:
        logger.error(f"Failed to delete booking: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to delete booking'}), 500


@admin_bp.route('/dashboard/stats', methods=['GET'])
@admin_required
def get_dashboard_stats():
    """Get dashboard statistics"""
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
            'recent_bookings': recent
        })
    
    except Exception as e:
        logger.error(f"Failed to fetch dashboard stats: {e}")
        return jsonify({'error': 'Failed to fetch dashboard statistics'}), 500