import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Contact from './Contact';

// Mock the AvailabilityCalendar component
jest.mock('../AvailabilityCalendar/AvailabilityCalendar', () => {
  return function MockAvailabilityCalendar({ onDateSelect, selectedDates }) {
    return (
      <div data-testid="availability-calendar">
        <button 
          onClick={() => onDateSelect('2024/06/15', 'checkin')}
          data-testid="select-checkin"
        >
          Select Check-in: 2024/06/15
        </button>
        <button 
          onClick={() => onDateSelect('2024/06/18', 'checkout')}
          data-testid="select-checkout"
        >
          Select Check-out: 2024/06/18
        </button>
        <div data-testid="selected-checkin">{selectedDates.checkin}</div>
        <div data-testid="selected-checkout">{selectedDates.checkout}</div>
      </div>
    );
  };
});

// Mock fetch
global.fetch = jest.fn();

describe('Contact Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('Rendering', () => {
    test('renders contact section with correct heading', () => {
      render(<Contact />);
      expect(screen.getByText('Book Your Stay')).toBeInTheDocument();
      expect(screen.getByText('Contact us to reserve your perfect getaway')).toBeInTheDocument();
    });

    test('renders contact information', () => {
      render(<Contact />);
      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('063 630 7345')).toBeInTheDocument();
      expect(screen.getByText('R850')).toBeInTheDocument();
      expect(screen.getByText('per night for 2 guests')).toBeInTheDocument();
      expect(screen.getByText('Rated 4.9/5 by 68 guests')).toBeInTheDocument();
    });

    test('renders booking form with all required fields', () => {
      render(<Contact />);
      
      expect(screen.getByLabelText('Check-in Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Check-out Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Number of Guests')).toBeInTheDocument();
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
      expect(screen.getByLabelText('Additional Information')).toBeInTheDocument();
      expect(screen.getByText('Send Booking Request')).toBeInTheDocument();
    });

    test('renders stars correctly', () => {
      render(<Contact />);
      const stars = document.querySelectorAll('.stars-large .fas.fa-star');
      expect(stars).toHaveLength(5);
    });
  });

  describe('Form Input Handling', () => {
    test('updates form data when typing in text inputs', async () => {
      const user = userEvent.setup();
      render(<Contact />);
      
      const nameInput = screen.getByLabelText('Full Name');
      const emailInput = screen.getByLabelText('Email Address');
      const phoneInput = screen.getByLabelText('Phone Number');
      const messageInput = screen.getByLabelText('Additional Information');
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(phoneInput, '+27123456789');
      await user.type(messageInput, 'Looking forward to our stay!');
      
      expect(nameInput).toHaveValue('John Doe');
      expect(emailInput).toHaveValue('john@example.com');
      expect(phoneInput).toHaveValue('+27123456789');
      expect(messageInput).toHaveValue('Looking forward to our stay!');
    });

    test('updates guest selection', async () => {
      const user = userEvent.setup();
      render(<Contact />);
      
      const guestSelect = screen.getByLabelText('Number of Guests');
      expect(guestSelect).toHaveValue('2');
      
      await user.selectOptions(guestSelect, '1');
      expect(guestSelect).toHaveValue('1');
    });

    test('formats date input correctly', async () => {
      const user = userEvent.setup();
      render(<Contact />);
      
      const checkinInput = screen.getByLabelText('Check-in Date');
      
      // Type digits and verify formatting
      await user.type(checkinInput, '20240615');
      expect(checkinInput).toHaveValue('2024/06/15');
    });

    test('validates date format', () => {
      render(<Contact />);
      
      const checkinInput = screen.getByLabelText('Check-in Date');
      
      // Test invalid format
      fireEvent.change(checkinInput, { target: { value: '2024/13/32' } });
      expect(checkinInput.value).toBe('2024/13/32');
      
      // Test valid format
      fireEvent.change(checkinInput, { target: { value: '2024/06/15' } });
      expect(checkinInput.value).toBe('2024/06/15');
    });

    test('clears checkout when checkin is after current checkout', async () => {
      const user = userEvent.setup();
      render(<Contact />);
      
      const checkinInput = screen.getByLabelText('Check-in Date');
      const checkoutInput = screen.getByLabelText('Check-out Date');
      
      // Set checkout first
      await user.type(checkoutInput, '2024/06/15');
      expect(checkoutInput).toHaveValue('2024/06/15');
      
      // Set checkin after checkout
      await user.clear(checkinInput);
      await user.type(checkinInput, '2024/06/20');
      expect(checkinInput).toHaveValue('2024/06/20');
      expect(checkoutInput).toHaveValue(''); // Should be cleared
    });

    test('handles checkout validation with checkin date', async () => {
      const user = userEvent.setup();
      render(<Contact />);
      
      const checkinInput = screen.getByLabelText('Check-in Date');
      const checkoutInput = screen.getByLabelText('Check-out Date');
      
      // Set checkin first
      await user.type(checkinInput, '2024/06/15');
      expect(checkinInput).toHaveValue('2024/06/15');
      
      // Try to set checkout before checkin (should not update)
      await user.type(checkoutInput, '2024/06/10');
      expect(checkoutInput).toHaveValue('2024/06/10'); // Allows typing while incomplete
      
      // Set valid checkout after checkin
      await user.clear(checkoutInput);
      await user.type(checkoutInput, '2024/06/18');
      expect(checkoutInput).toHaveValue('2024/06/18');
    });
  });

  describe('Calendar Integration', () => {
    test('toggles calendar visibility', async () => {
      const user = userEvent.setup();
      render(<Contact />);
      
      const calendarToggle = screen.getByText('Show Availability Calendar');
      
      // Calendar should not be visible initially
      expect(screen.queryByTestId('availability-calendar')).not.toBeInTheDocument();
      
      // Click to show calendar
      await user.click(calendarToggle);
      expect(screen.getByTestId('availability-calendar')).toBeInTheDocument();
      expect(screen.getByText('Hide Calendar')).toBeInTheDocument();
      
      // Click to hide calendar
      await user.click(screen.getByText('Hide Calendar'));
      expect(screen.queryByTestId('availability-calendar')).not.toBeInTheDocument();
      expect(screen.getByText('Show Availability Calendar')).toBeInTheDocument();
    });

    test('handles date selection from calendar for checkin', async () => {
      const user = userEvent.setup();
      render(<Contact />);
      
      // Show calendar
      await user.click(screen.getByText('Show Availability Calendar'));
      
      const checkinInput = screen.getByLabelText('Check-in Date');
      const checkoutInput = screen.getByLabelText('Check-out Date');
      
      // Set initial checkout date
      await user.type(checkoutInput, '2024/06/20');
      
      // Select checkin from calendar
      await user.click(screen.getByTestId('select-checkin'));
      
      expect(checkinInput).toHaveValue('2024/06/15');
      expect(checkoutInput).toHaveValue(''); // Should be cleared when setting checkin
    });

    test('handles date selection from calendar for checkout', async () => {
      const user = userEvent.setup();
      render(<Contact />);
      
      // Show calendar
      await user.click(screen.getByText('Show Availability Calendar'));
      
      const checkinInput = screen.getByLabelText('Check-in Date');
      const checkoutInput = screen.getByLabelText('Check-out Date');
      
      // Set checkin first
      await user.type(checkinInput, '2024/06/15');
      
      // Select checkout from calendar
      await user.click(screen.getByTestId('select-checkout'));
      
      expect(checkinInput).toHaveValue('2024/06/15');
      expect(checkoutInput).toHaveValue('2024/06/18');
    });

    test('displays date selection summary when both dates are selected', async () => {
      const user = userEvent.setup();
      render(<Contact />);
      
      const checkinInput = screen.getByLabelText('Check-in Date');
      const checkoutInput = screen.getByLabelText('Check-out Date');
      
      await user.type(checkinInput, '2024/06/15');
      await user.type(checkoutInput, '2024/06/18');
      
      expect(screen.getByText(/Selected dates:/)).toBeInTheDocument();
      expect(screen.getByText(/3 nights/)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    const validFormData = {
      checkin: '2024/06/15',
      checkout: '2024/06/18',
      guests: '2',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+27123456789',
      message: 'Looking forward to our stay!'
    };

    const fillForm = async (user, data = validFormData) => {
      if (data.checkin) await user.type(screen.getByLabelText('Check-in Date'), data.checkin);
      if (data.checkout) await user.type(screen.getByLabelText('Check-out Date'), data.checkout);
      if (data.guests) await user.selectOptions(screen.getByLabelText('Number of Guests'), data.guests);
      if (data.name) await user.type(screen.getByLabelText('Full Name'), data.name);
      if (data.email) await user.type(screen.getByLabelText('Email Address'), data.email);
      if (data.phone) await user.type(screen.getByLabelText('Phone Number'), data.phone);
      if (data.message) await user.type(screen.getByLabelText('Additional Information'), data.message);
    };

    test('submits form with valid data successfully', async () => {
      const user = userEvent.setup();
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Booking request submitted successfully',
          booking_id: 123
        })
      });

      render(<Contact />);
      
      await fillForm(user);
      
      const submitButton = screen.getByText('Send Booking Request');
      await user.click(submitButton);
      
      // Check loading state
      expect(screen.getByText('Sending Request...')).toBeInTheDocument();
      
      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText(/Thank you for your booking request!/)).toBeInTheDocument();
      });
      
      // Verify fetch was called with correct data
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/booking',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(validFormData)
        })
      );
      
      // Verify form is reset
      expect(screen.getByLabelText('Check-in Date')).toHaveValue('');
      expect(screen.getByLabelText('Check-out Date')).toHaveValue('');
      expect(screen.getByLabelText('Full Name')).toHaveValue('');
      expect(screen.getByLabelText('Email Address')).toHaveValue('');
      expect(screen.getByLabelText('Phone Number')).toHaveValue('');
      expect(screen.getByLabelText('Additional Information')).toHaveValue('');
      expect(screen.getByLabelText('Number of Guests')).toHaveValue('2');
    });

    test('handles API error response', async () => {
      const user = userEvent.setup();
      
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Invalid date format'
        })
      });

      render(<Contact />);
      
      await fillForm(user);
      
      const submitButton = screen.getByText('Send Booking Request');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid date format')).toBeInTheDocument();
      });
      
      // Form should not be reset on error
      expect(screen.getByLabelText('Full Name')).toHaveValue('John Doe');
    });

    test('handles network error', async () => {
      const user = userEvent.setup();
      
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<Contact />);
      
      await fillForm(user);
      
      const submitButton = screen.getByText('Send Booking Request');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/There was an error submitting your request/)).toBeInTheDocument();
      });
    });

    test('handles fetch TypeError (connection failed)', async () => {
      const user = userEvent.setup();
      
      const fetchError = new TypeError('Failed to fetch');
      fetch.mockRejectedValueOnce(fetchError);

      render(<Contact />);
      
      await fillForm(user);
      
      const submitButton = screen.getByText('Send Booking Request');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Cannot connect to server/)).toBeInTheDocument();
      });
    });

    test('prevents multiple submissions while submitting', async () => {
      const user = userEvent.setup();
      
      // Make fetch hang to simulate slow response
      let resolvePromise;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      fetch.mockReturnValueOnce(promise);

      render(<Contact />);
      
      await fillForm(user);
      
      const submitButton = screen.getByText('Send Booking Request');
      await user.click(submitButton);
      
      // Button should be disabled and show loading state
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Sending Request...')).toBeInTheDocument();
      
      // Try to click again
      await user.click(submitButton);
      
      // Should still be in loading state
      expect(screen.getByText('Sending Request...')).toBeInTheDocument();
      
      // Resolve the promise
      resolvePromise({
        ok: true,
        json: async () => ({ message: 'Success', booking_id: 123 })
      });
    });

    test('uses custom API URL from environment variable', async () => {
      const user = userEvent.setup();
      
      // Mock environment variable
      const originalEnv = process.env.REACT_APP_API_URL;
      process.env.REACT_APP_API_URL = 'https://api.example.com/api';
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success', booking_id: 123 })
      });

      render(<Contact />);
      
      await fillForm(user);
      
      const submitButton = screen.getByText('Send Booking Request');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'https://api.example.com/api/booking',
          expect.any(Object)
        );
      });
      
      // Restore original environment
      process.env.REACT_APP_API_URL = originalEnv;
    });
  });

  describe('Accessibility', () => {
    test('form has proper labels and aria attributes', () => {
      render(<Contact />);
      
      expect(screen.getByLabelText('Check-in Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Check-out Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Number of Guests')).toBeInTheDocument();
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
      expect(screen.getByLabelText('Additional Information')).toBeInTheDocument();
    });

    test('required fields have required attribute', () => {
      render(<Contact />);
      
      expect(screen.getByLabelText('Check-in Date')).toBeRequired();
      expect(screen.getByLabelText('Check-out Date')).toBeRequired();
      expect(screen.getByLabelText('Number of Guests')).toBeRequired();
      expect(screen.getByLabelText('Full Name')).toBeRequired();
      expect(screen.getByLabelText('Email Address')).toBeRequired();
      expect(screen.getByLabelText('Phone Number')).toBeRequired();
      expect(screen.getByLabelText('Additional Information')).not.toBeRequired();
    });

    test('submit button has proper states and icons', () => {
      render(<Contact />);
      
      const submitButton = screen.getByText('Send Booking Request');
      expect(submitButton).toBeInTheDocument();
      
      // Should have default icon class
      const icon = submitButton.querySelector('i');
      expect(icon).toHaveClass('fas', 'fa-paper-plane');
    });
  });

  describe('Date Utility Functions', () => {
    test('date formatting works correctly', async () => {
      const user = userEvent.setup();
      render(<Contact />);
      
      const checkinInput = screen.getByLabelText('Check-in Date');
      
      // Test various input scenarios
      await user.type(checkinInput, '2024');
      expect(checkinInput).toHaveValue('2024');
      
      await user.clear(checkinInput);
      await user.type(checkinInput, '202406');
      expect(checkinInput).toHaveValue('2024/06');
      
      await user.clear(checkinInput);
      await user.type(checkinInput, '20240615');
      expect(checkinInput).toHaveValue('2024/06/15');
      
      // Test with non-numeric characters
      await user.clear(checkinInput);
      await user.type(checkinInput, '2024a06b15');
      expect(checkinInput).toHaveValue('2024/06/15');
      
      // Test maximum length
      await user.clear(checkinInput);
      await user.type(checkinInput, '202406151234567890');
      expect(checkinInput).toHaveValue('2024/06/15');
    });
  });
});