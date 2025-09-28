import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DashboardStats from './DashboardStats';

describe('DashboardStats Component', () => {
  const mockStats = {
    stats: {
      total_bookings: 25,
      pending_bookings: 5,
      approved_bookings: 18,
      paid_bookings: 12,
      pending_payments: 8,
      total_revenue: 125000
    },
    recent_bookings: [
      {
        id: 1,
        guest_name: 'John Doe',
        check_in: '2024-01-15',
        status: 'approved',
        payment_status: 'paid'
      },
      {
        id: 2,
        guest_name: 'Jane Smith',
        check_in: '2024-01-20',
        status: 'pending',
        payment_status: 'pending'
      }
    ]
  };

  const mockProps = {
    stats: mockStats,
    onViewBookings: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders dashboard stats with all sections', () => {
      render(<DashboardStats {...mockProps} />);

      expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      expect(screen.getByText('Recent Bookings')).toBeInTheDocument();
    });

    test('renders when stats is null', () => {
      render(<DashboardStats stats={null} onViewBookings={mockProps.onViewBookings} />);

      expect(screen.queryByText('Dashboard Overview')).not.toBeInTheDocument();
    });

    test('renders when stats is undefined', () => {
      render(<DashboardStats onViewBookings={mockProps.onViewBookings} />);

      expect(screen.queryByText('Dashboard Overview')).not.toBeInTheDocument();
    });
  });

  describe('Stats Display', () => {
    test('displays total bookings correctly', () => {
      render(<DashboardStats {...mockProps} />);

      expect(screen.getByText('Total Bookings')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    test('displays booking status breakdown', () => {
      render(<DashboardStats {...mockProps} />);

      expect(screen.getByText('Pending Bookings')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Approved Bookings')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument();
      expect(screen.getByText('Paid Bookings')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    test('displays payment information', () => {
      render(<DashboardStats {...mockProps} />);

      expect(screen.getByText('Pending Payments')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    test('displays revenue information', () => {
      render(<DashboardStats {...mockProps} />);

      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('R 125 000,00')).toBeInTheDocument();
    });

    test('formats currency correctly with South African Rand', () => {
      render(<DashboardStats {...mockProps} />);

      expect(screen.getByText('R 125 000,00')).toBeInTheDocument();
    });
  });

  describe('Recent Bookings Section', () => {
    test('displays recent bookings header', () => {
      render(<DashboardStats {...mockProps} />);

      expect(screen.getByText('Recent Bookings')).toBeInTheDocument();
    });

    test('displays booking information in table format', () => {
      render(<DashboardStats {...mockProps} />);

      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('2024/01/15')).toBeInTheDocument();
      expect(screen.getByText('2024/01/20')).toBeInTheDocument();
    });

    test('displays booking status with correct styling', () => {
      render(<DashboardStats {...mockProps} />);

      const statuses = screen.getAllByText('approved');
      const approvedBookingStatus = statuses.find(status =>
        status.classList.contains('inline-flex') && status.classList.contains('px-2')
      );
      expect(approvedBookingStatus).toHaveClass('bg-green-100', 'text-green-800');

      const pendingStatuses = screen.getAllByText('pending');
      const pendingBookingStatus = pendingStatuses.find(status =>
        status.classList.contains('inline-flex') && status.classList.contains('px-2')
      );
      expect(pendingBookingStatus).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    test('displays payment status with correct styling', () => {
      render(<DashboardStats {...mockProps} />);

      const paidStatus = screen.getByText('paid');
      expect(paidStatus).toHaveClass('bg-green-100', 'text-green-800');

      const pendingPaymentStatus = screen.getAllByText('pending')[1]; // Second 'pending' is payment status
      expect(pendingPaymentStatus).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    test('handles empty recent bookings array', () => {
      const statsWithNoBookings = { ...mockStats, recent_bookings: [] };
      render(<DashboardStats stats={statsWithNoBookings} onViewBookings={mockProps.onViewBookings} />);

      expect(screen.getByText('Recent Bookings')).toBeInTheDocument();
      expect(screen.getByText('No recent bookings')).toBeInTheDocument();
    });

    test('handles missing recent bookings property', () => {
      const { recent_bookings, ...statsWithoutBookings } = mockStats;
      render(<DashboardStats stats={statsWithoutBookings} onViewBookings={mockProps.onViewBookings} />);

      // Component should handle missing recent_bookings gracefully
      expect(screen.getByText('Recent Bookings')).toBeInTheDocument();
      expect(screen.getByText('No recent bookings')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    test('renders View All Bookings button', () => {
      render(<DashboardStats {...mockProps} />);

      const viewButton = screen.getByRole('button', { name: /View All Bookings/i });
      expect(viewButton).toBeInTheDocument();
    });

    test('calls onViewBookings when View All Bookings is clicked', async () => {
      const user = userEvent.setup();
      render(<DashboardStats {...mockProps} />);

      const viewButton = screen.getByRole('button', { name: /View All Bookings/i });
      await user.click(viewButton);

      expect(mockProps.onViewBookings).toHaveBeenCalledTimes(1);
    });

    test('renders View Pending button when there are pending bookings', () => {
      render(<DashboardStats {...mockProps} />);

      const viewPendingButton = screen.getByRole('button', { name: /View Pending/i });
      expect(viewPendingButton).toBeInTheDocument();
    });

    test('calls onViewBookings when View Pending is clicked', async () => {
      const user = userEvent.setup();
      render(<DashboardStats {...mockProps} />);

      const viewPendingButton = screen.getByRole('button', { name: /View Pending/i });
      await user.click(viewPendingButton);

      expect(mockProps.onViewBookings).toHaveBeenCalledTimes(1);
    });

    test('does not show View Pending button when no pending bookings', () => {
      const statsWithNoPending = {
        ...mockStats,
        stats: { ...mockStats.stats, pending_bookings: 0 }
      };

      render(<DashboardStats stats={statsWithNoPending} onViewBookings={mockProps.onViewBookings} />);

      expect(screen.queryByRole('button', { name: /View Pending/i })).not.toBeInTheDocument();
    });

    test('View All Bookings button is accessible', () => {
      render(<DashboardStats {...mockProps} />);

      const viewButton = screen.getByRole('button', { name: /View All Bookings/i });
      expect(viewButton).not.toBeDisabled();
      expect(viewButton).toBeVisible();
    });
  });

  describe('Different Status Types', () => {
    test('displays cancelled booking status correctly', () => {
      const statsWithCancelled = {
        ...mockStats,
        recent_bookings: [
          {
            id: 3,
            guest_name: 'Bob Johnson',
            check_in: '2024-01-25',
            status: 'cancelled',
            payment_status: 'refunded'
          }
        ]
      };

      render(<DashboardStats stats={statsWithCancelled} onViewBookings={mockProps.onViewBookings} />);

      const cancelledStatus = screen.getByText('cancelled');
      expect(cancelledStatus).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    test('displays completed booking status correctly', () => {
      const statsWithCompleted = {
        ...mockStats,
        recent_bookings: [
          {
            id: 4,
            guest_name: 'Alice Brown',
            check_in: '2024-01-10',
            status: 'completed',
            payment_status: 'paid'
          }
        ]
      };

      render(<DashboardStats stats={statsWithCompleted} onViewBookings={mockProps.onViewBookings} />);

      const completedStatus = screen.getByText('completed');
      expect(completedStatus).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    test('displays rejected booking status correctly', () => {
      const statsWithRejected = {
        ...mockStats,
        recent_bookings: [
          {
            id: 5,
            guest_name: 'Charlie Wilson',
            check_in: '2024-01-30',
            status: 'rejected',
            payment_status: 'cancelled'
          }
        ]
      };

      render(<DashboardStats stats={statsWithRejected} onViewBookings={mockProps.onViewBookings} />);

      const rejectedStatus = screen.getByText('rejected');
      expect(rejectedStatus).toHaveClass('bg-red-100', 'text-red-800');
    });

    test('displays partial payment status correctly', () => {
      const statsWithPartial = {
        ...mockStats,
        recent_bookings: [
          {
            id: 6,
            guest_name: 'David Lee',
            check_in: '2024-02-01',
            status: 'approved',
            payment_status: 'partial'
          }
        ]
      };

      render(<DashboardStats stats={statsWithPartial} onViewBookings={mockProps.onViewBookings} />);

      const partialStatus = screen.getByText('partial');
      expect(partialStatus).toHaveClass('bg-orange-100', 'text-orange-800');
    });

    test('displays refunded payment status correctly', () => {
      const statsWithRefunded = {
        ...mockStats,
        recent_bookings: [
          {
            id: 7,
            guest_name: 'Eva Martinez',
            check_in: '2024-02-05',
            status: 'cancelled',
            payment_status: 'refunded'
          }
        ]
      };

      render(<DashboardStats stats={statsWithRefunded} onViewBookings={mockProps.onViewBookings} />);

      const refundedStatus = screen.getByText('refunded');
      expect(refundedStatus).toHaveClass('bg-purple-100', 'text-purple-800');
    });

    test('displays unknown status with default styling', () => {
      const statsWithUnknownStatus = {
        ...mockStats,
        recent_bookings: [
          {
            id: 8,
            guest_name: 'Frank Miller',
            check_in: '2024-02-10',
            status: 'unknown_status',
            payment_status: 'unknown_payment'
          }
        ]
      };

      render(<DashboardStats stats={statsWithUnknownStatus} onViewBookings={mockProps.onViewBookings} />);

      const unknownStatus = screen.getByText('unknown_status');
      expect(unknownStatus).toHaveClass('bg-gray-100', 'text-gray-800');

      const unknownPayment = screen.getByText('unknown_payment');
      expect(unknownPayment).toHaveClass('bg-gray-100', 'text-gray-800');
    });
  });

  describe('Data Edge Cases', () => {
    test('handles zero values correctly', () => {
      const statsWithZeros = {
        stats: {
          total_bookings: 0,
          pending_bookings: 0,
          approved_bookings: 0,
          paid_bookings: 0,
          pending_payments: 0,
          total_revenue: 0
        },
        recent_bookings: []
      };

      render(<DashboardStats stats={statsWithZeros} onViewBookings={mockProps.onViewBookings} />);

      // There are multiple '0' values, so just check one exists
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
      expect(screen.getByText('R 0,00')).toBeInTheDocument();
    });

    test('handles large numbers correctly', () => {
      const statsWithLargeNumbers = {
        stats: {
          total_bookings: 1000,
          pending_bookings: 100,
          approved_bookings: 800,
          paid_bookings: 750,
          pending_payments: 150,
          total_revenue: 15000000
        },
        recent_bookings: []
      };

      render(<DashboardStats stats={statsWithLargeNumbers} onViewBookings={mockProps.onViewBookings} />);

      expect(screen.getByText('1000')).toBeInTheDocument();
      expect(screen.getByText('R 15 000 000,00')).toBeInTheDocument();
    });

    test('handles missing optional properties', () => {
      const minimalStats = {
        stats: {
          total_bookings: 10
        },
        recent_bookings: []
      };

      render(<DashboardStats stats={minimalStats} onViewBookings={mockProps.onViewBookings} />);

      expect(screen.getByText('10')).toBeInTheDocument();
      // Should handle undefined stats gracefully
    });
  });

  describe('Component Structure and CSS', () => {
    test('applies correct CSS classes to main container', () => {
      const { container } = render(<DashboardStats {...mockProps} />);

      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('space-y-8');
    });

    test('applies correct styling to stats cards', () => {
      render(<DashboardStats {...mockProps} />);

      const totalBookingsCard = screen.getByText('Total Bookings').closest('.bg-white');
      expect(totalBookingsCard).toHaveClass('bg-white', 'rounded-xl', 'shadow-brown', 'p-6');
    });

    test('recent bookings section has correct structure', () => {
      render(<DashboardStats {...mockProps} />);

      const recentBookingsSection = screen.getByText('Recent Bookings').closest('.bg-white');
      expect(recentBookingsSection).toHaveClass('bg-white', 'rounded-xl', 'shadow-brown');
    });

    test('table has correct structure', () => {
      render(<DashboardStats {...mockProps} />);

      const table = screen.getByRole('table');
      expect(table).toHaveClass('min-w-full', 'divide-y', 'divide-gray-200');

      const thead = table.querySelector('thead');
      expect(thead).toHaveClass('bg-gray-50');
    });
  });

  describe('Responsive Design', () => {
    test('stats grid has responsive classes', () => {
      render(<DashboardStats {...mockProps} />);

      const statsGrid = screen.getByText('Total Bookings').closest('.grid');
      expect(statsGrid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });

    test('recent bookings table has overflow handling', () => {
      render(<DashboardStats {...mockProps} />);

      const tableContainer = screen.getByRole('table').closest('.overflow-x-auto');
      expect(tableContainer).toHaveClass('overflow-x-auto');
    });
  });
});