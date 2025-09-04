import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AvailabilityCalendar from './AvailabilityCalendar';

// Mock fetch globally
global.fetch = jest.fn();

describe('AvailabilityCalendar Component', () => {
  const defaultProps = {
    onDateSelect: jest.fn(),
    selectedDates: { checkin: '', checkout: '' },
    minDate: new Date(2024, 5, 1) // June 1, 2024
  };

  // Mock current date to June 2024 for consistent tests
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2024, 5, 15));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    fetch.mockClear();
    defaultProps.onDateSelect.mockClear();
    
    // Mock successful API response by default
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        unavailable_dates: ['2024-06-15', '2024-06-16']
      })
    });
  });

  describe('Component Rendering', () => {
    test('renders calendar with header and navigation', async () => {
      render(<AvailabilityCalendar {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Select Your Dates')).toBeInTheDocument();
        expect(screen.getByText(/June 2024/)).toBeInTheDocument();
        expect(screen.getByTestId('prev-month')).toBeInTheDocument();
        expect(screen.getByTestId('next-month')).toBeInTheDocument();
      });
    });

    test('renders legend correctly', async () => {
      render(<AvailabilityCalendar {...defaultProps} />);

      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getByText('Booked/Unavailable')).toBeInTheDocument();
      expect(screen.getByText('Check-in')).toBeInTheDocument();
      expect(screen.getByText('Check-out')).toBeInTheDocument();
      expect(screen.getByText('Your Stay')).toBeInTheDocument();
    });

    test('renders weekday headers', async () => {
      render(<AvailabilityCalendar {...defaultProps} />);

      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      weekdays.forEach(day => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    test('fetches availability data on mount', async () => {
      render(<AvailabilityCalendar {...defaultProps} />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/availability?year=2024&month=6')
        );
      });
    });

    test('handles API error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      fetch.mockRejectedValueOnce(new Error('API Error'));

      render(<AvailabilityCalendar {...defaultProps} />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching availability:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    test('uses custom API URL from environment variable', async () => {
      const originalEnv = process.env.REACT_APP_API_URL;
      process.env.REACT_APP_API_URL = 'https://api.example.com';

      render(<AvailabilityCalendar {...defaultProps} />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'https://api.example.com/availability?year=2024&month=6'
        );
      });

      process.env.REACT_APP_API_URL = originalEnv;
    });
  });

  describe('Date Selection Logic', () => {
    test('selects check-in date on first click', async () => {
      render(<AvailabilityCalendar {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('17')).toBeInTheDocument();
      });

      // Click on a valid date (17 is available, not disabled)
      const dayButton = screen.getByText('17');
      fireEvent.click(dayButton);

      expect(defaultProps.onDateSelect).toHaveBeenCalledWith('2024-06-17', 'checkin');
    });

    test('handles date selection with unavailable dates', async () => {
      // Mock unavailable dates
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          unavailable_dates: ['2024-06-15', '2024-06-16']
        })
      });

      render(<AvailabilityCalendar {...defaultProps} />);

      // Wait for calendar to load and show unavailable dates
      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument();
      });

      // Try to click on unavailable date - should not trigger onDateSelect
      const unavailableDay = screen.getByText('15'); 
      fireEvent.click(unavailableDay);

      // Should not call onDateSelect for unavailable dates
      expect(defaultProps.onDateSelect).not.toHaveBeenCalled();
    });

    test('handles complete date selection flow', async () => {
      const mockOnDateSelect = jest.fn();
      
      // Test initial render
      const { rerender } = render(<AvailabilityCalendar 
        {...defaultProps} 
        onDateSelect={mockOnDateSelect}
      />);

      await waitFor(() => {
        expect(screen.getByText('17')).toBeInTheDocument();
      });

      // First click - select check-in (use available date)
      fireEvent.click(screen.getByText('17'));
      expect(mockOnDateSelect).toHaveBeenLastCalledWith('2024-06-17', 'checkin');

      // Re-render with check-in selected
      rerender(<AvailabilityCalendar
        {...defaultProps}
        onDateSelect={mockOnDateSelect}
        selectedDates={{ checkin: '2024-06-17', checkout: '' }}
      />);

      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument();
      });

      // Second click - select checkout
      fireEvent.click(screen.getByText('25'));
      expect(mockOnDateSelect).toHaveBeenLastCalledWith('2024-06-25', 'checkout');
    });
  });

  describe('Calendar Navigation', () => {
    test('navigation buttons are rendered and clickable', async () => {
      render(<AvailabilityCalendar {...defaultProps} />);

      await waitFor(() => {
        const prevButton = screen.getByTestId('prev-month');
        const nextButton = screen.getByTestId('next-month');
        
        expect(prevButton).toBeInTheDocument();
        expect(nextButton).toBeInTheDocument();
        expect(prevButton).not.toBeDisabled();
        expect(nextButton).not.toBeDisabled();
      });

      // Clear previous calls to check for navigation clicks
      fetch.mockClear();

      const prevButton = screen.getByTestId('prev-month');
      fireEvent.click(prevButton);

      // This should trigger navigation logic (lines 111-113, 206-218)
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Date Display and Styling', () => {
    test('displays check-in and check-out dates with labels', async () => {
      const propsWithDates = {
        ...defaultProps,
        selectedDates: { checkin: '2024-06-17', checkout: '2024-06-25' }
      };

      render(<AvailabilityCalendar {...propsWithDates} />);

      await waitFor(() => {
        expect(screen.getByText('IN')).toBeInTheDocument();
        expect(screen.getByText('OUT')).toBeInTheDocument();
        expect(screen.getByTitle('Check-in date')).toBeInTheDocument();
        expect(screen.getByTitle('Check-out date')).toBeInTheDocument();
      });
    });

    test('shows selection hint when only check-in is selected', async () => {
      const propsWithCheckin = {
        ...defaultProps,
        selectedDates: { checkin: '2024-06-17', checkout: '' }
      };

      render(<AvailabilityCalendar {...propsWithCheckin} />);

      await waitFor(() => {
        expect(screen.getByText(/Check-in selected/)).toBeInTheDocument();
        expect(screen.getByText(/Now click on your check-out date/)).toBeInTheDocument();
      });
    });

    test('shows loading state', async () => {
      // Mock a pending fetch
      let resolvePromise;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      fetch.mockReturnValueOnce(promise);

      render(<AvailabilityCalendar {...defaultProps} />);

      // Should show loading state
      expect(screen.getByText('Loading availability...')).toBeInTheDocument();

      // Resolve the promise
      resolvePromise({
        ok: true,
        json: async () => ({ unavailable_dates: [] })
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading availability...')).not.toBeInTheDocument();
      });
    });

    test('covers additional date utility functions', async () => {
      // Test to cover line 53 (isDateSelected)
      const propsWithOnlyCheckin = {
        ...defaultProps,
        selectedDates: { checkin: '2024-06-17', checkout: '' }
      };

      render(<AvailabilityCalendar {...propsWithOnlyCheckin} />);

      await waitFor(() => {
        // Should find check-in date selected
        expect(screen.getByTitle('Check-in date')).toBeInTheDocument();
      });
    });

    test('covers date range and status checks', async () => {
      // Test to cover additional switch cases and date logic  
      const propsWithFullRange = {
        ...defaultProps,
        selectedDates: { checkin: '2024-06-20', checkout: '2024-06-25' }
      };

      render(<AvailabilityCalendar {...propsWithFullRange} />);

      await waitFor(() => {
        // Should find both dates and range
        expect(screen.getByText('IN')).toBeInTheDocument();
        expect(screen.getByText('OUT')).toBeInTheDocument();
        // In-range dates should exist between 20-25
        expect(screen.getAllByTitle('Selected stay period').length).toBeGreaterThan(0);
      });
    });
  });
});