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
        console.log('Fetched unavailable dates:', data.unavailable_dates);
        const unavailableSet = new Set(data.unavailable_dates);
        setUnavailableDates(unavailableSet);
        console.log('Unavailable dates Set:', unavailableSet);
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
    return `${year}/${month}/${day}`;
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
    // Check unavailable first - it should override selection
    if (isDateUnavailable(dateStr)) {
      console.log(`Date ${dateStr} is UNAVAILABLE`);
      return 'unavailable';
    }
    if (isCheckInDate(dateStr)) return 'checkin';
    if (isCheckOutDate(dateStr)) return 'checkout';
    if (isDateInRange(dateStr)) return 'in-range';
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
      days.push(<div key={`empty-${i}`} className="aspect-square flex flex-col items-center justify-center cursor-default bg-transparent"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateStr = formatDate(date);
      const disabled = isDateDisabled(date);
      const status = getDateStatus(dateStr);

      let dayClass = 'aspect-square flex flex-col items-center justify-center cursor-pointer transition-all duration-200 font-medium relative rounded-lg border-2 border-transparent min-h-[2.75rem] sm:min-h-11';
      let title = 'Available - Click to select';
      let content = day;

      if (disabled && status !== 'unavailable') {
        // Only apply gray style to past dates, not unavailable (booked) dates
        dayClass += ' bg-gray-100 text-gray-400 cursor-not-allowed';
        title = 'Past date';
      } else {
        switch (status) {
          case 'checkin':
            dayClass += ' bg-blue-100 text-blue-800 border-blue-500 font-bold shadow-md';
            title = 'Check-in date';
            content = (
              <div className="flex flex-col items-center">
                <span className="text-sm sm:text-base font-bold">{day}</span>
                <span className="text-[0.625rem] sm:text-xs font-semibold tracking-wider">IN</span>
              </div>
            );
            break;
          case 'checkout':
            dayClass += ' bg-orange-100 text-orange-800 border-orange-500 font-bold shadow-md';
            title = 'Check-out date';
            content = (
              <div className="flex flex-col items-center">
                <span className="text-sm sm:text-base font-bold">{day}</span>
                <span className="text-[0.625rem] sm:text-xs font-semibold tracking-wider">OUT</span>
              </div>
            );
            break;
          case 'in-range':
            dayClass += ' bg-gradient-to-br from-blue-50 to-orange-50 text-dark-brown border-accent';
            title = 'Selected stay period';
            break;
          case 'unavailable':
            dayClass += ' bg-red-100 text-red-800 border-red-400 cursor-not-allowed';
            title = 'Already booked - Not available';
            break;
          default:
            dayClass += ' bg-green-50 text-green-800 border-green-500 hover:bg-green-100 hover:scale-105 hover:shadow-md';
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
    <div className="bg-white/95 rounded-2xl p-4 sm:p-8 my-8 shadow-brown border border-primary/20">
      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 pb-4 border-b-2 border-secondary">
        <h4 className="text-dark-brown m-0 text-2xl font-display font-semibold">Select Your Dates</h4>
        <div className="flex items-center gap-4 mt-4 lg:mt-0">
          <button
            type="button"
            className="bg-secondary border-none w-10 h-10 rounded-full cursor-pointer transition-all duration-300 flex items-center justify-center text-dark-brown hover:bg-accent hover:text-white hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => navigateMonth(-1)}
            disabled={loading}
            data-testid="prev-month"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <span className="font-semibold text-dark-brown text-xl min-w-45 text-center font-display">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button
            type="button"
            className="bg-secondary border-none w-10 h-10 rounded-full cursor-pointer transition-all duration-300 flex items-center justify-center text-dark-brown hover:bg-accent hover:text-white hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => navigateMonth(1)}
            disabled={loading}
            data-testid="next-month"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <div className="flex justify-center gap-3 sm:gap-6 mb-6 flex-wrap px-2">
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-dark-brown">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-50 border-2 border-green-500 flex-shrink-0"></div>
          <span className="whitespace-nowrap">Available</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-dark-brown">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-100 border-2 border-red-400 flex-shrink-0"></div>
          <span className="whitespace-nowrap">Unavailable</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-dark-brown">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-blue-100 border-2 border-blue-500 flex-shrink-0"></div>
          <span className="whitespace-nowrap">Check-in</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-dark-brown">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-orange-100 border-2 border-orange-500 flex-shrink-0"></div>
          <span className="whitespace-nowrap">Check-out</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-dark-brown">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gradient-to-br from-blue-50 to-orange-50 border-2 border-accent flex-shrink-0"></div>
          <span className="whitespace-nowrap">Your Stay</span>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {dayNames.map(day => (
            <div key={day} className="py-2 sm:py-3 px-1 sm:px-2 text-center font-semibold text-dark-brown bg-secondary rounded-md text-xs sm:text-sm">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2 bg-primary/10 border-radius rounded-xl p-1 sm:p-2">
          {loading ? (
            <div className="col-span-7 flex flex-col items-center justify-center py-12 gap-4 text-dark-brown">
              <i className="fas fa-spinner fa-spin text-2xl text-accent"></i>
              <span>Loading availability...</span>
            </div>
          ) : (
            renderCalendarDays()
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-gold/10 rounded-xl text-center">
        <p className="text-dark-brown m-0 text-sm">
          <i className="fas fa-info-circle text-accent mr-2"></i>
          <strong>How to select dates:</strong> Click on your desired check-in date first, then click on your check-out date.
          Selected dates will automatically update the form fields above.
        </p>
        {selectedDates.checkin && !selectedDates.checkout && (
          <div className="mt-4 p-3 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-md font-medium text-blue-800 animate-pulse-soft">
            <i className="fas fa-arrow-right text-blue-500 mr-2"></i>
            Check-in selected ({new Date(selectedDates.checkin).toLocaleDateString()}).
            Now click on your check-out date.
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityCalendar;