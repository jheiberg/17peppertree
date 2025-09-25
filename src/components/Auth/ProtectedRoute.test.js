/**
 * Comprehensive tests for ProtectedRoute component
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';

// Mock the AuthContext
jest.mock('../../contexts/AuthContext');
const mockUseAuth = useAuth;

// Mock location
const mockLocation = {
  pathname: '/admin/dashboard',
  search: '?tab=users',
  state: null,
  key: 'default'
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to, replace }) => (
    <div data-testid="navigate" data-to={to} data-replace={replace?.toString()}>
      Navigate to {to}
    </div>
  ),
  useLocation: () => mockLocation
}));

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

// Mock window.location
delete window.location;
window.location = { href: '' };

describe('ProtectedRoute Component', () => {
  const mockLogout = jest.fn();
  const mockIsAdmin = jest.fn();

  const TestChild = () => <div data-testid="protected-content">Protected Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.clear();
    window.location.href = '';

    // Default mock auth context - authenticated user
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      isAdmin: mockIsAdmin,
      initialized: true,
      user: {
        preferred_username: 'testuser',
        email: 'test@example.com',
        realm_access: { roles: ['user'] },
        resource_access: { 'peppertree-admin': { roles: [] } }
      },
      logout: mockLogout,
      login: jest.fn(),
      getAccessToken: jest.fn(),
      handleCallback: jest.fn()
    });

    mockIsAdmin.mockReturnValue(false);
  });

  const renderWithRouter = (component: React.ReactNode) => {
    return render(
      <MemoryRouter>
        {component}
      </MemoryRouter>
    );
  };

  describe('Loading States', () => {
    test('renders loading state when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: true,
        isAdmin: mockIsAdmin,
        initialized: false,
        user: null,
        logout: mockLogout,
        login: jest.fn(),
        getAccessToken: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('border-4', 'border-primary');
    });

    test('renders loading state when not initialized', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
        isAdmin: mockIsAdmin,
        initialized: false, // Not initialized
        user: { preferred_username: 'testuser' },
        logout: mockLogout,
        login: jest.fn(),
        getAccessToken: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    test('loading state has correct styling', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: true,
        isAdmin: mockIsAdmin,
        initialized: false,
        user: null,
        logout: mockLogout,
        login: jest.fn(),
        getAccessToken: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      );

      const container = screen.getByText('Loading...').closest('.min-h-screen');
      expect(container).toHaveClass('bg-gradient-to-br', 'from-primary', 'to-dark-brown');

      const card = screen.getByText('Loading...').closest('.bg-white');
      expect(card).toHaveClass('rounded-2xl', 'shadow-brown');
    });
  });

  describe('Unauthenticated Access', () => {
    test('redirects to login when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: false,
        isAdmin: mockIsAdmin,
        initialized: true,
        user: null,
        logout: mockLogout,
        login: jest.fn(),
        getAccessToken: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-replace', 'true');
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    test('stores return URL in sessionStorage when redirecting', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: false,
        isAdmin: mockIsAdmin,
        initialized: true,
        user: null,
        logout: mockLogout,
        login: jest.fn(),
        getAccessToken: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      );

      expect(mockSessionStorage.getItem('returnTo')).toBe('/admin/dashboard?tab=users');
    });

    test('handles empty search parameters in return URL', () => {
      // Modify mock location to have no search
      const originalLocation = mockLocation;
      mockLocation.search = '';

      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: false,
        isAdmin: mockIsAdmin,
        initialized: true,
        user: null,
        logout: mockLogout,
        login: jest.fn(),
        getAccessToken: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      );

      expect(mockSessionStorage.getItem('returnTo')).toBe('/admin/dashboard');

      // Restore original location
      Object.assign(mockLocation, originalLocation);
    });
  });

  describe('Admin Protection', () => {
    test('renders content for admin user', () => {
      mockIsAdmin.mockReturnValue(true);

      renderWithRouter(
        <ProtectedRoute requireAdmin={true}>
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    });

    test('denies access to non-admin user', () => {
      mockIsAdmin.mockReturnValue(false);

      renderWithRouter(
        <ProtectedRoute requireAdmin={true}>
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText('You do not have permission to access this area.')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    test('access denied page shows user information', () => {
      mockIsAdmin.mockReturnValue(false);

      renderWithRouter(
        <ProtectedRoute requireAdmin={true}>
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByText('Signed in as:')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    test('access denied page shows email when no username', () => {
      mockIsAdmin.mockReturnValue(false);
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
        isAdmin: mockIsAdmin,
        initialized: true,
        user: {
          email: 'user@example.com',
          realm_access: { roles: ['user'] }
        },
        logout: mockLogout,
        login: jest.fn(),
        getAccessToken: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter(
        <ProtectedRoute requireAdmin={true}>
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });

    test('access denied page has correct styling', () => {
      mockIsAdmin.mockReturnValue(false);

      renderWithRouter(
        <ProtectedRoute requireAdmin={true}>
          <TestChild />
        </ProtectedRoute>
      );

      const icon = document.querySelector('.fa-exclamation-triangle');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-6xl', 'text-red-500');

      const heading = screen.getByText('Access Denied');
      expect(heading).toHaveClass('text-2xl', 'font-display', 'font-bold', 'text-red-600');
    });

    test('access denied page buttons work correctly', async () => {
      const user = userEvent.setup();
      mockIsAdmin.mockReturnValue(false);

      renderWithRouter(
        <ProtectedRoute requireAdmin={true}>
          <TestChild />
        </ProtectedRoute>
      );

      // Test home button
      const homeButton = screen.getByText('Return to Home');
      await user.click(homeButton);
      expect(window.location.href).toBe('/');

      // Reset and test logout button
      window.location.href = '';
      const logoutButton = screen.getByText('Sign Out');
      await user.click(logoutButton);
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Role-Based Protection', () => {
    test('allows access with required role', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
        isAdmin: mockIsAdmin,
        initialized: true,
        user: {
          preferred_username: 'testuser',
          email: 'test@example.com',
          realm_access: { roles: ['user', 'manager'] },
          resource_access: { 'peppertree-admin': { roles: [] } }
        },
        logout: mockLogout,
        login: jest.fn(),
        getAccessToken: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter(
        <ProtectedRoute requiredRoles={['manager']}>
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    test('allows access with any of multiple required roles', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
        isAdmin: mockIsAdmin,
        initialized: true,
        user: {
          preferred_username: 'testuser',
          email: 'test@example.com',
          realm_access: { roles: ['user'] },
          resource_access: { 'peppertree-admin': { roles: ['viewer'] } }
        },
        logout: mockLogout,
        login: jest.fn(),
        getAccessToken: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter(
        <ProtectedRoute requiredRoles={['admin', 'viewer', 'manager']}>
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    test('denies access when user lacks required role', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
        isAdmin: mockIsAdmin,
        initialized: true,
        user: {
          preferred_username: 'testuser',
          email: 'test@example.com',
          realm_access: { roles: ['user'] },
          resource_access: { 'peppertree-admin': { roles: [] } }
        },
        logout: mockLogout,
        login: jest.fn(),
        getAccessToken: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter(
        <ProtectedRoute requiredRoles={['admin', 'manager']}>
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByText('Insufficient Permissions')).toBeInTheDocument();
      expect(screen.getByText('Required roles: admin, manager')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    test('handles user with no roles', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
        isAdmin: mockIsAdmin,
        initialized: true,
        user: {
          preferred_username: 'testuser',
          email: 'test@example.com'
          // No realm_access or resource_access
        },
        logout: mockLogout,
        login: jest.fn(),
        getAccessToken: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter(
        <ProtectedRoute requiredRoles={['admin']}>
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByText('Insufficient Permissions')).toBeInTheDocument();
    });

    test('handles missing realm_access', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
        isAdmin: mockIsAdmin,
        initialized: true,
        user: {
          preferred_username: 'testuser',
          email: 'test@example.com',
          resource_access: { 'peppertree-admin': { roles: ['admin'] } }
          // No realm_access
        },
        logout: mockLogout,
        login: jest.fn(),
        getAccessToken: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter(
        <ProtectedRoute requiredRoles={['admin']}>
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    test('handles missing resource_access', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
        isAdmin: mockIsAdmin,
        initialized: true,
        user: {
          preferred_username: 'testuser',
          email: 'test@example.com',
          realm_access: { roles: ['admin'] }
          // No resource_access
        },
        logout: mockLogout,
        login: jest.fn(),
        getAccessToken: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter(
        <ProtectedRoute requiredRoles={['admin']}>
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    test('insufficient permissions page has correct styling', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
        isAdmin: mockIsAdmin,
        initialized: true,
        user: {
          preferred_username: 'testuser',
          realm_access: { roles: ['user'] }
        },
        logout: mockLogout,
        login: jest.fn(),
        getAccessToken: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter(
        <ProtectedRoute requiredRoles={['admin']}>
          <TestChild />
        </ProtectedRoute>
      );

      const icon = document.querySelector('.fa-user-times');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-6xl', 'text-orange-500');

      const heading = screen.getByText('Insufficient Permissions');
      expect(heading).toHaveClass('text-2xl', 'font-display', 'font-bold', 'text-orange-600');
    });

    test('insufficient permissions page buttons work', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
        isAdmin: mockIsAdmin,
        initialized: true,
        user: {
          preferred_username: 'testuser',
          realm_access: { roles: ['user'] }
        },
        logout: mockLogout,
        login: jest.fn(),
        getAccessToken: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter(
        <ProtectedRoute requiredRoles={['admin']}>
          <TestChild />
        </ProtectedRoute>
      );

      // Test home button
      const homeButton = screen.getByText('Return to Home');
      await user.click(homeButton);
      expect(window.location.href).toBe('/');

      // Reset and test logout button
      window.location.href = '';
      const logoutButton = screen.getByText('Sign Out');
      await user.click(logoutButton);
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Combined Protection', () => {
    test('requires admin and specific role together', () => {
      mockIsAdmin.mockReturnValue(true);
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
        isAdmin: mockIsAdmin,
        initialized: true,
        user: {
          preferred_username: 'adminuser',
          realm_access: { roles: ['admin', 'manager'] }
        },
        logout: mockLogout,
        login: jest.fn(),
        getAccessToken: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter(
        <ProtectedRoute requireAdmin={true} requiredRoles={['manager']}>
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    test('fails when admin but lacks required role', () => {
      mockIsAdmin.mockReturnValue(true);
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
        isAdmin: mockIsAdmin,
        initialized: true,
        user: {
          preferred_username: 'adminuser',
          realm_access: { roles: ['admin'] }
        },
        logout: mockLogout,
        login: jest.fn(),
        getAccessToken: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter(
        <ProtectedRoute requireAdmin={true} requiredRoles={['manager']}>
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByText('Insufficient Permissions')).toBeInTheDocument();
    });

    test('fails when has role but not admin', () => {
      mockIsAdmin.mockReturnValue(false);
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
        isAdmin: mockIsAdmin,
        initialized: true,
        user: {
          preferred_username: 'testuser',
          realm_access: { roles: ['manager'] }
        },
        logout: mockLogout,
        login: jest.fn(),
        getAccessToken: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter(
        <ProtectedRoute requireAdmin={true} requiredRoles={['manager']}>
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  describe('Successful Access', () => {
    test('renders children when authenticated and authorized', () => {
      renderWithRouter(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    test('renders children with no protection requirements', () => {
      renderWithRouter(
        <ProtectedRoute requiredRoles={[]} requireAdmin={false}>
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    test('passes through complex children', () => {
      const ComplexChild = () => (
        <div>
          <h1>Dashboard</h1>
          <div data-testid="nested-content">Nested Content</div>
        </div>
      );

      renderWithRouter(
        <ProtectedRoute>
          <ComplexChild />
        </ProtectedRoute>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('nested-content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles null user gracefully', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
        isAdmin: mockIsAdmin,
        initialized: true,
        user: null,
        logout: mockLogout,
        login: jest.fn(),
        getAccessToken: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter(
        <ProtectedRoute requiredRoles={['admin']}>
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByText('Insufficient Permissions')).toBeInTheDocument();
    });

    test('handles empty requiredRoles array', () => {
      renderWithRouter(
        <ProtectedRoute requiredRoles={[]}>
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    test('handles undefined requiredRoles', () => {
      renderWithRouter(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    test('access denied without user shows no user info', () => {
      mockIsAdmin.mockReturnValue(false);
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
        isAdmin: mockIsAdmin,
        initialized: true,
        user: null,
        logout: mockLogout,
        login: jest.fn(),
        getAccessToken: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter(
        <ProtectedRoute requireAdmin={true}>
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Signed in as:')).not.toBeInTheDocument();
    });
  });
});