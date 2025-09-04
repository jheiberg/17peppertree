import React, { useState } from 'react';
import AvailabilityCalendar from '../AvailabilityCalendar/AvailabilityCalendar';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    checkin: '',
    checkout: '',
    guests: '2',
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  // Format date input to yyyy/mm/dd and validate
  const formatDateInput = (value) => {
    // Remove any non-numeric characters except forward slashes
    let cleaned = value.replace(/[^\d/]/g, '');
    
    // Add forward slashes automatically
    if (cleaned.length >= 5) {
      cleaned = cleaned.slice(0, 4) + '/' + cleaned.slice(4);
    }
    if (cleaned.length >= 8) {
      cleaned = cleaned.slice(0, 7) + '/' + cleaned.slice(7);
    }
    
    // Limit to 10 characters (yyyy/mm/dd)
    return cleaned.slice(0, 10);
  };

  // Validate yyyy/mm/dd format
  const isValidDateFormat = (dateStr) => {
    const regex = /^\d{4}\/\d{2}\/\d{2}$/;
    if (!regex.test(dateStr)) return false;
    
    const [year, month, day] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
  };

  // Convert yyyy/mm/dd to Date object
  const dateStringToDate = (dateStr) => {
    if (!isValidDateFormat(dateStr)) return null;
    const [year, month, day] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle date input changes with yyyy/mm/dd formatting
    if (name === 'checkin') {
      const formattedValue = formatDateInput(value);
      const checkinDate = dateStringToDate(formattedValue);
      const checkoutDate = formData.checkout ? dateStringToDate(formData.checkout) : null;
      
      setFormData({
        ...formData,
        checkin: formattedValue,
        // Clear checkout if new checkin is after current checkout
        checkout: (checkoutDate && checkinDate && checkinDate >= checkoutDate) ? '' : formData.checkout
      });
    } else if (name === 'checkout') {
      const formattedValue = formatDateInput(value);
      const checkinDate = formData.checkin ? dateStringToDate(formData.checkin) : null;
      const checkoutDate = dateStringToDate(formattedValue);
      
      // Only update if checkin exists and checkout is after checkin
      if (checkinDate && checkoutDate && checkoutDate > checkinDate) {
        setFormData({
          ...formData,
          checkout: formattedValue
        });
      } else if (!checkoutDate && formattedValue.length <= 10) {
        // Allow typing while formatting
        setFormData({
          ...formData,
          checkout: formattedValue
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [showCalendar, setShowCalendar] = useState(false);

  const handleDateSelect = (dateStr, type) => {
    if (type === 'checkin') {
      // Setting check-in date, clear checkout if it exists
      setFormData({
        ...formData,
        checkin: dateStr,
        checkout: ''
      });
    } else if (type === 'checkout') {
      // Setting check-out date
      setFormData({
        ...formData,
        checkout: dateStr
      });
    }
  };

  const getMinDate = () => {
    const today = new Date();
    // Create a clean date object to avoid timezone issues
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const formatDateForInput = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');
    setMessageType('');

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    console.log('Submitting to API URL:', apiUrl);
    console.log('Form data:', formData);

    try {
      const response = await fetch(`${apiUrl}/booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', [...response.headers.entries()]);

      const data = await response.json();

      if (response.ok) {
        setSubmitMessage('Thank you for your booking request! We will contact you within 24 hours to confirm your reservation.');
        setMessageType('success');
        setFormData({
          checkin: '',
          checkout: '',
          guests: '2',
          name: '',
          email: '',
          phone: '',
          message: ''
        });
      } else {
        console.error('API Error Response:', data);
        setSubmitMessage(data.error || 'There was an error submitting your request. Please try again.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Network/Fetch Error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setSubmitMessage(`Cannot connect to server at ${apiUrl}. Please check if the backend is running and accessible from this device.`);
      } else {
        setSubmitMessage('There was an error submitting your request. Please check your connection and try again.');
      }
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="contact">
      <div className="container">
        <div className="section-header">
          <h2>Book Your Stay</h2>
          <p>Contact us to reserve your perfect getaway</p>
        </div>
        <div className="contact-content">
          <div className="contact-info">
            <div className="contact-card">
              <div className="contact-icon">
                <i className="fas fa-phone"></i>
              </div>
              <div>
                <h3>Phone</h3>
                <p>063 630 7345</p>
              </div>
            </div>
            <div className="pricing-info">
              <h3>Rates</h3>
              <div className="price-display">
                <span className="price-large">R850</span>
                <span className="price-small">per night for 2 guests</span>
              </div>
            </div>
            <div className="rating-display">
              <div className="stars-large">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
              </div>
              <p>Rated 4.9/5 by 68 guests</p>
            </div>
          </div>
          <div className="booking-form">
            <h3>Reserve Your Stay</h3>
            <p className="form-subtitle">Create unforgettable memories at 17 @ Peppertree</p>
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h4 className="section-title">Stay Details</h4>
                
                <div className="calendar-toggle">
                  <button 
                    type="button" 
                    className="calendar-toggle-btn"
                    onClick={() => setShowCalendar(!showCalendar)}
                  >
                    <i className={`fas fa-calendar-alt`}></i>
                    {showCalendar ? 'Hide Calendar' : 'Show Availability Calendar'}
                  </button>
                </div>

                {showCalendar && (
                  <AvailabilityCalendar
                    onDateSelect={handleDateSelect}
                    selectedDates={{
                      checkin: formData.checkin,
                      checkout: formData.checkout
                    }}
                    minDate={getMinDate()}
                  />
                )}

                {formData.checkin && formData.checkout && (
                  <div className="date-selection-summary">
                    <i className="fas fa-calendar-check"></i>
                    <span>
                      <strong>Selected dates:</strong> {' '}
                      {new Date(formData.checkin).toLocaleDateString()} to {' '}
                      {new Date(formData.checkout).toLocaleDateString()} {' '}
                      ({Math.ceil((new Date(formData.checkout) - new Date(formData.checkin)) / (1000 * 60 * 60 * 24))} nights)
                    </span>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="checkin">Check-in Date</label>
                    <input 
                      type="text" 
                      id="checkin" 
                      name="checkin" 
                      value={formData.checkin}
                      onChange={handleChange}
                      placeholder="YYYY/MM/DD"
                      maxLength="10"
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="checkout">Check-out Date</label>
                    <input 
                      type="text" 
                      id="checkout" 
                      name="checkout" 
                      value={formData.checkout}
                      onChange={handleChange}
                      placeholder="YYYY/MM/DD"
                      maxLength="10"
                      required 
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="guests">Number of Guests</label>
                  <select 
                    id="guests" 
                    name="guests" 
                    value={formData.guests}
                    onChange={handleChange}
                    required
                  >
                    <option value="1">1 Guest</option>
                    <option value="2">2 Guests (Maximum)</option>
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h4 className="section-title">Guest Information</h4>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required 
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      name="phone" 
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Your contact number"
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4 className="section-title">Special Requests</h4>
                <div className="form-group">
                  <label htmlFor="message">Additional Information</label>
                  <textarea 
                    id="message" 
                    name="message" 
                    rows="4" 
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Let us know about any special requirements, dietary needs, or questions you might have..."
                  ></textarea>
                </div>
              </div>

              {submitMessage && (
                <div className={`form-message ${messageType}`}>
                  {submitMessage}
                </div>
              )}
              <button type="submit" className="submit-button" disabled={isSubmitting}>
                <i className={isSubmitting ? "fas fa-spinner fa-spin" : "fas fa-paper-plane"}></i>
                {isSubmitting ? 'Sending Request...' : 'Send Booking Request'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;