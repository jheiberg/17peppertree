"""
Comprehensive tests for admin routes functionality
"""
import pytest
import json
from datetime import datetime, date, timedelta
from unittest.mock import patch, MagicMock
from database import BookingRequest, db
from faker import Faker

fake = Faker()


class TestAdminBookingsEndpoint:
    """Test admin bookings management endpoint"""

    @patch('auth.keycloak_auth.verify_token')
    def test_get_all_bookings_success(self, mock_verify_token, client, clean_db):
        """Test getting all bookings successfully"""
        # Mock token verification to return admin user
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin',
            'email': 'admin@test.com'
        }

        # Create test bookings
        booking1 = BookingRequest(
            checkin_date=date.today() + timedelta(days=7),
            checkout_date=date.today() + timedelta(days=10),
            guests=2,
            guest_name="John Doe",
            email="john@example.com",
            phone="+27123456789",
            status="pending"
        )
        booking2 = BookingRequest(
            checkin_date=date.today() + timedelta(days=14),
            checkout_date=date.today() + timedelta(days=17),
            guests=1,
            guest_name="Jane Smith",
            email="jane@example.com",
            phone="+27987654321",
            status="approved"
        )

        db.session.add(booking1)
        db.session.add(booking2)
        db.session.commit()

        # Make request with valid Authorization header
        headers = {'Authorization': 'Bearer valid_token'}
        response = client.get('/api/admin/bookings', headers=headers)

        assert response.status_code == 200
        data = json.loads(response.data)

        # Check response structure
        assert 'bookings' in data
        assert 'total' in data
        assert 'current_page' in data
        assert 'per_page' in data
        assert len(data['bookings']) == 2

    @patch('auth.keycloak_auth.verify_token')
    def test_get_bookings_with_status_filter(self, mock_verify_token, client, clean_db):
        """Test filtering bookings by status"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin'
        }

        # Create bookings with different statuses
        booking_pending = BookingRequest(
            checkin_date=date.today() + timedelta(days=7),
            checkout_date=date.today() + timedelta(days=10),
            guests=2,
            guest_name="Pending User",
            email="pending@example.com",
            phone="+27111111111",
            status="pending"
        )
        booking_approved = BookingRequest(
            checkin_date=date.today() + timedelta(days=14),
            checkout_date=date.today() + timedelta(days=17),
            guests=1,
            guest_name="Approved User",
            email="approved@example.com",
            phone="+27222222222",
            status="approved"
        )

        db.session.add(booking_pending)
        db.session.add(booking_approved)
        db.session.commit()

        # Test filter by pending status
        headers = {'Authorization': 'Bearer valid_token'}
        response = client.get('/api/admin/bookings?status=pending', headers=headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['bookings']) == 1
        assert data['bookings'][0]['status'] == 'pending'
        assert data['bookings'][0]['guest_name'] == 'Pending User'

    @patch('auth.keycloak_auth.verify_token')
    def test_get_bookings_with_payment_status_filter(self, mock_verify_token, client, clean_db):
        """Test filtering bookings by payment status"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin'
        }

        # Create bookings with different payment statuses
        booking1 = BookingRequest(
            checkin_date=date.today() + timedelta(days=7),
            checkout_date=date.today() + timedelta(days=10),
            guests=2,
            guest_name="Paid User",
            email="paid@example.com",
            phone="+27111111111",
            payment_status="paid"
        )
        booking2 = BookingRequest(
            checkin_date=date.today() + timedelta(days=14),
            checkout_date=date.today() + timedelta(days=17),
            guests=1,
            guest_name="Pending Payment",
            email="pending@example.com",
            phone="+27222222222",
            payment_status="pending"
        )

        db.session.add(booking1)
        db.session.add(booking2)
        db.session.commit()

        # Test filter by payment status
        headers = {'Authorization': 'Bearer valid_token'}
        response = client.get('/api/admin/bookings?payment_status=paid', headers=headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['bookings']) == 1
        assert data['bookings'][0]['payment_status'] == 'paid'

    @patch('auth.keycloak_auth.verify_token')
    def test_get_bookings_pagination(self, mock_verify_token, client, clean_db):
        """Test booking pagination"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin'
        }

        # Create multiple bookings for pagination testing
        for i in range(5):
            booking = BookingRequest(
                checkin_date=date.today() + timedelta(days=i+1),
                checkout_date=date.today() + timedelta(days=i+3),
                guests=1,
                guest_name=f"User {i}",
                email=f"user{i}@example.com",
                phone=f"+2711111111{i}"
            )
            db.session.add(booking)
        db.session.commit()

        # Test first page with 2 per page
        headers = {'Authorization': 'Bearer valid_token'}
        response = client.get('/api/admin/bookings?page=1&per_page=2', headers=headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['bookings']) == 2
        assert data['current_page'] == 1
        assert data['per_page'] == 2
        assert data['total'] == 5

    def test_get_bookings_without_admin_auth(self, client, clean_db):
        """Test accessing bookings without admin authentication"""
        response = client.get('/api/admin/bookings')

        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'error' in data
        assert 'authorization token' in data['error'].lower()


class TestAdminBookingDetails:
    """Test admin booking details and updates"""

    @patch('auth.keycloak_auth.verify_token')
    def test_get_booking_details_success(self, mock_verify_token, client, clean_db):
        """Test getting specific booking details"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin'
        }

        # Create test booking
        booking = BookingRequest(
            checkin_date=date.today() + timedelta(days=7),
            checkout_date=date.today() + timedelta(days=10),
            guests=2,
            guest_name="John Doe",
            email="john@example.com",
            phone="+27123456789",
            special_requests="Ground floor please"
        )
        db.session.add(booking)
        db.session.commit()

        headers = {'Authorization': 'Bearer valid_token'}
        response = client.get(f'/api/admin/booking/{booking.id}', headers=headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['id'] == booking.id
        assert data['guest_name'] == 'John Doe'
        assert data['special_requests'] == 'Ground floor please'

    @patch('auth.keycloak_auth.verify_token')
    def test_get_booking_details_not_found(self, mock_verify_token, client, clean_db):
        """Test getting details for non-existent booking"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin'
        }

        headers = {'Authorization': 'Bearer valid_token'}
        response = client.get('/api/admin/booking/99999', headers=headers)

        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'error' in data

    @patch('auth.keycloak_auth.verify_token')
    @patch('admin_routes.EmailNotification')
    def test_update_booking_status_success(self, mock_email, mock_verify_token, client, clean_db):
        """Test updating booking status"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin'
        }
        mock_email.return_value.send_status_update.return_value = True

        # Create test booking
        booking = BookingRequest(
            checkin_date=date.today() + timedelta(days=7),
            checkout_date=date.today() + timedelta(days=10),
            guests=2,
            guest_name="John Doe",
            email="john@example.com",
            phone="+27123456789",
            status="pending"
        )
        db.session.add(booking)
        db.session.commit()

        headers = {'Authorization': 'Bearer valid_token'}
        update_data = {
            'status': 'approved',
            'admin_notes': 'Approved by admin'
        }

        response = client.put(
            f'/api/admin/booking/{booking.id}/status',
            data=json.dumps(update_data),
            content_type='application/json',
            headers=headers
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Booking status updated successfully'

        # Verify booking was updated in database
        updated_booking = db.session.get(BookingRequest, booking.id)
        assert updated_booking.status == 'approved'
        assert updated_booking.admin_notes == 'Approved by admin'

    @patch('auth.keycloak_auth.verify_token')
    def test_update_booking_status_invalid_status(self, mock_verify_token, client, clean_db):
        """Test updating booking with invalid status"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin'
        }

        # Create test booking
        booking = BookingRequest(
            checkin_date=date.today() + timedelta(days=7),
            checkout_date=date.today() + timedelta(days=10),
            guests=2,
            guest_name="John Doe",
            email="john@example.com",
            phone="+27123456789"
        )
        db.session.add(booking)
        db.session.commit()

        headers = {'Authorization': 'Bearer valid_token'}
        update_data = {'status': 'invalid_status'}

        response = client.put(
            f'/api/admin/booking/{booking.id}/status',
            data=json.dumps(update_data),
            content_type='application/json',
            headers=headers
        )

        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data

    @patch('auth.keycloak_auth.verify_token')
    def test_update_payment_status_success(self, mock_verify_token, client, clean_db):
        """Test updating payment information"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin'
        }

        # Create test booking
        booking = BookingRequest(
            checkin_date=date.today() + timedelta(days=7),
            checkout_date=date.today() + timedelta(days=10),
            guests=2,
            guest_name="John Doe",
            email="john@example.com",
            phone="+27123456789"
        )
        db.session.add(booking)
        db.session.commit()

        headers = {'Authorization': 'Bearer valid_token'}
        payment_data = {
            'payment_status': 'paid',
            'payment_amount': 2500.00,
            'payment_reference': 'PAY123456',
            'admin_notes': 'Payment received'
        }

        response = client.put(
            f'/api/admin/booking/{booking.id}/payment',
            data=json.dumps(payment_data),
            content_type='application/json',
            headers=headers
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Payment information updated successfully'

        # Verify payment info was updated
        updated_booking = db.session.get(BookingRequest, booking.id)
        assert updated_booking.payment_status == 'paid'
        assert updated_booking.payment_amount == 2500.00
        assert updated_booking.payment_reference == 'PAY123456'

    @patch('auth.keycloak_auth.verify_token')
    def test_delete_booking_success(self, mock_verify_token, client, clean_db):
        """Test deleting a booking"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin'
        }

        # Create test booking
        booking = BookingRequest(
            checkin_date=date.today() + timedelta(days=7),
            checkout_date=date.today() + timedelta(days=10),
            guests=2,
            guest_name="John Doe",
            email="john@example.com",
            phone="+27123456789"
        )
        db.session.add(booking)
        db.session.commit()
        booking_id = booking.id

        headers = {'Authorization': 'Bearer valid_token'}
        response = client.delete(f'/api/admin/booking/{booking_id}', headers=headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Booking deleted successfully'

        # Verify booking was soft deleted (status changed to 'deleted')
        updated_booking = db.session.get(BookingRequest, booking_id)
        assert updated_booking is not None
        assert updated_booking.status == 'deleted'


class TestAdminDashboardStats:
    """Test admin dashboard statistics"""

    @patch('auth.keycloak_auth.verify_token')
    def test_get_dashboard_stats_success(self, mock_verify_token, client, clean_db):
        """Test getting dashboard statistics with data"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin'
        }

        # Create test bookings with different statuses
        bookings_data = [
            {'status': 'pending', 'payment_status': 'pending'},
            {'status': 'approved', 'payment_status': 'paid'},
            {'status': 'approved', 'payment_status': 'pending'},
            {'status': 'rejected', 'payment_status': 'pending'}
        ]

        for data in bookings_data:
            booking = BookingRequest(
                checkin_date=date.today() + timedelta(days=7),
                checkout_date=date.today() + timedelta(days=10),
                guests=2,
                guest_name=fake.name(),
                email=fake.email(),
                phone="+27123456789",
                **data
            )
            db.session.add(booking)
        db.session.commit()

        headers = {'Authorization': 'Bearer valid_token'}
        response = client.get('/api/admin/dashboard/stats', headers=headers)

        assert response.status_code == 200
        data = json.loads(response.data)

        # Check response structure
        assert 'stats' in data
        assert 'recent_bookings' in data

        # Check stats structure
        stats = data['stats']
        assert 'total_bookings' in stats
        assert 'pending_bookings' in stats
        assert 'approved_bookings' in stats
        assert 'pending_payments' in stats
        assert 'total_revenue' in stats
        assert 'paid_bookings' in stats

        # Verify counts
        assert stats['total_bookings'] == 4
        assert stats['pending_bookings'] == 1
        assert stats['approved_bookings'] == 2
        assert stats['paid_bookings'] == 1

    @patch('auth.keycloak_auth.verify_token')
    def test_get_dashboard_stats_empty(self, mock_verify_token, client, clean_db):
        """Test getting dashboard statistics with no data"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin'
        }

        headers = {'Authorization': 'Bearer valid_token'}
        response = client.get('/api/admin/dashboard/stats', headers=headers)

        assert response.status_code == 200
        data = json.loads(response.data)

        # Check response structure
        assert 'stats' in data

        # All counts should be zero
        stats = data['stats']
        assert stats['total_bookings'] == 0
        assert stats['pending_bookings'] == 0
        assert stats['approved_bookings'] == 0
        assert stats['pending_payments'] == 0
        assert stats['total_revenue'] == 0
        assert stats['paid_bookings'] == 0


class TestAdminErrorHandling:
    """Test error handling in admin routes"""

    @patch('auth.keycloak_auth.verify_token')
    def test_malformed_json_request(self, mock_verify_token, client, clean_db):
        """Test handling of malformed JSON requests"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin'
        }

        # Create test booking
        booking = BookingRequest(
            checkin_date=date.today() + timedelta(days=7),
            checkout_date=date.today() + timedelta(days=10),
            guests=2,
            guest_name="John Doe",
            email="john@example.com",
            phone="+27123456789"
        )
        db.session.add(booking)
        db.session.commit()

        # Send malformed JSON
        headers = {'Authorization': 'Bearer valid_token'}
        response = client.put(
            f'/api/admin/booking/{booking.id}/status',
            data='{"invalid": json}',
            content_type='application/json',
            headers=headers
        )

        # Flask's get_json() raises exception for malformed JSON, caught by try-except -> 500
        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data

    @patch('auth.keycloak_auth.verify_token')
    def test_missing_required_fields(self, mock_verify_token, client, clean_db):
        """Test handling of missing required fields"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin'
        }

        # Create test booking
        booking = BookingRequest(
            checkin_date=date.today() + timedelta(days=7),
            checkout_date=date.today() + timedelta(days=10),
            guests=2,
            guest_name="John Doe",
            email="john@example.com",
            phone="+27123456789"
        )
        db.session.add(booking)
        db.session.commit()

        # Send request missing required status field
        headers = {'Authorization': 'Bearer valid_token'}
        response = client.put(
            f'/api/admin/booking/{booking.id}/status',
            data=json.dumps({'admin_notes': 'Missing status'}),
            content_type='application/json',
            headers=headers
        )

        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data

    def test_insufficient_permissions(self, client, clean_db):
        """Test accessing admin routes with insufficient permissions"""
        with patch('auth.keycloak_auth.verify_token') as mock_verify:
            # Mock user without admin role
            mock_verify.return_value = {
                'realm_access': {'roles': ['user']},
                'preferred_username': 'regularuser'
            }

            headers = {'Authorization': 'Bearer user_token'}
            response = client.get('/api/admin/bookings', headers=headers)

            assert response.status_code == 403
            data = json.loads(response.data)
            assert 'error' in data
            assert 'permissions' in data['error'].lower()

    @patch('auth.keycloak_auth.verify_token')
    def test_get_bookings_with_date_filters(self, mock_verify_token, client, clean_db):
        """Test filtering bookings by date range (lines 40, 43)"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin',
            'email': 'admin@test.com'
        }

        # Create bookings with different dates
        booking1 = BookingRequest(
            checkin_date=date(2024, 6, 15),
            checkout_date=date(2024, 6, 18),
            guests=2,
            guest_name="June Booking",
            email="june@example.com",
            phone="+27111111111"
        )
        booking2 = BookingRequest(
            checkin_date=date(2024, 7, 10),
            checkout_date=date(2024, 7, 15),
            guests=1,
            guest_name="July Booking",
            email="july@example.com",
            phone="+27222222222"
        )

        db.session.add(booking1)
        db.session.add(booking2)
        db.session.commit()

        headers = {'Authorization': 'Bearer valid_token'}

        # Test start_date filter (line 40)
        response = client.get('/api/admin/bookings?start_date=2024-07-01', headers=headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['bookings']) == 1
        assert data['bookings'][0]['guest_name'] == 'July Booking'

        # Test end_date filter (line 43)
        response = client.get('/api/admin/bookings?end_date=2024-06-20', headers=headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['bookings']) == 1
        assert data['bookings'][0]['guest_name'] == 'June Booking'

    @patch('auth.keycloak_auth.verify_token')
    @patch('admin_routes.BookingRequest')
    def test_get_all_bookings_database_error(self, mock_booking, mock_verify_token, client, clean_db):
        """Test database error in get_all_bookings (lines 80-82)"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin',
            'email': 'admin@test.com'
        }

        # Mock database error
        mock_booking.query.count.side_effect = Exception("Database connection failed")

        headers = {'Authorization': 'Bearer valid_token'}
        response = client.get('/api/admin/bookings', headers=headers)

        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data
        assert data['error'] == 'Failed to fetch bookings'

    @patch('auth.keycloak_auth.verify_token')
    @patch('admin_routes.BookingRequest')
    def test_get_booking_details_database_error(self, mock_booking, mock_verify_token, client, clean_db):
        """Test database error in get_booking_details (lines 114-116)"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin',
            'email': 'admin@test.com'
        }

        # Mock database error
        mock_booking.query.get.side_effect = Exception("Database error")

        headers = {'Authorization': 'Bearer valid_token'}
        response = client.get('/api/admin/booking/1', headers=headers)

        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data
        assert data['error'] == 'Failed to fetch booking details'

    @patch('auth.keycloak_auth.verify_token')
    def test_update_booking_status_not_found(self, mock_verify_token, client, clean_db):
        """Test updating status for non-existent booking (line 127)"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin',
            'email': 'admin@test.com'
        }

        headers = {'Authorization': 'Bearer valid_token'}
        update_data = {'status': 'approved'}

        response = client.put(
            '/api/admin/booking/99999/status',
            data=json.dumps(update_data),
            content_type='application/json',
            headers=headers
        )

        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'error' in data
        assert data['error'] == 'Booking not found'

    @patch('auth.keycloak_auth.verify_token')
    @patch('admin_routes.EmailNotification')
    def test_update_booking_status_email_error(self, mock_email_class, mock_verify_token, client, clean_db):
        """Test email notification failure (lines 166-167)"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin',
            'email': 'admin@test.com'
        }

        # Mock email service to raise exception
        mock_email_service = MagicMock()
        mock_email_service.send_status_update_email.side_effect = Exception("Email service unavailable")
        mock_email_class.return_value = mock_email_service

        # Create test booking
        booking = BookingRequest(
            checkin_date=date.today() + timedelta(days=7),
            checkout_date=date.today() + timedelta(days=10),
            guests=2,
            guest_name="John Doe",
            email="john@example.com",
            phone="+27123456789",
            status="pending"
        )
        db.session.add(booking)
        db.session.commit()

        headers = {'Authorization': 'Bearer valid_token'}
        update_data = {
            'status': 'approved',
            'notify_guest': True
        }

        response = client.put(
            f'/api/admin/booking/{booking.id}/status',
            data=json.dumps(update_data),
            content_type='application/json',
            headers=headers
        )

        # Should still return success even if email fails
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Booking status updated successfully'

    @patch('auth.keycloak_auth.verify_token')
    def test_update_payment_status_not_found(self, mock_verify_token, client, clean_db):
        """Test updating payment for non-existent booking (line 189)"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin',
            'email': 'admin@test.com'
        }

        headers = {'Authorization': 'Bearer valid_token'}
        payment_data = {'payment_status': 'paid'}

        response = client.put(
            '/api/admin/booking/99999/payment',
            data=json.dumps(payment_data),
            content_type='application/json',
            headers=headers
        )

        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'error' in data
        assert data['error'] == 'Booking not found'

    @patch('auth.keycloak_auth.verify_token')
    def test_update_payment_invalid_status(self, mock_verify_token, client, clean_db):
        """Test invalid payment status validation (line 200)"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin',
            'email': 'admin@test.com'
        }

        # Create test booking
        booking = BookingRequest(
            checkin_date=date.today() + timedelta(days=7),
            checkout_date=date.today() + timedelta(days=10),
            guests=2,
            guest_name="John Doe",
            email="john@example.com",
            phone="+27123456789"
        )
        db.session.add(booking)
        db.session.commit()

        headers = {'Authorization': 'Bearer valid_token'}
        payment_data = {'payment_status': 'invalid_status'}

        response = client.put(
            f'/api/admin/booking/{booking.id}/payment',
            data=json.dumps(payment_data),
            content_type='application/json',
            headers=headers
        )

        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'Invalid payment status' in data['error']

    @patch('auth.keycloak_auth.verify_token')
    def test_update_payment_with_method(self, mock_verify_token, client, clean_db):
        """Test updating payment with method field (line 213)"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin',
            'email': 'admin@test.com'
        }

        # Create test booking
        booking = BookingRequest(
            checkin_date=date.today() + timedelta(days=7),
            checkout_date=date.today() + timedelta(days=10),
            guests=2,
            guest_name="John Doe",
            email="john@example.com",
            phone="+27123456789"
        )
        db.session.add(booking)
        db.session.commit()

        headers = {'Authorization': 'Bearer valid_token'}
        payment_data = {
            'payment_status': 'paid',
            'payment_method': 'credit_card'
        }

        response = client.put(
            f'/api/admin/booking/{booking.id}/payment',
            data=json.dumps(payment_data),
            content_type='application/json',
            headers=headers
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Payment information updated successfully'

        # Verify payment method was set
        updated_booking = db.session.get(BookingRequest, booking.id)
        assert updated_booking.payment_method == 'credit_card'

    @patch('auth.keycloak_auth.verify_token')
    @patch('admin_routes.db')
    def test_update_payment_database_error(self, mock_db, mock_verify_token, client, clean_db):
        """Test database error in update_payment_status (lines 242-245)"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin',
            'email': 'admin@test.com'
        }

        # Create real booking first
        booking = BookingRequest(
            checkin_date=date.today() + timedelta(days=7),
            checkout_date=date.today() + timedelta(days=10),
            guests=2,
            guest_name="John Doe",
            email="john@example.com",
            phone="+27123456789"
        )
        db.session.add(booking)
        db.session.commit()

        # Mock database commit to fail
        mock_db.session.commit.side_effect = Exception("Database error")

        headers = {'Authorization': 'Bearer valid_token'}
        payment_data = {'payment_status': 'paid'}

        response = client.put(
            f'/api/admin/booking/{booking.id}/payment',
            data=json.dumps(payment_data),
            content_type='application/json',
            headers=headers
        )

        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data
        assert data['error'] == 'Failed to update payment information'

    @patch('auth.keycloak_auth.verify_token')
    def test_delete_booking_not_found(self, mock_verify_token, client, clean_db):
        """Test deleting non-existent booking (line 256)"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin',
            'email': 'admin@test.com'
        }

        headers = {'Authorization': 'Bearer valid_token'}
        response = client.delete('/api/admin/booking/99999', headers=headers)

        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'error' in data
        assert data['error'] == 'Booking not found'

    @patch('auth.keycloak_auth.verify_token')
    @patch('admin_routes.db')
    def test_delete_booking_database_error(self, mock_db, mock_verify_token, client, clean_db):
        """Test database error in delete_booking (lines 271-274)"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin',
            'email': 'admin@test.com'
        }

        # Create real booking first
        booking = BookingRequest(
            checkin_date=date.today() + timedelta(days=7),
            checkout_date=date.today() + timedelta(days=10),
            guests=2,
            guest_name="John Doe",
            email="john@example.com",
            phone="+27123456789"
        )
        db.session.add(booking)
        db.session.commit()

        # Mock database commit to fail
        mock_db.session.commit.side_effect = Exception("Database error")

        headers = {'Authorization': 'Bearer valid_token'}
        response = client.delete(f'/api/admin/booking/{booking.id}', headers=headers)

        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data
        assert data['error'] == 'Failed to delete booking'

    @patch('auth.keycloak_auth.verify_token')
    @patch('admin_routes.BookingRequest')
    def test_get_dashboard_stats_database_error(self, mock_booking, mock_verify_token, client, clean_db):
        """Test database error in get_dashboard_stats (lines 323-325)"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin']},
            'preferred_username': 'testadmin',
            'email': 'admin@test.com'
        }

        # Mock database error
        mock_booking.query.count.side_effect = Exception("Database connection failed")

        headers = {'Authorization': 'Bearer valid_token'}
        response = client.get('/api/admin/dashboard/stats', headers=headers)

        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data
        assert data['error'] == 'Failed to fetch dashboard statistics'