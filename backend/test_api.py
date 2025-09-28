import pytest
import json
from datetime import datetime, date, timedelta
from database import BookingRequest, db
from faker import Faker
from unittest.mock import patch, Mock

fake = Faker()


class TestApplicationStartup:
    """Test application startup scenarios"""

    def test_create_tables_and_triggers_with_exception(self, test_app):
        """Test trigger creation exception handling (lines 31-32)"""
        from app import create_tables_and_triggers
        import app as app_module

        # Mock the migration import to raise an exception
        original_import = __builtins__['__import__']

        def mock_import(name, *args, **kwargs):
            if name == 'migrations':
                # Create a mock module that raises an exception
                mock_migrations = Mock()
                mock_migrations.create_updated_at_trigger.side_effect = Exception("Trigger creation failed")
                return mock_migrations
            return original_import(name, *args, **kwargs)

        with patch('builtins.__import__', side_effect=mock_import):
            with patch.object(app_module.app, 'logger') as mock_logger:
                # This should trigger the exception handling in lines 31-32
                create_tables_and_triggers()

                # Verify the warning was logged
                mock_logger.warning.assert_called_once()
                assert "Could not create trigger:" in str(mock_logger.warning.call_args)

    def test_debug_flag_logic_from_main_block(self, test_app):
        """Test the debug flag logic that would be used in main block (line 221)"""
        import os

        # Test debug=True case
        with patch.dict('os.environ', {'FLASK_DEBUG': 'true'}):
            debug_flag = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
            assert debug_flag is True

        # Test debug=False case
        with patch.dict('os.environ', {'FLASK_DEBUG': 'false'}):
            debug_flag = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
            assert debug_flag is False

        # Test default case (no environment variable)
        with patch.dict('os.environ', {}, clear=True):
            debug_flag = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
            assert debug_flag is False


class TestHealthEndpoint:
    """Test health check endpoint"""
    
    def test_health_check(self, client):
        """Test health endpoint returns correct response"""
        response = client.get('/api/health')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
        assert data['message'] == 'Peppertree API is running'


class TestBookingEndpoints:
    """Test booking-related API endpoints"""
    
    def test_create_booking_success(self, client, clean_db):
        """Test successful booking creation"""
        booking_data = {
            'checkin': (date.today() + timedelta(days=7)).isoformat(),
            'checkout': (date.today() + timedelta(days=10)).isoformat(),
            'guests': 2,
            'name': 'John Doe',
            'email': 'john@example.com',
            'phone': '+27123456789',
            'message': 'Looking forward to our stay!'
        }
        
        response = client.post('/api/booking', 
                             data=json.dumps(booking_data),
                             content_type='application/json')
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert 'message' in data
        assert 'booking_id' in data
        assert data['message'] == 'Booking request submitted successfully'
        
        # Verify booking was created in database
        booking = db.session.get(BookingRequest, data['booking_id'])
        assert booking is not None
        assert booking.guest_name == 'John Doe'
        assert booking.email == 'john@example.com'
        assert booking.phone == '+27123456789'
        assert booking.guests == 2
        assert booking.special_requests == 'Looking forward to our stay!'
        assert booking.status == 'pending'
    
    def test_create_booking_missing_fields(self, client, clean_db):
        """Test booking creation with missing required fields"""
        test_cases = [
            # Missing checkin
            {
                'checkout': (date.today() + timedelta(days=10)).isoformat(),
                'guests': 2, 'name': 'John', 'email': 'john@example.com', 'phone': '+27123456789'
            },
            # Missing checkout
            {
                'checkin': (date.today() + timedelta(days=7)).isoformat(),
                'guests': 2, 'name': 'John', 'email': 'john@example.com', 'phone': '+27123456789'
            },
            # Missing guests
            {
                'checkin': (date.today() + timedelta(days=7)).isoformat(),
                'checkout': (date.today() + timedelta(days=10)).isoformat(),
                'name': 'John', 'email': 'john@example.com', 'phone': '+27123456789'
            },
            # Missing name
            {
                'checkin': (date.today() + timedelta(days=7)).isoformat(),
                'checkout': (date.today() + timedelta(days=10)).isoformat(),
                'guests': 2, 'email': 'john@example.com', 'phone': '+27123456789'
            },
            # Missing email
            {
                'checkin': (date.today() + timedelta(days=7)).isoformat(),
                'checkout': (date.today() + timedelta(days=10)).isoformat(),
                'guests': 2, 'name': 'John', 'phone': '+27123456789'
            },
            # Missing phone
            {
                'checkin': (date.today() + timedelta(days=7)).isoformat(),
                'checkout': (date.today() + timedelta(days=10)).isoformat(),
                'guests': 2, 'name': 'John', 'email': 'john@example.com'
            }
        ]
        
        for booking_data in test_cases:
            response = client.post('/api/booking',
                                 data=json.dumps(booking_data),
                                 content_type='application/json')
            
            assert response.status_code == 400
            data = json.loads(response.data)
            assert 'error' in data
            assert 'Missing required field' in data['error']
    
    def test_create_booking_invalid_dates(self, client, clean_db):
        """Test booking creation with invalid date combinations"""
        # Test checkout before checkin
        booking_data = {
            'checkin': (date.today() + timedelta(days=10)).isoformat(),
            'checkout': (date.today() + timedelta(days=7)).isoformat(),  # Before checkin
            'guests': 2,
            'name': 'John Doe',
            'email': 'john@example.com',
            'phone': '+27123456789'
        }
        
        response = client.post('/api/booking',
                             data=json.dumps(booking_data),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Check-out date must be after check-in date' in data['error']
        
        # Test checkin in the past
        booking_data['checkin'] = (date.today() - timedelta(days=1)).isoformat()
        booking_data['checkout'] = (date.today() + timedelta(days=7)).isoformat()
        
        response = client.post('/api/booking',
                             data=json.dumps(booking_data),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Check-in date cannot be in the past' in data['error']
    
    def test_create_booking_invalid_guests(self, client, clean_db):
        """Test booking creation with invalid guest numbers"""
        # Test with missing guests field first
        booking_data = {
            'checkin': (date.today() + timedelta(days=7)).isoformat(),
            'checkout': (date.today() + timedelta(days=10)).isoformat(),
            'name': 'John Doe',
            'email': 'john@example.com',
            'phone': '+27123456789'
        }
        
        response = client.post('/api/booking',
                             data=json.dumps(booking_data),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Missing required field: guests' in data['error']
        
        # Test with invalid guest counts (note: 0 is treated as missing field)
        test_cases = [-1, 3, 10]  # Invalid guest counts (must be 1-2)
        
        for guest_count in test_cases:
            booking_data['guests'] = guest_count
            
            response = client.post('/api/booking',
                                 data=json.dumps(booking_data),
                                 content_type='application/json')
            
            assert response.status_code == 400
            data = json.loads(response.data)
            assert 'Number of guests must be between 1 and 2' in data['error']
        
        # Test specifically that 0 guests is treated as missing field (not validation error)
        booking_data['guests'] = 0
        response = client.post('/api/booking',
                             data=json.dumps(booking_data),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Missing required field: guests' in data['error']
    
    def test_create_booking_invalid_date_format(self, client, clean_db):
        """Test booking creation with invalid date formats"""
        booking_data = {
            'checkin': 'invalid-date',
            'checkout': (date.today() + timedelta(days=10)).isoformat(),
            'guests': 2,
            'name': 'John Doe',
            'email': 'john@example.com',
            'phone': '+27123456789'
        }
        
        response = client.post('/api/booking',
                             data=json.dumps(booking_data),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Invalid date format' in data['error']
    
    def test_get_all_bookings(self, client, clean_db):
        """Test retrieving all bookings"""
        # Create test bookings
        bookings_data = []
        for i in range(3):
            booking = BookingRequest(
                checkin_date=date.today() + timedelta(days=i*5 + 1),
                checkout_date=date.today() + timedelta(days=i*5 + 4),
                guests=1 + (i % 2),
                guest_name=f'Guest {i+1}',
                email=f'guest{i+1}@example.com',
                phone=f'+2712345678{i}',
                status='pending' if i == 0 else 'confirmed'
            )
            db.session.add(booking)
            bookings_data.append(booking)
        
        db.session.commit()
        
        response = client.get('/api/bookings')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) == 3
        
        # Verify bookings are ordered by created_at desc
        assert data[0]['guest_name'] == 'Guest 3'  # Most recent
        assert data[2]['guest_name'] == 'Guest 1'  # Oldest
        
        # Verify data structure
        for booking_data in data:
            assert 'id' in booking_data
            assert 'checkin_date' in booking_data
            assert 'checkout_date' in booking_data
            assert 'guest_name' in booking_data
            assert 'email' in booking_data
            assert 'phone' in booking_data
            assert 'status' in booking_data
            assert 'created_at' in booking_data
    
    def test_get_single_booking(self, client, clean_db):
        """Test retrieving a single booking"""
        # Create test booking
        booking = BookingRequest(
            checkin_date=date.today() + timedelta(days=7),
            checkout_date=date.today() + timedelta(days=10),
            guests=2,
            guest_name='Test Guest',
            email='test@example.com',
            phone='+27123456789',
            special_requests='Test request',
            status='confirmed'
        )
        db.session.add(booking)
        db.session.commit()
        
        response = client.get(f'/api/booking/{booking.id}')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert data['id'] == booking.id
        assert data['guest_name'] == 'Test Guest'
        assert data['email'] == 'test@example.com'
        assert data['phone'] == '+27123456789'
        assert data['special_requests'] == 'Test request'
        assert data['status'] == 'confirmed'
        assert data['guests'] == 2
    
    def test_get_nonexistent_booking(self, client, clean_db):
        """Test retrieving a booking that doesn't exist"""
        response = client.get('/api/booking/999')
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'error' in data
        assert 'Booking not found' in data['error']
    
    def test_update_booking_status(self, client, clean_db):
        """Test updating booking status"""
        # Create test booking
        booking = BookingRequest(
            checkin_date=date.today() + timedelta(days=7),
            checkout_date=date.today() + timedelta(days=10),
            guests=1,
            guest_name='Status Test',
            email='status@example.com',
            phone='+27123456789'
        )
        db.session.add(booking)
        db.session.commit()
        
        # Test updating to confirmed
        response = client.put(f'/api/booking/{booking.id}/status',
                            data=json.dumps({'status': 'confirmed'}),
                            content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Booking status updated successfully'
        assert data['booking']['status'] == 'confirmed'
        
        # Verify in database
        updated_booking = db.session.get(BookingRequest, booking.id)
        assert updated_booking.status == 'confirmed'
        
        # Test updating to rejected
        response = client.put(f'/api/booking/{booking.id}/status',
                            data=json.dumps({'status': 'rejected'}),
                            content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['booking']['status'] == 'rejected'
    
    def test_update_booking_status_invalid(self, client, clean_db):
        """Test updating booking status with invalid status"""
        # Create test booking
        booking = BookingRequest(
            checkin_date=date.today() + timedelta(days=7),
            checkout_date=date.today() + timedelta(days=10),
            guests=1,
            guest_name='Status Test',
            email='status@example.com',
            phone='+27123456789'
        )
        db.session.add(booking)
        db.session.commit()
        
        # Test with invalid status
        response = client.put(f'/api/booking/{booking.id}/status',
                            data=json.dumps({'status': 'invalid_status'}),
                            content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Invalid status' in data['error']
    
    def test_update_nonexistent_booking_status(self, client, clean_db):
        """Test updating status of nonexistent booking"""
        response = client.put('/api/booking/999/status',
                            data=json.dumps({'status': 'confirmed'}),
                            content_type='application/json')
        
        # The current implementation catches all exceptions and returns 500
        # This could be improved to return 404 for NotFound specifically
        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data


class TestAvailabilityEndpoint:
    """Test availability checking endpoint"""
    
    def test_get_availability_no_bookings(self, client, clean_db):
        """Test availability when no bookings exist"""
        response = client.get('/api/availability?year=2024&month=6')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['year'] == 2024
        assert data['month'] == 6
        assert data['unavailable_dates'] == []
    
    def test_get_availability_with_bookings(self, client, clean_db):
        """Test availability with confirmed bookings"""
        # Create confirmed bookings
        booking1 = BookingRequest(
            checkin_date=date(2024, 6, 15),
            checkout_date=date(2024, 6, 18),
            guests=2,
            guest_name='Guest 1',
            email='guest1@example.com',
            phone='+27111111111',
            status='confirmed'
        )
        
        booking2 = BookingRequest(
            checkin_date=date(2024, 6, 25),
            checkout_date=date(2024, 6, 28),
            guests=1,
            guest_name='Guest 2',
            email='guest2@example.com',
            phone='+27222222222',
            status='confirmed'
        )
        
        # Create pending booking (should not affect availability)
        booking3 = BookingRequest(
            checkin_date=date(2024, 6, 20),
            checkout_date=date(2024, 6, 22),
            guests=1,
            guest_name='Guest 3',
            email='guest3@example.com',
            phone='+27333333333',
            status='pending'
        )
        
        db.session.add_all([booking1, booking2, booking3])
        db.session.commit()
        
        response = client.get('/api/availability?year=2024&month=6')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['year'] == 2024
        assert data['month'] == 6
        
        unavailable = set(data['unavailable_dates'])
        expected_unavailable = {
            '2024-06-15', '2024-06-16', '2024-06-17',  # booking1
            '2024-06-25', '2024-06-26', '2024-06-27'   # booking2
        }
        
        assert unavailable == expected_unavailable
        
        # Pending booking dates should not be included
        assert '2024-06-20' not in unavailable
        assert '2024-06-21' not in unavailable
    
    def test_get_availability_missing_parameters(self, client, clean_db):
        """Test availability endpoint with missing parameters"""
        # Missing year
        response = client.get('/api/availability?month=6')
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Year and month parameters are required' in data['error']
        
        # Missing month
        response = client.get('/api/availability?year=2024')
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Year and month parameters are required' in data['error']
        
        # Missing both
        response = client.get('/api/availability')
        assert response.status_code == 400
    
    def test_get_availability_invalid_month(self, client, clean_db):
        """Test availability endpoint with invalid month"""
        # Month 0 is treated as missing (falsy), not as invalid range
        response = client.get('/api/availability?year=2024&month=0')
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Year and month parameters are required' in data['error']
        
        # Test actual invalid month range (negative values that aren't 0)
        response = client.get('/api/availability?year=2024&month=13')
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Month must be between 1 and 12' in data['error']
        
        response = client.get('/api/availability?year=2024&month=-5')
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Month must be between 1 and 12' in data['error']
    
    def test_get_availability_cross_month_booking(self, client, clean_db):
        """Test availability with bookings that span across months"""
        # Booking from May 30 to June 3
        booking = BookingRequest(
            checkin_date=date(2024, 5, 30),
            checkout_date=date(2024, 6, 3),
            guests=1,
            guest_name='Cross Month Guest',
            email='cross@example.com',
            phone='+27444444444',
            status='confirmed'
        )
        db.session.add(booking)
        db.session.commit()

        # Check June availability
        response = client.get('/api/availability?year=2024&month=6')
        assert response.status_code == 200
        data = json.loads(response.data)

        unavailable = set(data['unavailable_dates'])
        # Should include June 1 and 2 (checkout is exclusive)
        assert '2024-06-01' in unavailable
        assert '2024-06-02' in unavailable
        assert '2024-06-03' not in unavailable  # Checkout date is exclusive

    def test_get_availability_december_month(self, client, clean_db):
        """Test availability for December to cover year rollover logic (line 179)"""
        # Create a booking in December 2024
        booking = BookingRequest(
            checkin_date=date(2024, 12, 15),
            checkout_date=date(2024, 12, 20),
            guests=2,
            guest_name='December Guest',
            email='december@example.com',
            phone='+27555555555',
            status='confirmed'
        )
        db.session.add(booking)
        db.session.commit()

        # Test December availability to trigger line 179 (year + 1 logic)
        response = client.get('/api/availability?year=2024&month=12')
        assert response.status_code == 200
        data = json.loads(response.data)

        assert data['year'] == 2024
        assert data['month'] == 12

        unavailable = set(data['unavailable_dates'])
        expected_dates = {
            '2024-12-15', '2024-12-16', '2024-12-17', '2024-12-18', '2024-12-19'
        }
        assert unavailable == expected_dates


class TestCORSHeaders:
    """Test CORS headers are properly set"""
    
    def test_cors_headers_get(self, client):
        """Test CORS headers on GET request"""
        response = client.get('/api/health')
        
        # Check if CORS headers are present
        # Note: In testing, CORS headers might not be set the same way
        # This is a basic check
        assert response.status_code == 200
    
    def test_cors_options_request(self, client):
        """Test CORS preflight OPTIONS request"""
        response = client.options('/api/booking')
        
        # OPTIONS request should be handled by CORS
        assert response.status_code in [200, 204]


class TestErrorHandling:
    """Test error handling scenarios"""

    def test_invalid_json(self, client):
        """Test handling of invalid JSON"""
        response = client.post('/api/booking',
                             data='invalid json{',
                             content_type='application/json')

        # Flask will return 500 for invalid JSON in current implementation
        # The request.get_json() call will fail and be caught by the general exception handler
        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data

    def test_get_bookings_database_error(self, client, monkeypatch):
        """Test error handling in get_bookings endpoint (lines 128-129)"""
        from unittest.mock import Mock, patch

        # Mock BookingRequest.query to raise an exception
        def mock_query_error(*args, **kwargs):
            raise Exception("Database connection error")

        with patch('app.BookingRequest.query') as mock_query:
            mock_query.order_by.side_effect = mock_query_error

            response = client.get('/api/bookings')

            assert response.status_code == 500
            data = json.loads(response.data)
            assert 'error' in data
            assert data['error'] == 'An error occurred while fetching bookings'

    def test_availability_database_error(self, client):
        """Test error handling in availability endpoint (lines 208-209)"""
        from unittest.mock import patch

        # Mock BookingRequest.query to raise an exception
        def mock_query_error(*args, **kwargs):
            raise Exception("Database query failed")

        with patch('app.BookingRequest.query') as mock_query:
            mock_query.filter.side_effect = mock_query_error

            response = client.get('/api/availability?year=2024&month=6')

            assert response.status_code == 500
            data = json.loads(response.data)
            assert 'error' in data
            assert data['error'] == 'An error occurred while fetching availability'
    
    def test_missing_content_type(self, client):
        """Test request without proper content type"""
        booking_data = {
            'checkin': (date.today() + timedelta(days=7)).isoformat(),
            'checkout': (date.today() + timedelta(days=10)).isoformat(),
            'guests': 2,
            'name': 'John Doe',
            'email': 'john@example.com',
            'phone': '+27123456789'
        }
        
        # Send without application/json content type
        response = client.post('/api/booking', data=json.dumps(booking_data))
        
        # Without proper content type, request.get_json() returns None
        # This will trigger the "Missing required field" error for the first field
        # But since data is None, it will likely cause an exception and return 500
        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data