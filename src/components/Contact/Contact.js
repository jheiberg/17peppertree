import React, { useState } from 'react';
import AvailabilityCalendar from '../AvailabilityCalendar/AvailabilityCalendar';

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

    // Smart year completion - if user types 2-3 digits, assume current decade
    const currentYear = new Date().getFullYear();
    if (cleaned.length === 2 && parseInt(cleaned) >= 24) {
      cleaned = '20' + cleaned;
    } else if (cleaned.length === 3) {
      cleaned = currentYear.toString().slice(0, 1) + cleaned;
    }

    // Add forward slashes automatically as user types
    if (cleaned.length > 4 && cleaned.indexOf('/') === -1) {
      cleaned = cleaned.slice(0, 4) + '/' + cleaned.slice(4);
    }
    if (cleaned.length > 7 && cleaned.split('/').length === 2) {
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

      // Always allow typing and formatting - validate on submit
      setFormData({
        ...formData,
        checkout: formattedValue
      });

      // Show warning if checkout is before checkin (but don't prevent typing)
      if (checkinDate && checkoutDate && checkoutDate <= checkinDate) {
        console.warn('Check-out date must be after check-in date');
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


  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate dates before submitting
    if (!isValidDateFormat(formData.checkin)) {
      setSubmitMessage('Please enter a valid check-in date in YYYY/MM/DD format.');
      setMessageType('error');
      return;
    }

    if (!isValidDateFormat(formData.checkout)) {
      setSubmitMessage('Please enter a valid check-out date in YYYY/MM/DD format.');
      setMessageType('error');
      return;
    }

    const checkinDate = dateStringToDate(formData.checkin);
    const checkoutDate = dateStringToDate(formData.checkout);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkinDate < today) {
      setSubmitMessage('Check-in date cannot be in the past.');
      setMessageType('error');
      return;
    }

    if (checkoutDate <= checkinDate) {
      setSubmitMessage('Check-out date must be after check-in date.');
      setMessageType('error');
      return;
    }

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
    <section id="contact" className="section-padding bg-gradient-to-br from-primary to-dark-brown text-white">
      <div className="container-custom">
        <div className="section-header">
          <h2 className="section-title text-white">Book Your Stay</h2>
          <p className="section-subtitle text-white">Contact us to reserve your perfect getaway</p>
        </div>
        <div className="grid lg:grid-cols-5 grid-cols-1 gap-16">
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="flex items-center gap-6 bg-white/10 backdrop-blur-custom p-8 rounded-2xl">
              <div className="w-15 h-15 bg-gold rounded-full flex items-center justify-center">
                <i className="fas fa-phone text-xl text-white"></i>
              </div>
              <div>
                <h3 className="text-white text-lg font-display mb-2">Phone</h3>
                <p className="text-cream mb-2">063 630 7345</p>
                <a
                  href="https://wa.me/27636307345?text=Hi!%20I%27d%20like%20to%20inquire%20about%20booking%20at%2017%20%40%20Peppertree"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors duration-200 text-sm font-medium"
                >
                  <i className="fab fa-whatsapp text-lg"></i>
                  WhatsApp us
                </a>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-custom p-8 rounded-2xl text-center">
              <h3 className="text-white text-lg font-display mb-4">Rates</h3>
              <div className="flex flex-col items-center gap-2">
                <span className="text-5xl font-bold text-gold">R850</span>
                <span className="text-cream">per night for 2 guests</span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-custom p-8 rounded-2xl text-center">
              <div className="text-gold text-2xl mb-4">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
              </div>
              <p className="text-cream">Rated 4.9/5 by 68 guests</p>
            </div>
          </div>
          <div className="lg:col-span-3 bg-form-gradient p-12 rounded-3xl shadow-brown border-2 border-secondary/40 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold via-accent to-gold"></div>
            <h3 className="text-primary mb-10 text-center text-3xl relative font-display">
              Reserve Your Stay
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-15 h-0.5 bg-gradient-to-r from-accent to-gold rounded-full"></div>
            </h3>
            <p className="text-center text-text-color italic mb-10 text-lg opacity-80">
              Create unforgettable memories at 17 @ Peppertree
            </p>
            <form onSubmit={handleSubmit}>
              <div className="mb-10 p-6 bg-white/60 rounded-2xl border-l-4 border-accent">
                <h4 className="text-primary text-xl mb-6 font-semibold flex items-center gap-2 font-display">
                  <div className="w-2 h-2 bg-gold rounded-full"></div>
                  Stay Details
                </h4>

                <div className="mb-6 text-center">
                  <button
                    type="button"
                    className="btn-secondary inline-flex items-center gap-2"
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

                {formData.checkin && formData.checkout && isValidDateFormat(formData.checkin) && isValidDateFormat(formData.checkout) && (
                  <div className="my-6 p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500 rounded-xl flex items-center gap-3 text-green-700 font-medium">
                    <i className="fas fa-calendar-check text-green-500 text-xl"></i>
                    <span>
                      <strong>Selected dates:</strong> {' '}
                      {dateStringToDate(formData.checkin).toLocaleDateString()} to {' '}
                      {dateStringToDate(formData.checkout).toLocaleDateString()} {' '}
                      ({Math.ceil((dateStringToDate(formData.checkout) - dateStringToDate(formData.checkin)) / (1000 * 60 * 60 * 24))} nights)
                    </span>
                  </div>
                )}

                <div className="grid lg:grid-cols-2 grid-cols-1 gap-6 mb-4">
                  <div className="mb-8">
                    <label htmlFor="checkin" className="form-label">Check-in Date</label>
                    <div className="relative">
                      <input
                        type="text"
                        id="checkin"
                        name="checkin"
                        value={formData.checkin}
                        onChange={handleChange}
                        placeholder="YYYY/MM/DD"
                        maxLength="10"
                        required
                        className={`form-input pr-10 ${
                          formData.checkin && !isValidDateFormat(formData.checkin)
                            ? 'border-red-400 bg-red-50'
                            : formData.checkin && isValidDateFormat(formData.checkin)
                            ? 'border-green-400 bg-green-50'
                            : ''
                        }`}
                      />
                      <i className="fas fa-calendar absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                    {formData.checkin && !isValidDateFormat(formData.checkin) && (
                      <p className="text-red-600 text-sm mt-2">Please enter date as YYYY/MM/DD</p>
                    )}
                  </div>
                  <div className="mb-8">
                    <label htmlFor="checkout" className="form-label">Check-out Date</label>
                    <div className="relative">
                      <input
                        type="text"
                        id="checkout"
                        name="checkout"
                        value={formData.checkout}
                        onChange={handleChange}
                        placeholder="YYYY/MM/DD"
                        maxLength="10"
                        required
                        className={`form-input pr-10 ${
                          formData.checkout && !isValidDateFormat(formData.checkout)
                            ? 'border-red-400 bg-red-50'
                            : formData.checkout && isValidDateFormat(formData.checkout)
                            ? 'border-green-400 bg-green-50'
                            : ''
                        }`}
                      />
                      <i className="fas fa-calendar absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                    {formData.checkout && !isValidDateFormat(formData.checkout) && (
                      <p className="text-red-600 text-sm mt-2">Please enter date as YYYY/MM/DD</p>
                    )}
                    {formData.checkout && formData.checkin &&
                     isValidDateFormat(formData.checkout) && isValidDateFormat(formData.checkin) &&
                     dateStringToDate(formData.checkout) <= dateStringToDate(formData.checkin) && (
                      <p className="text-red-600 text-sm mt-2">Check-out must be after check-in date</p>
                    )}
                  </div>
                </div>
                <div className="mb-8">
                  <label htmlFor="guests" className="form-label">Number of Guests</label>
                  <select
                    id="guests"
                    name="guests"
                    value={formData.guests}
                    onChange={handleChange}
                    required
                    className="form-input"
                  >
                    <option value="1">1 Guest</option>
                    <option value="2">2 Guests (Maximum)</option>
                  </select>
                </div>
              </div>

              <div className="mb-10 p-6 bg-white/60 rounded-2xl border-l-4 border-accent">
                <h4 className="text-primary text-xl mb-6 font-semibold flex items-center gap-2 font-display">
                  <div className="w-2 h-2 bg-gold rounded-full"></div>
                  Guest Information
                </h4>
                <div className="mb-8">
                  <label htmlFor="name" className="form-label">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    className="form-input"
                  />
                </div>
                <div className="grid lg:grid-cols-2 grid-cols-1 gap-6 mb-4">
                  <div className="mb-8">
                    <label htmlFor="email" className="form-label">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                      required
                      className="form-input"
                    />
                  </div>
                  <div className="mb-8">
                    <label htmlFor="phone" className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Your contact number"
                      required
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-10 p-6 bg-white/60 rounded-2xl border-l-4 border-accent">
                <h4 className="text-primary text-xl mb-6 font-semibold flex items-center gap-2 font-display">
                  <div className="w-2 h-2 bg-gold rounded-full"></div>
                  Special Requests
                </h4>
                <div className="mb-8">
                  <label htmlFor="message" className="form-label">Additional Information</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="4"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Let us know about any special requirements, dietary needs, or questions you might have..."
                    className="form-input resize-y"
                  ></textarea>
                </div>
              </div>

              {submitMessage && (
                <div className={`p-4 rounded-xl mb-8 font-medium text-center ${
                  messageType === 'success'
                    ? 'bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-300 text-green-800'
                    : 'bg-gradient-to-br from-red-100 to-red-200 border-2 border-red-300 text-red-800'
                }`}>
                  {submitMessage}
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-gradient-to-r from-primary via-accent to-gold text-white border-none py-6 px-8 text-lg rounded-3xl cursor-pointer transition-all duration-300 font-semibold uppercase tracking-wider relative overflow-hidden mt-4 font-display ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-brown'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full transition-transform duration-600 hover:translate-x-full"></div>
                <i className={isSubmitting ? "fas fa-spinner fa-spin mr-3" : "fas fa-paper-plane mr-3"}></i>
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