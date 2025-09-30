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
const mockUseSecureApi = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../services/secureApiService', () => ({
  useSecureApi: () => mockUseSecureApi(),
}));

describe('AdminDashboard Component', () => {
  const mockSecureApi = {
    getSecureDashboardStats: jest.fn(),
  };

  const mockAuthData = {
    user: { name: 'Admin User', email: 'admin@example.com' },
    isAdmin: jest.fn().mockReturnValue(true),
    logout: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset all mock functions
    mockAuthData.isAdmin = jest.fn().mockReturnValue(true);
    mockAuthData.logout = jest.fn();

    mockUseAuth.mockReturnValue(mockAuthData);
    mockUseSecureApi.mockReturnValue(mockSecureApi);

    // Ensure API mock returns a resolved promise
    mockSecureApi.getSecureDashboardStats.mockImplementation(() =>
      Promise.resolve({ totalBookings: 10, revenue: 5000 })
    );
  });

  describe('Initial Rendering', () => {
    test('renders admin dashboard with header', async () => {
      render(<AdminDashboard />);

      expect(screen.getByText('17 @ Peppertree Admin')).toBeInTheDocument();

      // Use getAllByText since there are desktop and mobile versions
      const dashboardButtons = screen.getAllByText('Dashboard');
      expect(dashboardButtons).toHaveLength(2);

      const bookingsButtons = screen.getAllByText('Bookings');
      expect(bookingsButtons).toHaveLength(2);

      expect(screen.getByText('Logout')).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    test('displays user information in header', () => {
      render(<AdminDashboard />);

      expect(screen.getByText(/Welcome,/)).toBeInTheDocument();
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    test('renders navigation buttons with correct initial state', async () => {
      render(<AdminDashboard />);

      // Get desktop navigation buttons specifically
      const desktopNav = screen.getByRole('navigation');
      const dashboardBtns = screen.getAllByRole('button', { name: /Dashboard/i });
      const bookingsBtns = screen.getAllByRole('button', { name: /Bookings/i });

      // Check that the first (desktop) dashboard button has active styling
      expect(dashboardBtns[0]).toHaveClass('bg-primary', 'text-white');
      expect(bookingsBtns[0]).toHaveClass('text-gray-500');

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
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

      expect(mockSecureApi.getSecureDashboardStats).not.toHaveBeenCalled();
    });

    test('fetches dashboard stats when user is admin', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(mockSecureApi.getSecureDashboardStats).toHaveBeenCalled();
      });

      // Wait for loading to complete and stats to be displayed
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
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
      // Check for the spinner by its CSS class
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    test('hides loading state after data loads', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    test('displays error when stats fetch fails', async () => {
      mockSecureApi.getSecureDashboardStats.mockRejectedValue(new Error('API Error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load dashboard statistics')).toBeInTheDocument();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch dashboard stats:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    test('allows retry when error occurs', async () => {
      mockSecureApi.getSecureDashboardStats.mockRejectedValueOnce(new Error('API Error'));
      mockSecureApi.getSecureDashboardStats.mockResolvedValueOnce({ totalBookings: 5 });
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

      expect(mockSecureApi.getSecureDashboardStats).toHaveBeenCalledTimes(2);
    });
  });

  describe('Navigation Between Views', () => {
    beforeEach(async () => {
      render(<AdminDashboard />);
      // Wait for API call to complete and stats to be loaded
      await waitFor(() => {
        expect(mockSecureApi.getSecureDashboardStats).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
      });
    });

    test('defaults to dashboard view', () => {
      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
    });

    test('switches to bookings view when bookings button is clicked', async () => {
      const user = userEvent.setup();
      const bookingsButtons = screen.getAllByRole('button', { name: /Bookings/i });
      const bookingsButton = bookingsButtons[0]; // Use first (desktop) button

      await user.click(bookingsButton);

      expect(screen.getByTestId('booking-list')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-stats')).not.toBeInTheDocument();
    });

    test('switches back to dashboard view when dashboard button is clicked', async () => {
      const user = userEvent.setup();

      // Switch to bookings first
      const bookingsButtons = screen.getAllByRole('button', { name: /Bookings/i });
      await user.click(bookingsButtons[0]);
      expect(screen.getByTestId('booking-list')).toBeInTheDocument();

      // Switch back to dashboard
      const dashboardButtons = screen.getAllByRole('button', { name: /Dashboard/i });
      await user.click(dashboardButtons[0]);
      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
      expect(screen.queryByTestId('booking-list')).not.toBeInTheDocument();
    });

    test('updates navigation button styles when view changes', async () => {
      const user = userEvent.setup();
      const dashboardBtns = screen.getAllByRole('button', { name: /Dashboard/i });
      const bookingsBtns = screen.getAllByRole('button', { name: /Bookings/i });
      const dashboardBtn = dashboardBtns[0];
      const bookingsBtn = bookingsBtns[0];

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
      // Wait for API call to complete and stats to be loaded
      await waitFor(() => {
        expect(mockSecureApi.getSecureDashboardStats).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
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
      const bookingsButtons = screen.getAllByRole('button', { name: /Bookings/i });
      await user.click(bookingsButtons[0]);

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
      const bookingsButtons = screen.getAllByRole('button', { name: /Bookings/i });
      await user.click(bookingsButtons[0]);
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
      const bookingsButtons = screen.getAllByRole('button', { name: /Bookings/i });
      await user.click(bookingsButtons[0]);

      // Click back to dashboard from BookingList
      const backToDashboardButton = screen.getByRole('button', { name: /Back to Dashboard/i });
      await user.click(backToDashboardButton);

      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
      expect(screen.queryByTestId('booking-list')).not.toBeInTheDocument();
      expect(mockSecureApi.getSecureDashboardStats).toHaveBeenCalled();
    });

    test('handles update callback from BookingDetails', async () => {
      const user = userEvent.setup();

      // Navigate to booking details
      const bookingsButtons = screen.getAllByRole('button', { name: /Bookings/i });
      await user.click(bookingsButtons[0]);
      await user.click(screen.getByRole('button', { name: /Select Booking/i }));

      // Trigger update
      const updateButton = screen.getByRole('button', { name: /Update/i });
      await user.click(updateButton);

      expect(mockSecureApi.getSecureDashboardStats).toHaveBeenCalled();
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
    beforeEach(async () => {
      render(<AdminDashboard />);
      // Wait for API call to complete and stats to be loaded
      await waitFor(() => {
        expect(mockSecureApi.getSecureDashboardStats).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
      });
    });

    test('resets selected booking when navigating back to dashboard', async () => {
      const user = userEvent.setup();

      // Navigate to bookings view
      const bookingsButtons = screen.getAllByRole('button', { name: /Bookings/i });
      await user.click(bookingsButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('booking-list')).toBeInTheDocument();
      });

      // Select a booking (simulate clicking on a booking in the list)
      await user.click(screen.getByRole('button', { name: /Select Booking/i }));

      await waitFor(() => {
        expect(screen.getByTestId('booking-details')).toBeInTheDocument();
      });

      // Navigate back to dashboard using the navigation button
      const dashboardButtons = screen.getAllByRole('button', { name: /Dashboard/i });
      await user.click(dashboardButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
      });

      // Navigate to bookings again - should show list, not details since selectedBooking should be reset
      await user.click(bookingsButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('booking-list')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('booking-details')).not.toBeInTheDocument();
    });

    test('maintains view state during error and retry', async () => {
      const user = userEvent.setup();

      // Navigate to bookings view first
      const bookingsButtons = screen.getAllByRole('button', { name: /Bookings/i });
      await user.click(bookingsButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('booking-list')).toBeInTheDocument();
      });

      // Set up API error for next dashboard navigation
      mockSecureApi.getSecureDashboardStats.mockRejectedValueOnce(new Error('API Error'));

      // Navigate to dashboard from bookings - this will trigger fetchDashboardStats
      const dashboardButtons = screen.getAllByRole('button', { name: /Dashboard/i });
      await user.click(dashboardButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Failed to load dashboard statistics')).toBeInTheDocument();
      });

      // Should still be able to navigate to bookings despite error
      await user.click(bookingsButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('booking-list')).toBeInTheDocument();
      });

      // Navigate back to dashboard - the error should be gone and data should show
      await user.click(dashboardButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
        expect(screen.queryByText('Failed to load dashboard statistics')).not.toBeInTheDocument();
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
        expect(screen.queryByText('Loading..')).not.toBeInTheDocument();
      });

      const dashboardButtons = screen.getAllByRole('button', { name: /Dashboard/i });
      const bookingsButtons = screen.getAllByRole('button', { name: /Bookings/i });
      const dashboardButton = dashboardButtons[0];
      const bookingsButton = bookingsButtons[0];

      // Test keyboard navigation - focus on dashboard button and activate it
      dashboardButton.focus();
      expect(dashboardButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();

      // Focus on bookings button and activate it
      bookingsButton.focus();
      expect(bookingsButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(screen.getByTestId('booking-list')).toBeInTheDocument();
    });

    test('mobile navigation buttons work correctly', async () => {
      const user = userEvent.setup();
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const dashboardButtons = screen.getAllByRole('button', { name: /Dashboard/i });
      const bookingsButtons = screen.getAllByRole('button', { name: /Bookings/i });

      // Test mobile dashboard button (second button in array)
      const mobileDashboardButton = dashboardButtons[1];
      const mobileBookingsButton = bookingsButtons[1];

      // Click mobile bookings button
      await user.click(mobileBookingsButton);
      expect(screen.getByTestId('booking-list')).toBeInTheDocument();

      // Click mobile dashboard button
      await user.click(mobileDashboardButton);
      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
    });
  });
});