import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AdminDashboard from './AdminDashboard';

// Mock the child components
jest.mock('./BookingList', () => {
  return function MockBookingList({ onSelectBooking, onBack }) {
    return (
      <div data-testid="booking-list">
        <h2>Booking List Component</h2>
        <button onClick={() => onSelectBooking({ id: 1, name: 'Test Booking' })}>
          Select Booking
        </button>
        <button onClick={onBack}>Back to Dashboard</button>
      </div>
    );
  };
});

jest.mock('./BookingDetails', () => {
  return function MockBookingDetails({ bookingId, onBack, onUpdate }) {
    return (
      <div data-testid="booking-details">
        <h2>Booking Details Component</h2>
        <p>Booking ID: {bookingId}</p>
        <button onClick={onBack}>Back to List</button>
        <button onClick={onUpdate}>Update</button>
      </div>
    );
  };
});

jest.mock('./DashboardStats', () => {
  return function MockDashboardStats({ stats, onViewBookings }) {
    return (
      <div data-testid="dashboard-stats">
        <h2>Dashboard Stats Component</h2>
        {stats && <p>Stats loaded: {JSON.stringify(stats)}</p>}
        <button onClick={onViewBookings}>View Bookings</button>
      </div>
    );
  };
});

// Mock the hooks
const mockUseAuth = jest.fn();
const mockUseApi = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../services/apiService', () => ({
  useApi: () => mockUseApi(),
}));

describe('AdminDashboard Component', () => {
  const mockApi = {
    get: jest.fn(),
  };

  const mockAuthData = {
    user: { name: 'Admin User', email: 'admin@example.com' },
    isAdmin: jest.fn().mockReturnValue(true),
    logout: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(mockAuthData);
    mockUseApi.mockReturnValue(mockApi);
    mockApi.get.mockResolvedValue({ totalBookings: 10, revenue: 5000 });
  });

  describe('Initial Rendering', () => {
    test('renders admin dashboard with header', () => {
      render(<AdminDashboard />);

      expect(screen.getByText('17 @ Peppertree Admin')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Bookings')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    test('displays user information in header', () => {
      render(<AdminDashboard />);

      expect(screen.getByText(/Welcome,/)).toBeInTheDocument();
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    test('renders navigation buttons with correct initial state', () => {
      render(<AdminDashboard />);

      const dashboardBtn = screen.getByRole('button', { name: /Dashboard/i });
      const bookingsBtn = screen.getByRole('button', { name: /Bookings/i });

      expect(dashboardBtn).toHaveClass('bg-primary', 'text-white');
      expect(bookingsBtn).toHaveClass('text-gray-500');
    });

    test('renders mobile navigation', () => {
      render(<AdminDashboard />);

      const mobileNavButtons = screen.getAllByRole('button', { name: /Dashboard/i });
      expect(mobileNavButtons).toHaveLength(2); // Desktop and mobile versions

      const mobileBookingButtons = screen.getAllByRole('button', { name: /Bookings/i });
      expect(mobileBookingButtons).toHaveLength(2); // Desktop and mobile versions
    });
  });

  describe('Authentication and Authorization', () => {
    test('shows error when user is not admin', async () => {
      mockAuthData.isAdmin.mockReturnValue(false);
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('You do not have permission to access this page')).toBeInTheDocument();
      });

      expect(mockApi.get).not.toHaveBeenCalled();
    });

    test('fetches dashboard stats when user is admin', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/admin/dashboard/stats');
      });
    });

    test('handles logout correctly', async () => {
      const user = userEvent.setup();
      render(<AdminDashboard />);

      const logoutButton = screen.getByRole('button', { name: /Logout/i });
      await user.click(logoutButton);

      expect(mockAuthData.logout).toHaveBeenCalled();
    });

    test('handles logout error gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockAuthData.logout.mockRejectedValue(new Error('Logout failed'));

      render(<AdminDashboard />);

      const logoutButton = screen.getByRole('button', { name: /Logout/i });
      await user.click(logoutButton);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Data Loading and Error Handling', () => {
    test('shows loading state initially', () => {
      render(<AdminDashboard />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument(); // Loading spinner
    });

    test('hides loading state after data loads', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    test('displays error when stats fetch fails', async () => {
      mockApi.get.mockRejectedValue(new Error('API Error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load dashboard statistics')).toBeInTheDocument();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch dashboard stats:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    test('allows retry when error occurs', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('API Error'));
      mockApi.get.mockResolvedValueOnce({ totalBookings: 5 });
      const user = userEvent.setup();

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load dashboard statistics')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /Try again/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.queryByText('Failed to load dashboard statistics')).not.toBeInTheDocument();
      });

      expect(mockApi.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Navigation Between Views', () => {
    beforeEach(async () => {
      render(<AdminDashboard />);
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    test('defaults to dashboard view', () => {
      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
    });

    test('switches to bookings view when bookings button is clicked', async () => {
      const user = userEvent.setup();
      const bookingsButton = screen.getByRole('button', { name: /Bookings/i });

      await user.click(bookingsButton);

      expect(screen.getByTestId('booking-list')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-stats')).not.toBeInTheDocument();
    });

    test('switches back to dashboard view when dashboard button is clicked', async () => {
      const user = userEvent.setup();

      // Switch to bookings first
      await user.click(screen.getByRole('button', { name: /Bookings/i }));
      expect(screen.getByTestId('booking-list')).toBeInTheDocument();

      // Switch back to dashboard
      await user.click(screen.getByRole('button', { name: /Dashboard/i }));
      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
      expect(screen.queryByTestId('booking-list')).not.toBeInTheDocument();
    });

    test('updates navigation button styles when view changes', async () => {
      const user = userEvent.setup();
      const dashboardBtn = screen.getByRole('button', { name: /Dashboard/i });
      const bookingsBtn = screen.getByRole('button', { name: /Bookings/i });

      // Initially dashboard is active
      expect(dashboardBtn).toHaveClass('bg-primary', 'text-white');
      expect(bookingsBtn).toHaveClass('text-gray-500');

      // Switch to bookings
      await user.click(bookingsBtn);
      expect(bookingsBtn).toHaveClass('bg-primary', 'text-white');
      expect(dashboardBtn).toHaveClass('text-gray-500');
    });
  });

  describe('Booking Management Flow', () => {
    beforeEach(async () => {
      render(<AdminDashboard />);
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    test('navigates from dashboard to bookings via DashboardStats', async () => {
      const user = userEvent.setup();

      // Click "View Bookings" in DashboardStats
      const viewBookingsButton = screen.getByRole('button', { name: /View Bookings/i });
      await user.click(viewBookingsButton);

      expect(screen.getByTestId('booking-list')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-stats')).not.toBeInTheDocument();
    });

    test('handles booking selection from BookingList', async () => {
      const user = userEvent.setup();

      // Navigate to bookings
      await user.click(screen.getByRole('button', { name: /Bookings/i }));

      // Select a booking
      const selectBookingButton = screen.getByRole('button', { name: /Select Booking/i });
      await user.click(selectBookingButton);

      expect(screen.getByTestId('booking-details')).toBeInTheDocument();
      expect(screen.getByText('Booking ID: 1')).toBeInTheDocument();
      expect(screen.queryByTestId('booking-list')).not.toBeInTheDocument();
    });

    test('handles back navigation from BookingDetails to BookingList', async () => {
      const user = userEvent.setup();

      // Navigate to bookings and select one
      await user.click(screen.getByRole('button', { name: /Bookings/i }));
      await user.click(screen.getByRole('button', { name: /Select Booking/i }));

      expect(screen.getByTestId('booking-details')).toBeInTheDocument();

      // Click back to list
      const backToListButton = screen.getByRole('button', { name: /Back to List/i });
      await user.click(backToListButton);

      expect(screen.getByTestId('booking-list')).toBeInTheDocument();
      expect(screen.queryByTestId('booking-details')).not.toBeInTheDocument();
    });

    test('handles back navigation from BookingList to Dashboard', async () => {
      const user = userEvent.setup();

      // Navigate to bookings
      await user.click(screen.getByRole('button', { name: /Bookings/i }));

      // Click back to dashboard from BookingList
      const backToDashboardButton = screen.getByRole('button', { name: /Back to Dashboard/i });
      await user.click(backToDashboardButton);

      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
      expect(screen.queryByTestId('booking-list')).not.toBeInTheDocument();
      expect(mockApi.get).toHaveBeenCalledWith('/admin/dashboard/stats');
    });

    test('handles update callback from BookingDetails', async () => {
      const user = userEvent.setup();

      // Navigate to booking details
      await user.click(screen.getByRole('button', { name: /Bookings/i }));
      await user.click(screen.getByRole('button', { name: /Select Booking/i }));

      // Trigger update
      const updateButton = screen.getByRole('button', { name: /Update/i });
      await user.click(updateButton);

      expect(mockApi.get).toHaveBeenCalledWith('/admin/dashboard/stats');
    });
  });

  describe('User Display Variations', () => {
    test('displays preferred_username when name is not available', () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthData,
        user: { preferred_username: 'admin123', email: 'admin@example.com' },
      });

      render(<AdminDashboard />);

      expect(screen.getByText('admin123')).toBeInTheDocument();
    });

    test('displays email when name and preferred_username are not available', () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthData,
        user: { email: 'admin@example.com' },
      });

      render(<AdminDashboard />);

      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    });

    test('handles missing user gracefully', () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthData,
        user: null,
      });

      render(<AdminDashboard />);

      expect(screen.getByText(/Welcome,/)).toBeInTheDocument();
      // Should not crash when user is null
    });
  });

  describe('Component State Management', () => {
    test('resets selected booking when navigating back to dashboard', async () => {
      const user = userEvent.setup();
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Select a booking
      await user.click(screen.getByRole('button', { name: /Bookings/i }));
      await user.click(screen.getByRole('button', { name: /Select Booking/i }));

      expect(screen.getByTestId('booking-details')).toBeInTheDocument();

      // Navigate back to dashboard
      await user.click(screen.getByRole('button', { name: /Dashboard/i }));

      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();

      // Navigate to bookings again - should show list, not details
      await user.click(screen.getByRole('button', { name: /Bookings/i }));
      expect(screen.getByTestId('booking-list')).toBeInTheDocument();
      expect(screen.queryByTestId('booking-details')).not.toBeInTheDocument();
    });

    test('maintains view state during error and retry', async () => {
      const user = userEvent.setup();
      mockApi.get.mockRejectedValueOnce(new Error('API Error'));
      mockApi.get.mockResolvedValueOnce({ totalBookings: 5 });

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load dashboard statistics')).toBeInTheDocument();
      });

      // Switch to bookings view while in error state
      await user.click(screen.getByRole('button', { name: /Bookings/i }));
      expect(screen.getByTestId('booking-list')).toBeInTheDocument();

      // Switch back to dashboard and retry
      await user.click(screen.getByRole('button', { name: /Dashboard/i }));
      const retryButton = screen.getByRole('button', { name: /Try again/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA roles and labels', () => {
      render(<AdminDashboard />);

      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('navigation buttons are keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const dashboardButton = screen.getByRole('button', { name: /Dashboard/i });
      const bookingsButton = screen.getByRole('button', { name: /Bookings/i });

      // Test keyboard navigation
      await user.tab();
      expect(dashboardButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();

      await user.tab();
      expect(bookingsButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(screen.getByTestId('booking-list')).toBeInTheDocument();
    });
  });
});