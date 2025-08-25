import React, { useState } from 'react';
import AvailabilityCalendar from './AvailabilityCalendar';

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle date input changes and validate
    if (name === 'checkin') {
      setFormData({
        ...formData,
        checkin: value,
        // Clear checkout if new checkin is after current checkout
        checkout: formData.checkout && value >= formData.checkout ? '' : formData.checkout
      });
    } else if (name === 'checkout') {
      // Only allow checkout if checkin is set and checkout is after checkin
      if (formData.checkin && value > formData.checkin) {
        setFormData({
          ...formData,
          checkout: value
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

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

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
        setSubmitMessage(data.error || 'There was an error submitting your request. Please try again.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      setSubmitMessage('There was an error submitting your request. Please check your connection and try again.');
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
            {submitMessage && (
              <div className={`form-message ${messageType}`}>
                {submitMessage}
              </div>
            )}
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
                      type="date" 
                      id="checkin" 
                      name="checkin" 
                      value={formData.checkin}
                      onChange={handleChange}
                      min={formatDateForInput()}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="checkout">Check-out Date</label>
                    <input 
                      type="date" 
                      id="checkout" 
                      name="checkout" 
                      value={formData.checkout}
                      onChange={handleChange}
                      min={formData.checkin || formatDateForInput()}
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