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
      guestName: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      checkIn: '2024-01-15',
      checkOut: '2024-01-18',
      guests: 2,
      status: 'pending',
      specialRequests: 'Late check-in',
      totalAmount: 2550,
      createdAt: '2024-01-10T10:00:00Z'
    },
    {
      id: 2,
      guestName: 'Jane Smith',
      email: 'jane@example.com',
      phone: '098-765-4321',
      checkIn: '2024-01-20',
      checkOut: '2024-01-23',
      guests: 1,
      status: 'confirmed',
      specialRequests: null,
      totalAmount: 2550,
      createdAt: '2024-01-12T14:30:00Z'
    },
    {
      id: 3,
      guestName: 'Bob Johnson',
      email: 'bob@example.com',
      phone: '555-123-4567',
      checkIn: '2024-01-25',
      checkOut: '2024-01-28',
      guests: 3,
      status: 'cancelled',
      specialRequests: 'Wheelchair access',
      totalAmount: 2550,
      createdAt: '2024-01-14T09:15:00Z'
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

      expect(mockApi.get).toHaveBeenCalledWith('/admin/bookings');
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
      expect(screen.getByText('Jan 15 - Jan 18')).toBeInTheDocument();
      expect(screen.getByText('2 guests')).toBeInTheDocument();
      expect(screen.getByText('R2,550')).toBeInTheDocument();
    });

    test('displays booking status with correct styling', async () => {
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument();
      });

      const pendingStatus = screen.getByText('Pending');
      expect(pendingStatus).toHaveClass('bg-yellow-100', 'text-yellow-800');

      const confirmedStatus = screen.getByText('Confirmed');
      expect(confirmedStatus).toHaveClass('bg-green-100', 'text-green-800');

      const cancelledStatus = screen.getByText('Cancelled');
      expect(cancelledStatus).toHaveClass('bg-red-100', 'text-red-800');
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
      expect(screen.getByRole('combobox')).toBeInTheDocument(); // Status filter dropdown
    });

    test('filters bookings by search term', async () => {
      const user = userEvent.setup();
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search bookings...');
      await user.type(searchInput, 'John');

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
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

      const statusFilter = screen.getByRole('combobox');
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
      const statusFilter = screen.getByRole('combobox');
      await user.selectOptions(statusFilter, 'pending');
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();

      // Clear filter
      await user.selectOptions(statusFilter, 'all');
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
      expect(screen.getByRole('combobox', { name: /sort/i })).toBeInTheDocument();
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

      const sortSelect = screen.getByRole('combobox', { name: /sort/i });
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

      const sortSelect = screen.getByRole('combobox', { name: /sort/i });
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

      const bookingCard = screen.getByText('John Doe').closest('.cursor-pointer');
      await user.click(bookingCard);

      expect(mockProps.onSelectBooking).toHaveBeenCalledWith(mockBookings[0]);
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

      expect(mockApi.put).toHaveBeenCalledWith('/admin/bookings/1/status', { status: 'cancelled' });
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
        expect(screen.getByText('Jan 15 - Jan 18')).toBeInTheDocument();
      });

      expect(screen.getByText('Jan 20 - Jan 23')).toBeInTheDocument();
      expect(screen.getByText('Jan 25 - Jan 28')).toBeInTheDocument();
    });

    test('formats currency correctly', async () => {
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getAllByText('R2,550')).toHaveLength(3);
      });
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
      expect(screen.getByText('No special requests')).toBeInTheDocument();
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
        guestName: 'Very Long Guest Name That Might Overflow The Container Width'
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
        guestName: 'Incomplete Guest',
        email: null,
        phone: undefined,
        checkIn: '2024-01-15',
        checkOut: '2024-01-18',
        guests: null,
        status: 'pending',
        specialRequests: '',
        totalAmount: 0,
        createdAt: '2024-01-10T10:00:00Z'
      }];

      mockApi.get.mockResolvedValue(incompleteBooking);
      render(<BookingList {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Incomplete Guest')).toBeInTheDocument();
      });

      expect(screen.getByText('No email provided')).toBeInTheDocument();
      expect(screen.getByText('No phone provided')).toBeInTheDocument();
      expect(screen.getByText('R0')).toBeInTheDocument();
    });
  });
});