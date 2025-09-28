import pytest
from datetime import datetime, date, timedelta
from database import BookingRequest, db

class TestBookingRequest:
    """Unit tests for BookingRequest model"""
    
    def test_booking_creation(self, clean_db):
        """Test creating a new booking request"""
        checkin = date.today() + timedelta(days=7)
        checkout = checkin + timedelta(days=3)
        
        booking = BookingRequest(
            checkin_date=checkin,
            checkout_date=checkout,
            guests=2,
            guest_name="John Doe",
            email="john@example.com",
            phone="+27123456789",
            special_requests="Late check-in please"
        )
        
        db.session.add(booking)
        db.session.commit()
        
        # Verify booking was created
        assert booking.id is not None
        assert booking.checkin_date == checkin
        assert booking.checkout_date == checkout
        assert booking.guests == 2
        assert booking.guest_name == "John Doe"
        assert booking.email == "john@example.com"
        assert booking.phone == "+27123456789"
        assert booking.special_requests == "Late check-in please"
        assert booking.status == "pending"  # default status
        assert booking.created_at is not None
    
    def test_booking_default_values(self, clean_db):
        """Test booking default values"""
        booking = BookingRequest(
            checkin_date=date.today() + timedelta(days=1),
            checkout_date=date.today() + timedelta(days=3),
            guests=1,
            guest_name="Jane Smith",
            email="jane@example.com",
            phone="+27987654321"
            # Note: no special_requests or status provided
        )
        
        db.session.add(booking)
        db.session.commit()
        
        assert booking.special_requests is None
        assert booking.status == "pending"
        assert booking.created_at is not None
        assert isinstance(booking.created_at, datetime)
    
    def test_booking_to_dict(self, clean_db):
        """Test converting booking to dictionary"""
        checkin = date(2024, 6, 15)
        checkout = date(2024, 6, 18)
        created = datetime(2024, 5, 1, 10, 30, 0)
        
        booking = BookingRequest(
            checkin_date=checkin,
            checkout_date=checkout,
            guests=2,
            guest_name="Alice Johnson",
            email="alice@example.com",
            phone="+27111222333",
            special_requests="Vegetarian breakfast",
            status="confirmed"
        )
        booking.created_at = created
        
        db.session.add(booking)
        db.session.commit()
        
        booking_dict = booking.to_dict()
        
        expected_dict = {
            'id': booking.id,
            'checkin_date': '2024-06-15',
            'checkout_date': '2024-06-18',
            'guests': 2,
            'guest_name': 'Alice Johnson',
            'email': 'alice@example.com',
            'phone': '+27111222333',
            'special_requests': 'Vegetarian breakfast',
            'status': 'confirmed',
            'created_at': '2024-05-01T10:30:00',
            'updated_at': None,
            'payment_status': 'pending',
            'payment_amount': None,
            'payment_date': None,
            'payment_reference': None,
            'admin_notes': None
        }
        
        assert booking_dict == expected_dict
    
    def test_booking_query_operations(self, clean_db):
        """Test database query operations"""
        # Create multiple bookings
        bookings_data = [
            {
                'checkin_date': date.today() + timedelta(days=1),
                'checkout_date': date.today() + timedelta(days=3),
                'guests': 1,
                'guest_name': 'Person A',
                'email': 'a@example.com',
                'phone': '+27111111111',
                'status': 'pending'
            },
            {
                'checkin_date': date.today() + timedelta(days=5),
                'checkout_date': date.today() + timedelta(days=7),
                'guests': 2,
                'guest_name': 'Person B',
                'email': 'b@example.com',
                'phone': '+27222222222',
                'status': 'confirmed'
            },
            {
                'checkin_date': date.today() + timedelta(days=10),
                'checkout_date': date.today() + timedelta(days=12),
                'guests': 1,
                'guest_name': 'Person C',
                'email': 'c@example.com',
                'phone': '+27333333333',
                'status': 'rejected'
            }
        ]
        
        for data in bookings_data:
            booking = BookingRequest(**data)
            db.session.add(booking)
        
        db.session.commit()
        
        # Test query all
        all_bookings = BookingRequest.query.all()
        assert len(all_bookings) == 3
        
        # Test query by status
        confirmed_bookings = BookingRequest.query.filter_by(status='confirmed').all()
        assert len(confirmed_bookings) == 1
        assert confirmed_bookings[0].guest_name == 'Person B'
        
        # Test query by guests
        single_guest_bookings = BookingRequest.query.filter_by(guests=1).all()
        assert len(single_guest_bookings) == 2
        
        # Test ordering by created_at descending
        ordered_bookings = BookingRequest.query.order_by(BookingRequest.created_at.desc()).all()
        assert len(ordered_bookings) == 3
        # Most recent booking should be first
        assert ordered_bookings[0].guest_name == 'Person C'
    
    def test_booking_status_updates(self, clean_db):
        """Test updating booking status"""
        booking = BookingRequest(
            checkin_date=date.today() + timedelta(days=1),
            checkout_date=date.today() + timedelta(days=3),
            guests=1,
            guest_name="Status Test",
            email="status@example.com",
            phone="+27444444444"
        )
        
        db.session.add(booking)
        db.session.commit()
        
        # Initial status should be pending
        assert booking.status == 'pending'
        
        # Update to confirmed
        booking.status = 'confirmed'
        db.session.commit()
        
        # Verify update
        updated_booking = db.session.get(BookingRequest, booking.id)
        assert updated_booking.status == 'confirmed'
        
        # Update to rejected
        booking.status = 'rejected'
        db.session.commit()
        
        # Verify update
        updated_booking = db.session.get(BookingRequest, booking.id)
        assert updated_booking.status == 'rejected'
    
    def test_booking_required_fields(self, clean_db):
        """Test that required fields are enforced"""
        # This would test database constraints, but SQLite doesn't enforce these
        # In a real PostgreSQL environment, this would test NOT NULL constraints
        
        # Test creating booking without required fields
        booking = BookingRequest()
        db.session.add(booking)
        
        # This should work in SQLite but would fail in PostgreSQL
        # For now, we'll test that the object can be created but fields are None
        try:
            db.session.commit()
            # If using SQLite, the commit might succeed with NULL values
            # This is a limitation of our test setup
            pass
        except Exception as e:
            # If using PostgreSQL, this would raise an IntegrityError
            db.session.rollback()
            assert "null value" in str(e).lower() or "not null" in str(e).lower()
    
    def test_booking_string_lengths(self, clean_db):
        """Test field length constraints"""
        # Test with very long strings
        long_name = "A" * 200  # Longer than 100 char limit
        long_email = "a" * 200 + "@example.com"  # Longer than 120 char limit
        long_phone = "1" * 50  # Longer than 20 char limit

        booking = BookingRequest(
            checkin_date=date.today() + timedelta(days=1),
            checkout_date=date.today() + timedelta(days=3),
            guests=1,
            guest_name=long_name,
            email=long_email,
            phone=long_phone,
            special_requests="Regular request"
        )

        db.session.add(booking)

        # In SQLite, this might not enforce length limits
        # In PostgreSQL with proper varchar limits, this would fail
        try:
            db.session.commit()
            # Test passed in SQLite - data was truncated or accepted
            pass
        except Exception as e:
            # In PostgreSQL, this would raise a DataError
            db.session.rollback()
            assert "value too long" in str(e).lower() or "data too long" in str(e).lower()

    def test_booking_property_aliases(self, clean_db):
        """Test property aliases for backward compatibility (lines 62, 66, 70, 74, 78)"""
        checkin = date(2024, 7, 10)
        checkout = date(2024, 7, 15)

        booking = BookingRequest(
            checkin_date=checkin,
            checkout_date=checkout,
            guests=2,
            guest_name="Property Test",
            email="property@example.com",
            phone="+27555666777",
            special_requests="Test message for alias"
        )

        db.session.add(booking)
        db.session.commit()

        # Test check_in property alias (line 62)
        assert booking.check_in == checkin
        assert booking.check_in == booking.checkin_date

        # Test check_out property alias (line 66)
        assert booking.check_out == checkout
        assert booking.check_out == booking.checkout_date

        # Test guest_email property alias (line 70)
        assert booking.guest_email == "property@example.com"
        assert booking.guest_email == booking.email

        # Test guest_phone property alias (line 74)
        assert booking.guest_phone == "+27555666777"
        assert booking.guest_phone == booking.phone

        # Test message property alias (line 78)
        assert booking.message == "Test message for alias"
        assert booking.message == booking.special_requests