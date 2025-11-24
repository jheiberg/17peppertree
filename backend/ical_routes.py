"""
iCal/ICS calendar feed routes for booking synchronization
Allows external platforms (Airbnb, Booking.com, etc.) to sync availability
"""
from flask import Blueprint, Response, request, jsonify
from datetime import datetime, timedelta
from icalendar import Calendar, Event
from database import db, BookingRequest
import logging

logger = logging.getLogger(__name__)

ical_bp = Blueprint('ical', __name__, url_prefix='/api/ical')

@ical_bp.route('/bookings.ics', methods=['GET'])
def export_bookings():
    """
    Export all confirmed/approved bookings as iCal feed
    This feed can be imported into Airbnb, Booking.com, etc.
    """
    try:
        # Create calendar
        cal = Calendar()
        cal.add('prodid', '-//17 @ Peppertree//Booking Calendar//EN')
        cal.add('version', '2.0')
        cal.add('calscale', 'GREGORIAN')
        cal.add('method', 'PUBLISH')
        cal.add('x-wr-calname', '17 @ Peppertree Bookings')
        cal.add('x-wr-timezone', 'Africa/Johannesburg')
        cal.add('x-wr-caldesc', 'Confirmed and approved bookings for 17 @ Peppertree')
        
        # Get all confirmed and approved bookings
        bookings = BookingRequest.query.filter(
            BookingRequest.status.in_(['confirmed', 'approved'])
        ).all()
        
        for booking in bookings:
            event = Event()
            
            # Event summary (title)
            event.add('summary', f'Booking: {booking.guest_name}')
            
            # Description with booking details
            description = f"""
Guest: {booking.guest_name}
Email: {booking.email}
Phone: {booking.phone}
Guests: {booking.guests}
Status: {booking.status}
Booking ID: {booking.id}
Special Requests: {booking.special_requests or 'None'}
            """.strip()
            event.add('description', description)
            
            # Start and end dates (all-day events)
            event.add('dtstart', booking.checkin_date)
            event.add('dtend', booking.checkout_date)
            
            # Unique identifier
            event.add('uid', f'booking-{booking.id}@17peppertree.co.za')
            
            # Creation and modification timestamps
            event.add('dtstamp', datetime.utcnow())
            if booking.created_at:
                event.add('created', booking.created_at)
            if booking.updated_at:
                event.add('last-modified', booking.updated_at)
            
            # Status
            event.add('status', 'CONFIRMED')
            
            # Classification
            event.add('class', 'PRIVATE')
            
            # Organizer
            event.add('organizer', 'bookings@17peppertree.co.za')
            
            cal.add_component(event)
        
        # Generate iCal data
        ical_data = cal.to_ical()
        
        # Return as downloadable .ics file
        return Response(
            ical_data,
            mimetype='text/calendar',
            headers={
                'Content-Disposition': 'attachment; filename=peppertree-bookings.ics',
                'Cache-Control': 'no-cache, must-revalidate',
                'Expires': '0'
            }
        )
        
    except Exception as e:
        logger.error(f"Failed to generate iCal feed: {e}")
        return jsonify({'error': 'Failed to generate calendar feed'}), 500


@ical_bp.route('/import', methods=['POST'])
def import_ical():
    """
    Import bookings from external iCal feed (from Airbnb, Booking.com, etc.)
    This allows syncing bookings from other platforms into your system
    """
    try:
        # Get iCal URL from request
        data = request.get_json()
        ical_url = data.get('ical_url')
        source_platform = data.get('platform', 'external')
        
        if not ical_url:
            return jsonify({'error': 'ical_url is required'}), 400
        
        # Fetch iCal feed
        import requests
        response = requests.get(ical_url, timeout=30)
        response.raise_for_status()
        
        # Parse iCal data
        cal = Calendar.from_ical(response.content)
        
        imported_count = 0
        skipped_count = 0
        
        for component in cal.walk():
            if component.name == "VEVENT":
                try:
                    # Extract event details
                    summary = str(component.get('summary', 'External Booking'))
                    dtstart = component.get('dtstart').dt
                    dtend = component.get('dtend').dt
                    uid = str(component.get('uid', ''))
                    description = str(component.get('description', ''))
                    
                    # Convert datetime to date if needed
                    if isinstance(dtstart, datetime):
                        dtstart = dtstart.date()
                    if isinstance(dtend, datetime):
                        dtend = dtend.date()
                    
                    # Check if booking already exists (by UID or date range)
                    existing = BookingRequest.query.filter(
                        BookingRequest.checkin_date == dtstart,
                        BookingRequest.checkout_date == dtend,
                        BookingRequest.guest_name.like(f'%{source_platform}%')
                    ).first()
                    
                    if existing:
                        skipped_count += 1
                        continue
                    
                    # Create new booking from external source
                    booking = BookingRequest(
                        guest_name=f'{source_platform}: {summary[:50]}',
                        email=f'imported@{source_platform}.com',
                        phone='N/A',
                        checkin_date=dtstart,
                        checkout_date=dtend,
                        guests=2,  # Default
                        special_requests=f'Imported from {source_platform}. UID: {uid}',
                        status='confirmed',  # External bookings are already confirmed
                        payment_status='paid'  # Assume paid through external platform
                    )
                    
                    db.session.add(booking)
                    imported_count += 1
                    
                except Exception as e:
                    logger.warning(f"Failed to import event: {e}")
                    continue
        
        db.session.commit()
        
        return jsonify({
            'message': 'iCal import completed',
            'imported': imported_count,
            'skipped': skipped_count
        })
        
    except Exception as e:
        logger.error(f"Failed to import iCal feed: {e}")
        db.session.rollback()
        return jsonify({'error': f'Failed to import calendar: {str(e)}'}), 500


@ical_bp.route('/info', methods=['GET'])
def ical_info():
    """
    Provide information about iCal feed URLs and how to use them
    """
    base_url = request.host_url.rstrip('/')
    
    return jsonify({
        'export_url': f'{base_url}/api/ical/bookings.ics',
        'instructions': {
            'airbnb': 'Go to Calendar > Availability Settings > Import Calendar > Paste the export URL',
            'booking_com': 'Go to Calendar > Import/Export > Import Calendar > Paste the export URL',
            'vrbo': 'Go to Calendar > Sync Calendar > Import Calendar > Paste the export URL',
            'general': 'Copy the export URL and paste it into the calendar import section of any booking platform'
        },
        'features': [
            'Automatically syncs confirmed and approved bookings',
            'Updates every time the feed is accessed',
            'Compatible with all major booking platforms',
            'Includes booking details and guest information'
        ]
    })
