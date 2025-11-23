from flask_mail import Message
from flask import current_app
import os


class EmailNotification:
    """Handles all email notifications for the Peppertree booking system"""
    
    def __init__(self, mail_service):
        self.mail = mail_service
    
    @staticmethod
    def configure_email(app):
        """Configure email settings for the Flask app"""
        app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
        app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
        app.config['MAIL_USE_TLS'] = True
        app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
        app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
        app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')
        
        # Debug logging
        app.logger.info(f"Email configured - Server: {app.config['MAIL_SERVER']}, "
                       f"Username: {app.config['MAIL_USERNAME']}, "
                       f"Sender: {app.config['MAIL_DEFAULT_SENDER']}")
        
    def _get_property_info(self):
        """Returns property information for email templates"""
        return {
            'name': '17 @ Peppertree',
            'address': '17 Peperboom Crescent, Vredekloof, Brackenfell, 7560',
            'phone': '063 630 7345'
        }
    
    def send_booking_confirmation(self, booking):
        """Send confirmation email to guest when booking is submitted"""
        try:
            property_info = self._get_property_info()
            subject = f"Booking Request Confirmation - {property_info['name']}"
            
            body = f"""Dear {booking.guest_name},

Thank you for your booking request at {property_info['name']}!

Booking Details:
- Check-in: {booking.checkin_date.strftime('%B %d, %Y')}
- Check-out: {booking.checkout_date.strftime('%B %d, %Y')}
- Guests: {booking.guests}
- Special Requests: {booking.special_requests or 'None'}

Your booking request (ID: {booking.id}) has been received and is currently being reviewed. 
We will contact you within 24 hours to confirm your reservation.

If you have any questions, please contact us at {property_info['phone']}.

Best regards,
The Team at {property_info['name']}
{property_info['address']}
"""
            
            msg = Message(
                subject=subject,
                sender=current_app.config['MAIL_DEFAULT_SENDER'],
                recipients=[booking.email],
                body=body
            )
            
            self.mail.send(msg)
            return True
            
        except Exception as e:
            current_app.logger.error(f"Error sending confirmation email: {e}")
            import traceback
            current_app.logger.error(traceback.format_exc())
            return False
    
    def send_owner_notification(self, booking):
        """Send notification email to property owner when new booking is submitted"""
        try:
            owner_email = os.getenv('OWNER_EMAIL')
            if not owner_email:
                current_app.logger.warning("Owner email not configured")
                return False
                
            property_info = self._get_property_info()
            subject = f"New Booking Request - {booking.guest_name}"
            
            body = f"""New booking request received for {property_info['name']}:

Guest Information:
- Name: {booking.guest_name}
- Email: {booking.email}
- Phone: {booking.phone}

Booking Details:
- Check-in: {booking.checkin_date.strftime('%B %d, %Y')}
- Check-out: {booking.checkout_date.strftime('%B %d, %Y')}
- Guests: {booking.guests}
- Special Requests: {booking.special_requests or 'None'}

Booking ID: {booking.id}
Submitted: {booking.created_at.strftime('%B %d, %Y at %I:%M %p')}

Please review and respond to this booking request.
"""
            
            msg = Message(
                subject=subject,
                sender=current_app.config['MAIL_DEFAULT_SENDER'],
                recipients=[owner_email],
                body=body
            )
            
            self.mail.send(msg)
            return True
            
        except Exception as e:
            current_app.logger.error(f"Error sending owner notification: {e}")
            return False
    
    def send_status_update_email(self, booking):
        """Send status update email to guest when booking status changes"""
        try:
            property_info = self._get_property_info()
            subject = f"Booking Update - {property_info['name']} (ID: {booking.id})"
            
            if booking.status == 'confirmed':
                status_message = "CONFIRMED! We're excited to welcome you."
                additional_info = f"""Please note the following for your stay:
- Check-in time: 2:00 PM - 7:00 PM
- Check-out time: 10:00 AM
- Address: {property_info['address']}
- Contact: {property_info['phone']}

We look forward to hosting you!"""
            else:
                status_message = "We regret to inform you that your booking request could not be confirmed."
                additional_info = "Please feel free to contact us for alternative dates or if you have any questions."
            
            body = f"""Dear {booking.guest_name},

Your booking request for {property_info['name']} has been {booking.status.upper()}.

{status_message}

Booking Details:
- Check-in: {booking.checkin_date.strftime('%B %d, %Y')}
- Check-out: {booking.checkout_date.strftime('%B %d, %Y')}
- Guests: {booking.guests}

{additional_info}

Best regards,
The Team at {property_info['name']}
Phone: {property_info['phone']}
"""
            
            msg = Message(
                subject=subject,
                sender=current_app.config['MAIL_DEFAULT_SENDER'],
                recipients=[booking.email],
                body=body
            )
            
            self.mail.send(msg)
            return True
            
        except Exception as e:
            current_app.logger.error(f"Error sending status update email: {e}")
            return False
    
    def send_custom_email(self, recipient, subject, message, booking=None):
        """Send a custom email with optional booking context"""
        try:
            property_info = self._get_property_info()
            
            body = f"""Dear {"Guest" if not booking else booking.guest_name},

{message}

Best regards,
The Team at {property_info['name']}
Phone: {property_info['phone']}
"""
            
            if booking:
                body += f"\nBooking Reference: {booking.id}"
            
            msg = Message(
                subject=subject,
                sender=current_app.config['MAIL_DEFAULT_SENDER'],
                recipients=[recipient],
                body=body
            )
            
            self.mail.send(msg)
            return True
            
        except Exception as e:
            current_app.logger.error(f"Error sending custom email: {e}")
            return False