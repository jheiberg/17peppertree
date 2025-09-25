"""
Tests for email notifications system (email_notifications.py)
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, date, timedelta

from email_notifications import EmailNotification
from database import BookingRequest


class TestEmailNotification:
    """Test EmailNotification class functionality"""

    def test_init(self):
        """Test EmailNotification initialization"""
        mock_mail = Mock()
        email_notification = EmailNotification(mock_mail)

        assert email_notification.mail == mock_mail

    @patch.dict('os.environ', {
        'MAIL_SERVER': 'test.smtp.com',
        'MAIL_PORT': '465',
        'MAIL_USERNAME': 'test@example.com',
        'MAIL_PASSWORD': 'testpass',
        'MAIL_DEFAULT_SENDER': 'noreply@example.com'
    })
    def test_configure_email_with_environment_variables(self):
        """Test email configuration with custom environment variables"""
        mock_app = Mock()
        mock_app.config = {}

        EmailNotification.configure_email(mock_app)

        assert mock_app.config['MAIL_SERVER'] == 'test.smtp.com'
        assert mock_app.config['MAIL_PORT'] == 465
        assert mock_app.config['MAIL_USE_TLS'] is True
        assert mock_app.config['MAIL_USERNAME'] == 'test@example.com'
        assert mock_app.config['MAIL_PASSWORD'] == 'testpass'
        assert mock_app.config['MAIL_DEFAULT_SENDER'] == 'noreply@example.com'

    def test_configure_email_with_defaults(self):
        """Test email configuration with default values"""
        mock_app = Mock()
        mock_app.config = {}

        # Patch os.getenv to return defaults
        with patch('os.getenv') as mock_getenv:
            def getenv_side_effect(key, default=None):
                defaults = {
                    'MAIL_SERVER': 'smtp.gmail.com',
                    'MAIL_PORT': '587'
                }
                return defaults.get(key, default)

            mock_getenv.side_effect = getenv_side_effect
            EmailNotification.configure_email(mock_app)

            assert mock_app.config['MAIL_SERVER'] == 'smtp.gmail.com'
            assert mock_app.config['MAIL_PORT'] == 587
            assert mock_app.config['MAIL_USE_TLS'] is True

    def test_get_property_info(self):
        """Test getting property information"""
        mock_mail = Mock()
        email_notification = EmailNotification(mock_mail)

        property_info = email_notification._get_property_info()

        assert property_info['name'] == '17 @ Peppertree'
        assert property_info['address'] == '17 Peperboom Crescent, Vredekloof, Brackenfell, 7560'
        assert property_info['phone'] == '063 630 7345'

    def test_send_booking_confirmation_success(self, test_app):
        """Test successful booking confirmation email"""
        with test_app.app_context():
            mock_mail = Mock()
            email_notification = EmailNotification(mock_mail)

            # Create test booking
            booking = BookingRequest(
                id=123,
                checkin_date=date(2024, 12, 25),
                checkout_date=date(2024, 12, 28),
                guests=2,
                guest_name="John Doe",
                email="john@example.com",
                special_requests="Ground floor please"
            )

            result = email_notification.send_booking_confirmation(booking)

            assert result is True
            mock_mail.send.assert_called_once()

            # Verify message content
            sent_message = mock_mail.send.call_args[0][0]
            assert sent_message.subject == "Booking Request Confirmation - 17 @ Peppertree"
            assert sent_message.recipients == ['john@example.com']
            assert "Dear John Doe" in sent_message.body
            assert "December 25, 2024" in sent_message.body
            assert "Ground floor please" in sent_message.body

    def test_send_booking_confirmation_exception_handling(self, test_app):
        """Test booking confirmation email exception handling"""
        with test_app.app_context():
            mock_mail = Mock()
            mock_mail.send.side_effect = Exception("SMTP error")
            email_notification = EmailNotification(mock_mail)

            booking = BookingRequest(
                id=789,
                checkin_date=date(2024, 6, 15),
                checkout_date=date(2024, 6, 18),
                guests=1,
                guest_name="Test User",
                email="test@example.com"
            )

            result = email_notification.send_booking_confirmation(booking)

            assert result is False

    def test_send_status_update_approved(self, test_app):
        """Test sending booking status update email for approved booking"""
        with test_app.app_context():
            mock_mail = Mock()
            email_notification = EmailNotification(mock_mail)

            booking = BookingRequest(
                id=123,
                checkin_date=date(2024, 12, 25),
                checkout_date=date(2024, 12, 28),
                guests=2,
                guest_name="John Doe",
                email="john@example.com",
                status="confirmed"
            )

            result = email_notification.send_status_update_email(booking)

            assert result is True
            mock_mail.send.assert_called_once()

            sent_message = mock_mail.send.call_args[0][0]
            assert "Booking Update - 17 @ Peppertree (ID: 123)" in sent_message.subject
            assert sent_message.recipients == ['john@example.com']
            assert "CONFIRMED! We're excited to welcome you." in sent_message.body

    def test_send_status_update_exception_handling(self, test_app):
        """Test status update email exception handling"""
        with test_app.app_context():
            mock_mail = Mock()
            mock_mail.send.side_effect = Exception("Email delivery failed")
            email_notification = EmailNotification(mock_mail)

            booking = BookingRequest(
                id=789,
                checkin_date=date(2024, 6, 15),
                checkout_date=date(2024, 6, 18),
                guests=1,
                guest_name="Test User",
                email="test@example.com",
                status="approved"
            )

            result = email_notification.send_status_update_email(booking)

            assert result is False

    def test_send_owner_notification_success(self, test_app):
        """Test successful owner notification email"""
        with test_app.app_context():
            mock_mail = Mock()
            email_notification = EmailNotification(mock_mail)

            booking = BookingRequest(
                id=123,
                checkin_date=date(2024, 12, 25),
                checkout_date=date(2024, 12, 28),
                guests=2,
                guest_name="John Doe",
                email="john@example.com",
                phone="123-456-7890",
                special_requests="Early check-in"
            )
            booking.created_at = datetime(2024, 12, 1, 10, 30, 0)

            with patch('os.getenv', return_value='owner@peppertree.com'):
                result = email_notification.send_owner_notification(booking)

            assert result is True
            mock_mail.send.assert_called_once()

            sent_message = mock_mail.send.call_args[0][0]
            assert sent_message.subject == "New Booking Request - John Doe"
            assert sent_message.recipients == ['owner@peppertree.com']
            assert "- Name: John Doe" in sent_message.body

    def test_send_owner_notification_no_owner_email(self, test_app):
        """Test owner notification when owner email is not configured"""
        with test_app.app_context():
            mock_mail = Mock()
            email_notification = EmailNotification(mock_mail)

            booking = BookingRequest(
                id=123,
                guest_name="Test User",
                email="test@example.com"
            )

            with patch('os.getenv', return_value=None):
                result = email_notification.send_owner_notification(booking)

            assert result is False
            mock_mail.send.assert_not_called()

    def test_send_owner_notification_exception_handling(self, test_app):
        """Test owner notification email exception handling"""
        with test_app.app_context():
            mock_mail = Mock()
            mock_mail.send.side_effect = Exception("Email sending failed")
            email_notification = EmailNotification(mock_mail)

            booking = BookingRequest(
                id=123,
                guest_name="Test User",
                email="test@example.com"
            )

            with patch('os.getenv', return_value='owner@peppertree.com'):
                result = email_notification.send_owner_notification(booking)

            assert result is False

    def test_send_custom_email_without_booking(self, test_app):
        """Test sending custom email without booking context"""
        with test_app.app_context():
            mock_mail = Mock()
            email_notification = EmailNotification(mock_mail)

            result = email_notification.send_custom_email(
                recipient="customer@example.com",
                subject="Custom Message",
                message="This is a custom message for you."
            )

            assert result is True
            mock_mail.send.assert_called_once()

            # Verify message content
            sent_message = mock_mail.send.call_args[0][0]
            assert sent_message.subject == "Custom Message"
            assert sent_message.recipients == ['customer@example.com']
            assert "Dear Guest" in sent_message.body
            assert "This is a custom message for you." in sent_message.body
            assert "17 @ Peppertree" in sent_message.body
            assert "Booking Reference:" not in sent_message.body  # No booking context

    def test_send_custom_email_with_booking(self, test_app):
        """Test sending custom email with booking context"""
        with test_app.app_context():
            mock_mail = Mock()
            email_notification = EmailNotification(mock_mail)

            booking = BookingRequest(
                id=456,
                checkin_date=date(2024, 7, 10),
                checkout_date=date(2024, 7, 13),
                guests=1,
                guest_name="Jane Smith",
                email="jane@example.com"
            )

            result = email_notification.send_custom_email(
                recipient="jane@example.com",
                subject="Special Offer",
                message="We have a special discount for your upcoming stay!",
                booking=booking
            )

            assert result is True
            mock_mail.send.assert_called_once()

            # Verify message content
            sent_message = mock_mail.send.call_args[0][0]
            assert sent_message.subject == "Special Offer"
            assert sent_message.recipients == ['jane@example.com']
            assert "Dear Jane Smith" in sent_message.body  # Uses booking name
            assert "We have a special discount for your upcoming stay!" in sent_message.body
            assert "Booking Reference: 456" in sent_message.body  # Includes booking ID

    def test_send_custom_email_exception_handling(self, test_app):
        """Test custom email exception handling"""
        with test_app.app_context():
            mock_mail = Mock()
            mock_mail.send.side_effect = Exception("SMTP connection failed")
            email_notification = EmailNotification(mock_mail)

            result = email_notification.send_custom_email(
                recipient="test@example.com",
                subject="Test Subject",
                message="Test message"
            )

            assert result is False