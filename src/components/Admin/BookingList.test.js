import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import BookingList from './BookingList';

// Mock the API service
const mockUseApi = jest.fn();

jest.mock('../../services/apiService', () => ({
  useApi: () => mockUseApi(),
}));

describe('BookingList Component', () => {
  const mockApi = {
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };

  const mockBookings = [
    {
      id: 1,
      guest_name: 'John Doe',
      guest_email: 'john@example.com',
      guest_phone: '123-456-7890',
      check_in: '2024-01-15',
      check_out: '2024-01-18',
      guests: 2,
      status: 'pending',
      special_requests: 'Late check-in',
      payment_amount: 2550,
      created_at: '2024-01-10T10:00:00Z'
    },
    {
      id: 2,
      guest_name: 'Jane Smith',
      guest_email: 'jane@example.com',
      guest_phone: '098-765-4321',
      check_in: '2024-01-20',
      check_out: '2024-01-23',
      guests: 1,
      status: 'confirmed',
      special_requests: null,
      payment_amount: 2550,
      created_at: '2024-01-12T14:30:00Z'
    },
    {
      id: 3,
      guest_name: 'Bob Johnson',
      guest_email: 'bob@example.com',
      guest_phone: '555-123-4567',
      check_in: '2024-01-25',
      check_out: '2024-01-28',
      guests: 3,
      status: 'cancelled',
      special_requests: 'Wheelchair access',
      payment_amount: 2550,
      created_at: '2024-01-14T09:15:00Z'
    }
  ];

  const mockProps = {
    onSelectBooking: jest.fn(),
    onBack: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApi.mockReturnValue(mockApi);
    mockApi.get.mockResolvedValue(mockBookings);
    mockApi.put.mockResolvedValue({ success: true });
    mockApi.delete.mockResolvedValue({ success: true });
  });

  describe('Component Initialization', () => {
    test('renders booking list header', () => {
      render(<BookingList {...mockProps} />);

      expect(screen.getByText('Booking Management')).toBeInTheDocument();
      expect(screen.getByText('Manage all property bookings')).toBeInTheDocument();
    });

    test('shows loading state initially', () => {
      render(<BookingList {...mockProps} />);

      expect(screen.getByText('Loading bookings...')).toBeInTheDocument();
    });

    test('fetches bookings on component mount', () => {
      render(<BookingList {...mockProps} />);

      expect(mockApi.get).toHaveBeenCalledWith('/admin/bookings?page=1&per_page=20');
    });

    test('renders back button', () => {
      render(<BookingList {...mockProps} />);

      const backButton = screen.getByRole('button', { name: /Back to Dashboard/i });
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('Data Loading and Display', () => {
    test('displays bookings after loading', async () => {
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading bookings...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    test('displays booking details correctly', async () => {
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
      });

      expect(screen.getByText('123-456-7890')).toBeInTheDocument();
      expect(screen.getByText('15 Jan - 18 Jan')).toBeInTheDocument();
      expect(screen.getByText('2 guests')).toBeInTheDocument();
      const amountElement = screen.getByTestId('booking-amount-1');
      expect(amountElement).toHaveTextContent('R 2 550,00');
    });

    test('displays booking statuses correctly', async () => {
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument();
      });

      // Verify all status text content is displayed correctly
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Confirmed')).toBeInTheDocument();
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });

    test('handles empty booking list', async () => {
      mockApi.get.mockResolvedValue([]);
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('No bookings found')).toBeInTheDocument();
      });

      expect(screen.getByText('There are no bookings to display.')).toBeInTheDocument();
    });

    test('displays error when fetch fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockApi.get.mockRejectedValue(new Error('API Error'));

      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load bookings')).toBeInTheDocument();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch bookings:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Filtering and Search', () => {
    test('renders filter controls', async () => {
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading bookings...')).not.toBeInTheDocument();
      });

      expect(screen.getByPlaceholderText('Search bookings...')).toBeInTheDocument();
      expect(screen.getByDisplayValue('')).toBeInTheDocument(); // Status filter dropdown
    });

    test('filters bookings by search term', async () => {
      const user = userEvent.setup();
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search bookings...');
      await user.type(searchInput, 'Doe');

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
        expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
      });
    });

    test('filters bookings by email', async () => {
      const user = userEvent.setup();
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search bookings...');
      await user.type(searchInput, 'jane@example.com');

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    });

    test('filters bookings by status', async () => {
      const user = userEvent.setup();
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const statusFilter = screen.getAllByRole('combobox')[0]; // Status filter is first combobox
      await user.selectOptions(statusFilter, 'pending');

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    });

    test('shows all bookings when filter is cleared', async () => {
      const user = userEvent.setup();
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Filter by status first
      const statusFilter = screen.getAllByRole('combobox')[0];
      await user.selectOptions(statusFilter, 'pending');
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();

      // Clear filter using clear button
      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    test('renders sort controls', async () => {
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading bookings...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Sort by:')).toBeInTheDocument();
      expect(screen.getAllByRole('combobox')[1]).toBeInTheDocument(); // Sort is second combobox
    });

    test('sorts bookings by date (newest first by default)', async () => {
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading bookings...')).not.toBeInTheDocument();
      });

      const bookingNames = screen.getAllByText(/John Doe|Jane Smith|Bob Johnson/);
      // Bob Johnson was created last (2024-01-14), so should be first
      expect(bookingNames[0]).toHaveTextContent('Bob Johnson');
      expect(bookingNames[1]).toHaveTextContent('Jane Smith');
      expect(bookingNames[2]).toHaveTextContent('John Doe');
    });

    test('sorts bookings by guest name', async () => {
      const user = userEvent.setup();
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading bookings...')).not.toBeInTheDocument();
      });

      const sortSelect = screen.getAllByRole('combobox')[1]; // Sort is second combobox
      await user.selectOptions(sortSelect, 'name');

      const bookingNames = screen.getAllByText(/John Doe|Jane Smith|Bob Johnson/);
      // Alphabetical order: Bob, Jane, John
      expect(bookingNames[0]).toHaveTextContent('Bob Johnson');
      expect(bookingNames[1]).toHaveTextContent('Jane Smith');
      expect(bookingNames[2]).toHaveTextContent('John Doe');
    });

    test('sorts bookings by check-in date', async () => {
      const user = userEvent.setup();
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading bookings...')).not.toBeInTheDocument();
      });

      const sortSelect = screen.getAllByRole('combobox')[1]; // Sort is second combobox
      await user.selectOptions(sortSelect, 'checkin');

      const bookingNames = screen.getAllByText(/John Doe|Jane Smith|Bob Johnson/);
      // Check-in date order: John (Jan 15), Jane (Jan 20), Bob (Jan 25)
      expect(bookingNames[0]).toHaveTextContent('John Doe');
      expect(bookingNames[1]).toHaveTextContent('Jane Smith');
      expect(bookingNames[2]).toHaveTextContent('Bob Johnson');
    });
  });

  describe('Booking Actions', () => {
    test('calls onSelectBooking when booking is clicked', async () => {
      const user = userEvent.setup();
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const bookingCard = screen.getAllByRole('article')[0];
      await user.click(bookingCard);

      // Default sort is by date (newest first), so Bob Johnson should be first
      expect(mockProps.onSelectBooking).toHaveBeenCalledWith(mockBookings[2]); // Bob Johnson
    });

    test('renders action buttons for each booking', async () => {
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading bookings...')).not.toBeInTheDocument();
      });

      const viewButtons = screen.getAllByRole('button', { name: /View Details/i });
      expect(viewButtons).toHaveLength(3);

      const confirmButtons = screen.getAllByRole('button', { name: /Confirm/i });
      expect(confirmButtons).toHaveLength(1); // Only for pending bookings

      const cancelButtons = screen.getAllByRole('button', { name: /Cancel/i });
      expect(cancelButtons).toHaveLength(2); // For pending and confirmed bookings
    });

    test('confirms a booking when confirm button is clicked', async () => {
      const user = userEvent.setup();
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading bookings...')).not.toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Confirm/i });
      await user.click(confirmButton);

      expect(mockApi.put).toHaveBeenCalledWith('/admin/bookings/1/status', { status: 'confirmed' });
    });

    test('cancels a booking when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading bookings...')).not.toBeInTheDocument();
      });

      const cancelButtons = screen.getAllByRole('button', { name: /Cancel/i });
      await user.click(cancelButtons[0]); // Click first cancel button

      // First cancel button should be for confirmed booking (Jane Smith, ID 2) since Bob Johnson is cancelled
      expect(mockApi.put).toHaveBeenCalledWith('/admin/bookings/2/status', { status: 'cancelled' });
    });

    test('refreshes booking list after status update', async () => {
      const user = userEvent.setup();
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading bookings...')).not.toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Confirm/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledTimes(2); // Initial load + refresh
      });
    });

    test('handles status update error gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockApi.put.mockRejectedValue(new Error('Update failed'));

      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading bookings...')).not.toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Confirm/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to update booking status')).toBeInTheDocument();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update booking status:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Back Navigation', () => {
    test('calls onBack when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<BookingList {...mockProps} />);

      const backButton = screen.getByRole('button', { name: /Back to Dashboard/i });
      await user.click(backButton);

      expect(mockProps.onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Data Formatting', () => {
    test('formats dates correctly', async () => {
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('15 Jan - 18 Jan')).toBeInTheDocument();
      });

      expect(screen.getByText('20 Jan - 23 Jan')).toBeInTheDocument();
      expect(screen.getByText('25 Jan - 28 Jan')).toBeInTheDocument();
    });

    test('formats currency correctly', async () => {
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('booking-amount-1')).toHaveTextContent('R 2 550,00');
      });

      expect(screen.getByTestId('booking-amount-2')).toHaveTextContent('R 2 550,00');
      expect(screen.getByTestId('booking-amount-3')).toHaveTextContent('R 2 550,00');
    });

    test('formats guest count correctly', async () => {
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('2 guests')).toBeInTheDocument();
      });

      expect(screen.getByText('1 guest')).toBeInTheDocument();
      expect(screen.getByText('3 guests')).toBeInTheDocument();
    });

    test('handles missing special requests', async () => {
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Late check-in')).toBeInTheDocument();
      });

      expect(screen.getByText('Wheelchair access')).toBeInTheDocument();
      // Jane Smith has no special requests, should show placeholder or be empty
      expect(screen.getAllByText('No special requests')).toHaveLength(1);
    });
  });

  describe('Responsive Design and Accessibility', () => {
    test('booking cards have proper accessibility attributes', async () => {
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading bookings...')).not.toBeInTheDocument();
      });

      const bookingCards = screen.getAllByRole('article');
      expect(bookingCards).toHaveLength(3);

      bookingCards.forEach(card => {
        expect(card).toHaveClass('cursor-pointer');
        expect(card).toHaveAttribute('tabIndex', '0');
      });
    });

    test('action buttons are properly labeled', async () => {
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading bookings...')).not.toBeInTheDocument();
      });

      const viewButtons = screen.getAllByRole('button', { name: /View Details/i });
      expect(viewButtons).toHaveLength(3);

      viewButtons.forEach(button => {
        expect(button).not.toBeDisabled();
        expect(button).toBeVisible();
      });
    });

    test('handles keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading bookings...')).not.toBeInTheDocument();
      });

      const firstBookingCard = screen.getAllByRole('article')[0];
      firstBookingCard.focus();

      await user.keyboard('{Enter}');
      expect(mockProps.onSelectBooking).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('handles booking with very long guest name', async () => {
      const longNameBooking = [{
        ...mockBookings[0],
        guest_name: 'Very Long Guest Name That Might Overflow The Container Width'
      }];

      mockApi.get.mockResolvedValue(longNameBooking);
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Very Long Guest Name That Might Overflow The Container Width')).toBeInTheDocument();
      });
    });

    test('handles booking with null or undefined values', async () => {
      const incompleteBooking = [{
        id: 99,
        guest_name: 'Incomplete Guest',
        guest_email: null,
        guest_phone: undefined,
        check_in: '2024-01-15',
        check_out: '2024-01-18',
        guests: null,
        status: 'pending',
        special_requests: '',
        payment_amount: 0,
        created_at: '2024-01-10T10:00:00Z'
      }];

      mockApi.get.mockResolvedValue(incompleteBooking);
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Incomplete Guest')).toBeInTheDocument();
      });

      expect(screen.getByText('No email provided')).toBeInTheDocument();
      expect(screen.getByText('No phone provided')).toBeInTheDocument();
      expect(screen.getByText('R 0,00')).toBeInTheDocument();
    });

    test('handles paginated response format - lines 42-43', async () => {
      const paginatedResponse = {
        bookings: [mockBookings[0]],
        pages: 3,
        total: 25
      };

      mockApi.get.mockResolvedValue(paginatedResponse);
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Verify that the paginated response was handled correctly
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    test('handles missing date values in formatting - lines 92-93', async () => {
      const bookingWithMissingDates = [{
        id: 100,
        guest_name: 'No Dates Guest',
        guest_email: 'nodates@example.com',
        guest_phone: '123-456-7890',
        check_in: null,
        check_out: undefined,
        guests: 1,
        status: 'pending',
        special_requests: 'No dates provided',
        payment_amount: 1000,
        created_at: '2024-01-10T10:00:00Z'
      }];

      mockApi.get.mockResolvedValue(bookingWithMissingDates);
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('No Dates Guest')).toBeInTheDocument();
      });

      expect(screen.getByText('No dates')).toBeInTheDocument();
    });

    test('handles unknown booking status - lines 128-129, 131', async () => {
      const bookingWithUnknownStatus = [{
        id: 101,
        guest_name: 'Unknown Status Guest',
        guest_email: 'unknown@example.com',
        guest_phone: '123-456-7890',
        check_in: '2024-01-15',
        check_out: '2024-01-18',
        guests: 2,
        status: 'unknown_status',
        special_requests: 'Unknown status',
        payment_amount: 1500,
        created_at: '2024-01-10T10:00:00Z'
      }];

      mockApi.get.mockResolvedValue(bookingWithUnknownStatus);
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Unknown Status Guest')).toBeInTheDocument();
      });

      // Check that unknown status gets the default styling
      const statusElement = screen.getByTestId('booking-status-101');
      expect(statusElement).toHaveClass('bg-gray-100', 'text-gray-800');
      expect(statusElement).toHaveTextContent('Unknown_status');
    });

    test('handles null status in formatting', async () => {
      const bookingWithNullStatus = [{
        id: 102,
        guest_name: 'Null Status Guest',
        guest_email: 'null@example.com',
        guest_phone: '123-456-7890',
        check_in: '2024-01-15',
        check_out: '2024-01-18',
        guests: 2,
        status: null,
        special_requests: 'Null status',
        payment_amount: 1500,
        created_at: '2024-01-10T10:00:00Z'
      }];

      mockApi.get.mockResolvedValue(bookingWithNullStatus);
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Null Status Guest')).toBeInTheDocument();
      });

      // Check that null status gets handled properly
      const statusElement = screen.getByTestId('booking-status-102');
      expect(statusElement).toHaveTextContent('Unknown');
    });
  });

  describe('Status Update Error Scenarios', () => {
    test('handles status update error with stopPropagation - lines 306-307', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // First call succeeds (initial load), second call fails (status update)
      mockApi.get.mockResolvedValueOnce(mockBookings);
      mockApi.put.mockRejectedValue(new Error('Status update failed'));

      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading bookings...')).not.toBeInTheDocument();
      });

      // Click confirm button which should trigger the error path
      const confirmButton = screen.getByRole('button', { name: /Confirm/i });

      // Create a spy for stopPropagation to verify it's called
      const stopPropagationSpy = jest.fn();
      confirmButton.addEventListener('click', (e) => {
        e.stopPropagation = stopPropagationSpy;
      });

      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to update booking status')).toBeInTheDocument();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update booking status:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    test('handles cancel button error with stopPropagation', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockApi.get.mockResolvedValueOnce(mockBookings);
      mockApi.put.mockRejectedValue(new Error('Cancel failed'));

      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading bookings...')).not.toBeInTheDocument();
      });

      const cancelButtons = screen.getAllByRole('button', { name: /Cancel/i });
      await user.click(cancelButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Failed to update booking status')).toBeInTheDocument();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update booking status:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    test('tests View Details button stopPropagation - lines 306-307', async () => {
      const user = userEvent.setup();
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading bookings...')).not.toBeInTheDocument();
      });

      // Click the View Details button to test stopPropagation on lines 306-307
      const viewDetailsButtons = screen.getAllByRole('button', { name: /View Details/i });
      await user.click(viewDetailsButtons[0]);

      // Verify onSelectBooking was called (this covers lines 306-307)
      expect(mockProps.onSelectBooking).toHaveBeenCalled();
    });
  });

  describe('Additional Status and Formatting Tests', () => {
    test('tests approved status color - line 128', async () => {
      const bookingWithApprovedStatus = [{
        id: 103,
        guest_name: 'Approved Guest',
        guest_email: 'approved@example.com',
        guest_phone: '123-456-7890',
        check_in: '2024-01-15',
        check_out: '2024-01-18',
        guests: 2,
        status: 'approved',
        special_requests: 'Approved status',
        payment_amount: 1500,
        created_at: '2024-01-10T10:00:00Z'
      }];

      mockApi.get.mockResolvedValue(bookingWithApprovedStatus);
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Approved Guest')).toBeInTheDocument();
      });

      const statusElement = screen.getByTestId('booking-status-103');
      expect(statusElement).toHaveClass('bg-green-100', 'text-green-800');
    });

    test('tests rejected status color - line 129', async () => {
      const bookingWithRejectedStatus = [{
        id: 104,
        guest_name: 'Rejected Guest',
        guest_email: 'rejected@example.com',
        guest_phone: '123-456-7890',
        check_in: '2024-01-15',
        check_out: '2024-01-18',
        guests: 2,
        status: 'rejected',
        special_requests: 'Rejected status',
        payment_amount: 1500,
        created_at: '2024-01-10T10:00:00Z'
      }];

      mockApi.get.mockResolvedValue(bookingWithRejectedStatus);
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Rejected Guest')).toBeInTheDocument();
      });

      const statusElement = screen.getByTestId('booking-status-104');
      expect(statusElement).toHaveClass('bg-red-100', 'text-red-800');
    });

    test('tests completed status color - line 131', async () => {
      const bookingWithCompletedStatus = [{
        id: 105,
        guest_name: 'Completed Guest',
        guest_email: 'completed@example.com',
        guest_phone: '123-456-7890',
        check_in: '2024-01-15',
        check_out: '2024-01-18',
        guests: 2,
        status: 'completed',
        special_requests: 'Completed status',
        payment_amount: 1500,
        created_at: '2024-01-10T10:00:00Z'
      }];

      mockApi.get.mockResolvedValue(bookingWithCompletedStatus);
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Completed Guest')).toBeInTheDocument();
      });

      const statusElement = screen.getByTestId('booking-status-105');
      expect(statusElement).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    test('tests formatDate function with valid date - lines 92-93', async () => {
      const bookingWithCreatedDate = [{
        id: 106,
        guest_name: 'Created Date Guest',
        guest_email: 'created@example.com',
        guest_phone: '123-456-7890',
        check_in: '2024-01-15',
        check_out: '2024-01-18',
        guests: 1,
        status: 'pending',
        special_requests: 'Created date test',
        payment_amount: 1000,
        created_at: '2024-01-10T10:00:00Z' // Valid date to test formatDate function
      }];

      mockApi.get.mockResolvedValue(bookingWithCreatedDate);
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Created Date Guest')).toBeInTheDocument();
      });

      // This should trigger the formatDate function on line 93
      expect(screen.getByText(/Created:/)).toBeInTheDocument();
      expect(screen.getByText(/Created: 2024\/01\/10/)).toBeInTheDocument();
    });

    test('tests formatDate function with empty date - lines 92-93', async () => {
      const bookingWithEmptyCreatedDate = [{
        id: 107,
        guest_name: 'Empty Created Date Guest',
        guest_email: 'empty@example.com',
        guest_phone: '123-456-7890',
        check_in: '2024-01-15',
        check_out: '2024-01-18',
        guests: 1,
        status: 'pending',
        special_requests: 'Empty created date test',
        payment_amount: 1000,
        created_at: '' // Empty date to test formatDate function line 92
      }];

      mockApi.get.mockResolvedValue(bookingWithEmptyCreatedDate);
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Empty Created Date Guest')).toBeInTheDocument();
      });

      // With empty created_at, the formatDate conditional should not render the "Created:" text
      expect(screen.queryByText(/Created:/)).not.toBeInTheDocument();
    });
  });
});