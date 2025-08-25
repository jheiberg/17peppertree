import React, { useState, useEffect } from 'react';

const AvailabilityCalendar = ({ onDateSelect, selectedDates, minDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [unavailableDates, setUnavailableDates] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch availability data from backend
  const fetchAvailability = async (year, month) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/availability?year=${year}&month=${month + 1}`
      );
      if (response.ok) {
        const data = await response.json();
        const unavailableSet = new Set(data.unavailable_dates);
        setUnavailableDates(unavailableSet);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth]);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date) => {
    // Use local date to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isDateUnavailable = (dateStr) => {
    return unavailableDates.has(dateStr);
  };

  const isDateSelected = (dateStr) => {
    return selectedDates.checkin === dateStr || selectedDates.checkout === dateStr;
  };

  const isCheckInDate = (dateStr) => {
    return selectedDates.checkin === dateStr;
  };

  const isCheckOutDate = (dateStr) => {
    return selectedDates.checkout === dateStr;
  };

  const isDateInRange = (dateStr) => {
    if (!selectedDates.checkin || !selectedDates.checkout) return false;
    return dateStr > selectedDates.checkin && dateStr < selectedDates.checkout;
  };

  const getDateStatus = (dateStr) => {
    if (isCheckInDate(dateStr)) return 'checkin';
    if (isCheckOutDate(dateStr)) return 'checkout';
    if (isDateInRange(dateStr)) return 'in-range';
    if (isDateUnavailable(dateStr)) return 'unavailable';
    return 'available';
  };

  const isDateDisabled = (date) => {
    const dateStr = formatDate(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Normalize the date to avoid timezone issues
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    return normalizedDate < today || normalizedDate < minDate || isDateUnavailable(dateStr);
  };

  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return;
    
    const dateStr = formatDate(date);
    
    if (!selectedDates.checkin) {
      // First selection - set as check-in
      onDateSelect(dateStr, 'checkin');
    } else if (!selectedDates.checkout) {
      // Second selection - set as check-out (must be after check-in)
      if (dateStr > selectedDates.checkin) {
        onDateSelect(dateStr, 'checkout');
      } else {
        // If selected date is before check-in, reset and start over
        onDateSelect(dateStr, 'checkin');
      }
    } else {
      // Both dates selected - start over with new check-in
      onDateSelect(dateStr, 'checkin');
    }
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateStr = formatDate(date);
      const disabled = isDateDisabled(date);
      const status = getDateStatus(dateStr);

      let dayClass = 'calendar-day';
      let title = 'Available - Click to select';
      let content = day;

      if (disabled) {
        dayClass += ' disabled';
        title = 'Past date or unavailable';
      } else {
        switch (status) {
          case 'checkin':
            dayClass += ' selected checkin';
            title = 'Check-in date';
            content = (
              <div>
                <span className="day-number">{day}</span>
                <span className="day-label">IN</span>
              </div>
            );
            break;
          case 'checkout':
            dayClass += ' selected checkout';
            title = 'Check-out date';
            content = (
              <div>
                <span className="day-number">{day}</span>
                <span className="day-label">OUT</span>
              </div>
            );
            break;
          case 'in-range':
            dayClass += ' in-range';
            title = 'Selected stay period';
            break;
          case 'unavailable':
            dayClass += ' unavailable';
            title = 'Already booked - Not available';
            break;
          default:
            dayClass += ' available';
            title = 'Available - Click to select';
        }
      }

      days.push(
        <div
          key={day}
          className={dayClass}
          onClick={() => handleDateClick(date)}
          title={title}
        >
          {content}
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="availability-calendar">
      <div className="calendar-header">
        <h4>Select Your Dates</h4>
        <div className="calendar-navigation">
          <button
            type="button"
            className="nav-button"
            onClick={() => navigateMonth(-1)}
            disabled={loading}
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <span className="current-month">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button
            type="button"
            className="nav-button"
            onClick={() => navigateMonth(1)}
            disabled={loading}
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color available"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-color unavailable"></div>
          <span>Booked/Unavailable</span>
        </div>
        <div className="legend-item">
          <div className="legend-color checkin"></div>
          <span>Check-in</span>
        </div>
        <div className="legend-item">
          <div className="legend-color checkout"></div>
          <span>Check-out</span>
        </div>
        <div className="legend-item">
          <div className="legend-color in-range"></div>
          <span>Your Stay</span>
        </div>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {dayNames.map(day => (
            <div key={day} className="weekday">
              {day}
            </div>
          ))}
        </div>
        <div className="calendar-days">
          {loading ? (
            <div className="calendar-loading">
              <i className="fas fa-spinner fa-spin"></i>
              <span>Loading availability...</span>
            </div>
          ) : (
            renderCalendarDays()
          )}
        </div>
      </div>

      <div className="calendar-instructions">
        <p>
          <i className="fas fa-info-circle"></i>
          <strong>How to select dates:</strong> Click on your desired check-in date first, then click on your check-out date. 
          Selected dates will automatically update the form fields above.
        </p>
        {selectedDates.checkin && !selectedDates.checkout && (
          <div className="selection-hint">
            <i className="fas fa-arrow-right"></i>
            Check-in selected ({new Date(selectedDates.checkin).toLocaleDateString()}). 
            Now click on your check-out date.
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityCalendar;