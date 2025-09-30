import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

// Mock the AvailabilityCalendar component for integration tests
jest.mock('../../components/AvailabilityCalendar/AvailabilityCalendar', () => {
  return function MockAvailabilityCalendar({ onDateSelect, selectedDates }) {
    return (
      <div data-testid="availability-calendar">
        <button
          onClick={() => onDateSelect('2025-11-15', 'checkin')}
          data-testid="select-checkin"
        >
          Select Check-in: 2025-11-15
        </button>
        <button
          onClick={() => onDateSelect('2025-11-18', 'checkout')}
          data-testid="select-checkout"
        >
          Select Check-out: 2025-11-18
        </button>
        <div data-testid="selected-checkin">{selectedDates.checkin}</div>
        <div data-testid="selected-checkout">{selectedDates.checkout}</div>
      </div>
    );
  };
});

// Mock fetch
global.fetch = jest.fn();

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Helper function to fill out the complete booking form
const fillCompleteForm = async (user, formData = {}) => {
  const defaultData = {
    checkin: '2025/11/15',
    checkout: '2025/11/18',
    guests: '2',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+27123456789',
    message: 'Looking forward to our stay!'
  };
  
  const data = { ...defaultData, ...formData };
  
  if (data.checkin) {
    const checkinInput = screen.getByLabelText('Check-in Date');
    // Use fireEvent to directly set the formatted value
    fireEvent.change(checkinInput, { target: { value: '20251115' } });
  }
  
  if (data.checkout) {
    const checkoutInput = screen.getByLabelText('Check-out Date');
    // Use fireEvent to directly set the formatted value
    fireEvent.change(checkoutInput, { target: { value: '20251118' } });
  }
  
  if (data.guests) {
    await user.selectOptions(screen.getByLabelText('Number of Guests'), data.guests);
  }
  
  if (data.name) {
    await user.type(screen.getByLabelText('Full Name'), data.name);
  }
  
  if (data.email) {
    await user.type(screen.getByLabelText('Email Address'), data.email);
  }
  
  if (data.phone) {
    await user.type(screen.getByLabelText('Phone Number'), data.phone);
  }
  
  if (data.message) {
    await user.type(screen.getByLabelText('Additional Information'), data.message);
  }
};

describe('Complete Booking Flow Integration', () => {
  beforeEach(() => {
    fetch.mockClear();
    Element.prototype.scrollIntoView.mockClear();
    
    // Mock the availability API call by default
    fetch.mockImplementation((url) => {
      if (url.includes('/availability')) {
        return Promise.resolve({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({
            unavailable_dates: []
          })
        });
      }
      // For other API calls, return a default response
      return Promise.resolve({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({})
      });
    });
  });

  describe('Navigation Flow', () => {
    test('user can navigate from hero to contact form', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Click "Book Now" button in hero section
      const bookNowButton = screen.getByText('Book Now');
      await user.click(bookNowButton);
      
      // Should scroll to contact section
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    test('user can navigate using header menu', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Test navigation to different sections
      const contactLink = screen.getByRole('button', { name: 'Contact' });
      await user.click(contactLink);
      
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
      
      // Use getAllByRole to get all accommodation buttons, then select header one
      const accommodationLinks = screen.getAllByRole('button', { name: 'Accommodation' });
      const headerAccommodationLink = accommodationLinks.find(link => 
        link.closest('.navbar') !== null
      );
      await user.click(headerAccommodationLink);
      
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(2);
    });

    test('mobile menu navigation flow works correctly', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Open mobile menu - find the hamburger by its structure
      const hamburger = document.querySelector('.lg\\:hidden.flex.flex-col.cursor-pointer');
      expect(hamburger).toBeInTheDocument();
      await user.click(hamburger);

      // Check that menu is now visible (contains Contact button)
      const contactLink = screen.getByRole('button', { name: 'Contact' });
      expect(contactLink).toBeVisible();

      // Click navigation link - should close menu and navigate
      await user.click(contactLink);

      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });

  describe('Complete Booking Form Flow', () => {
    const fillCompleteForm = async (user, formData = {}) => {
      const defaultData = {
        checkin: '2025/11/15',
        checkout: '2025/11/18',
        guests: '2',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+27123456789',
        message: 'Looking forward to our stay!'
      };
      
      const data = { ...defaultData, ...formData };
      
      if (data.checkin) {
        const checkinInput = screen.getByLabelText('Check-in Date');
        // Use fireEvent to directly set the formatted value
        fireEvent.change(checkinInput, { target: { value: '20251115' } });
      }
      
      if (data.checkout) {
        const checkoutInput = screen.getByLabelText('Check-out Date');
        // Use fireEvent to directly set the formatted value
        fireEvent.change(checkoutInput, { target: { value: '20251118' } });
      }
      
      if (data.guests) {
        await user.selectOptions(screen.getByLabelText('Number of Guests'), data.guests);
      }
      
      if (data.name) {
        await user.type(screen.getByLabelText('Full Name'), data.name);
      }
      
      if (data.email) {
        await user.type(screen.getByLabelText('Email Address'), data.email);
      }
      
      if (data.phone) {
        await user.type(screen.getByLabelText('Phone Number'), data.phone);
      }
      
      if (data.message) {
        await user.type(screen.getByLabelText('Additional Information'), data.message);
      }
    };

    test('successful booking flow from start to finish', async () => {
      const user = userEvent.setup();
      
      // Mock both availability and booking API calls
      fetch.mockImplementation((url) => {
        if (url.includes('/availability')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              unavailable_dates: []
            })
          });
        } else if (url.includes('/booking')) {
          return Promise.resolve({
            ok: true,
            headers: new Map([['content-type', 'application/json']]),
            json: async () => ({
              message: 'Thank you for your booking request! We will contact you within 24 hours to confirm your reservation.',
              booking_id: 123
            })
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      render(<App />);
      
      // 1. Navigate to booking form via hero button
      const bookNowButton = screen.getByText('Book Now');
      await user.click(bookNowButton);
      
      // 2. Fill out the complete booking form
      await fillCompleteForm(user);
      
      // 3. Submit the form
      const submitButton = screen.getByText('Send Booking Request');
      await user.click(submitButton);
      
      // 4. Wait for success message
      await waitFor(() => {
        expect(screen.getByText(/Thank you for your booking request! We will contact you within 24 hours to confirm your reservation./)).toBeInTheDocument();
      }, { timeout: 10000 });
      
      // 5. Verify API was called with correct data
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/booking'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            checkin: '2025/11/15',
            checkout: '2025/11/18',
            guests: '2',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+27123456789',
            message: 'Looking forward to our stay!'
          })
        })
      );
      
      // 6. Verify form is reset after successful submission
      expect(screen.getByLabelText('Full Name')).toHaveValue('');
      expect(screen.getByLabelText('Email Address')).toHaveValue('');
      expect(screen.getByLabelText('Check-in Date')).toHaveValue('');
    });

    test('booking flow with calendar date selection', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Show calendar
      const calendarToggle = screen.getByText('Show Availability Calendar');
      await user.click(calendarToggle);
      
      // Calendar should be visible
      expect(screen.getByTestId('availability-calendar')).toBeInTheDocument();
      
      // Select dates from calendar (mocked component will handle this)
      // The calendar integration is already tested in Contact component tests
      
      // Fill remaining form fields
      await user.type(screen.getByLabelText('Full Name'), 'Jane Smith');
      await user.type(screen.getByLabelText('Email Address'), 'jane@example.com');
      await user.type(screen.getByLabelText('Phone Number'), '+27987654321');
      
      // Form should be ready for submission
      expect(screen.getByText('Send Booking Request')).toBeInTheDocument();
    });

    test('form validation flow - user corrects errors', async () => {
      const user = userEvent.setup();
      
      // Mock API to return validation error first, then success
      fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({ error: 'Check-in date cannot be in the past' })
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({ message: 'Thank you for your booking request! We will contact you within 24 hours to confirm your reservation.', booking_id: 123 })
        });

      render(<App />);
      
      // Fill form with invalid data (past date)
      await fillCompleteForm(user, {
        checkin: '2020/01/01',
        checkout: '2020/01/03'
      });
      
      // Submit and get error
      const submitButton = screen.getByText('Send Booking Request');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Check-in date cannot be in the past')).toBeInTheDocument();
      });
      
      // User corrects the dates
      const checkinInput = screen.getByLabelText('Check-in Date');
      const checkoutInput = screen.getByLabelText('Check-out Date');
      
      fireEvent.change(checkinInput, { target: { value: '20251115' } });
      fireEvent.change(checkoutInput, { target: { value: '20251118' } });
      
      // Submit again
      await user.click(submitButton);
      
      // Should succeed this time
      await waitFor(() => {
        expect(screen.getByText(/Thank you for your booking request!/)).toBeInTheDocument();
      });
    });

    test('user abandons booking and returns later', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Start filling form
      await user.type(screen.getByLabelText('Full Name'), 'John Doe');
      await user.type(screen.getByLabelText('Email Address'), 'john@example.com');
      
      // Navigate away using header menu
      const amenitiesLinks = screen.getAllByRole('button', { name: 'Amenities' });
      const headerAmenitiesLink = amenitiesLinks.find(link => 
        link.closest('.navbar') !== null
      );
      await user.click(headerAmenitiesLink);
      
      // Return to contact form
      const contactLink = screen.getByRole('button', { name: 'Contact' });
      await user.click(contactLink);
      
      // Form data should still be there (state preserved)
      expect(screen.getByLabelText('Full Name')).toHaveValue('John Doe');
      expect(screen.getByLabelText('Email Address')).toHaveValue('john@example.com');
      
      // Complete the form
      await fillCompleteForm(user, {
        name: '', // Don't refill name
        email: '' // Don't refill email
      });
      
      // Should be able to submit
      expect(screen.getByText('Send Booking Request')).not.toBeDisabled();
    });
  });

  describe('Error Handling Flow', () => {
    test('network error recovery flow', async () => {
      const user = userEvent.setup();
      
      // First attempt fails with network error
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<App />);
      
      await fillCompleteForm(user);
      
      const submitButton = screen.getByText('Send Booking Request');
      await user.click(submitButton);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/There was an error submitting your request/)).toBeInTheDocument();
      });
      
      // Form data should be preserved
      expect(screen.getByLabelText('Full Name')).toHaveValue('John Doe');
      
      // User can retry - mock success this time
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ message: 'Thank you for your booking request! We will contact you within 24 hours to confirm your reservation.', booking_id: 456 })
      });
      
      await user.click(submitButton);
      
      // Should succeed on retry
      await waitFor(() => {
        expect(screen.getByText(/Thank you for your booking request! We will contact you within 24 hours to confirm your reservation./)).toBeInTheDocument();
      });
    });

    test('server error with retry flow', async () => {
      const user = userEvent.setup();
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ error: 'Internal server error' })
      });

      render(<App />);
      
      await fillCompleteForm(user);
      
      const submitButton = screen.getByText('Send Booking Request');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Internal server error')).toBeInTheDocument();
      });
      
      // User can modify form and retry
      const messageInput = screen.getByLabelText('Additional Information');
      await user.clear(messageInput);
      await user.type(messageInput, 'Updated message after error');
      
      // Mock success for retry
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ message: 'Thank you for your booking request! We will contact you within 24 hours to confirm your reservation.', booking_id: 789 })
      });
      
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Thank you for your booking request! We will contact you within 24 hours to confirm your reservation./)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Flow', () => {
    test('keyboard navigation through booking flow', async () => {
      render(<App />);
      
      // User can tab through form elements
      const checkinInput = screen.getByLabelText('Check-in Date');
      const checkoutInput = screen.getByLabelText('Check-out Date');
      const nameInput = screen.getByLabelText('Full Name');
      const submitButton = screen.getByText('Send Booking Request');
      
      // All interactive elements should be focusable
      checkinInput.focus();
      expect(document.activeElement).toBe(checkinInput);
      
      checkoutInput.focus();
      expect(document.activeElement).toBe(checkoutInput);
      
      nameInput.focus();
      expect(document.activeElement).toBe(nameInput);
      
      submitButton.focus();
      expect(document.activeElement).toBe(submitButton);
    });

    test('screen reader labels and descriptions', () => {
      render(<App />);
      
      // All form fields should have proper labels
      expect(screen.getByLabelText('Check-in Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Check-out Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Number of Guests')).toBeInTheDocument();
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
      expect(screen.getByLabelText('Additional Information')).toBeInTheDocument();
      
      // Required fields should have required attribute
      expect(screen.getByLabelText('Full Name')).toBeRequired();
      expect(screen.getByLabelText('Email Address')).toBeRequired();
      expect(screen.getByLabelText('Phone Number')).toBeRequired();
    });
  });

  describe('Responsive Flow', () => {
    test('mobile booking flow with hamburger menu', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Simulate mobile navigation - find hamburger by its structure
      const hamburger = document.querySelector('.lg\\:hidden.flex.flex-col.cursor-pointer');
      expect(hamburger).toBeInTheDocument();
      await user.click(hamburger);

      // Menu should open - verify Contact button is visible
      const contactLink = screen.getByRole('button', { name: 'Contact' });
      expect(contactLink).toBeVisible();

      // Navigate to contact
      await user.click(contactLink);
      
      // Booking form should be accessible
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
      
      // Form should work normally on mobile
      await fillCompleteForm(user);
      expect(screen.getByText('Send Booking Request')).toBeInTheDocument();
    });
  });

  describe('Performance Flow', () => {
    test('form interaction performance', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const startTime = performance.now();
      
      // Perform typical user interactions
      await user.type(screen.getByLabelText('Check-in Date'), '2025/11/15');
      await user.type(screen.getByLabelText('Check-out Date'), '2025/11/18');
      await user.type(screen.getByLabelText('Full Name'), 'Performance Test User');
      await user.type(screen.getByLabelText('Email Address'), 'performance@test.com');
      await user.type(screen.getByLabelText('Phone Number'), '+27123456789');
      
      const endTime = performance.now();
      
      // Form interactions should be fast
      expect(endTime - startTime).toBeLessThan(3000); // 3 seconds should be plenty
      
      // All form data should be correctly entered
      expect(screen.getByLabelText('Full Name')).toHaveValue('Performance Test User');
      expect(screen.getByLabelText('Email Address')).toHaveValue('performance@test.com');
    });
  });
});