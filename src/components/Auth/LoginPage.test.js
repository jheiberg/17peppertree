/**
 * Comprehensive tests for LoginPage component
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Mock the AuthContext
jest.mock('../../contexts/AuthContext');
const mockUseAuth = useAuth;

// Mock react-router-dom navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
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

// Mock console methods
let consoleErrorSpy;

describe('LoginPage Component', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.clear();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Default mock auth context
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      login: mockLogin,
      loading: false,
      error: null,
      initialized: true,
      user: null,
      logout: jest.fn(),
      getAccessToken: jest.fn(),
      isAdmin: jest.fn(),
      handleCallback: jest.fn()
    });
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
  });

  const renderWithRouter = () => {
    return render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
  };

  describe('Component Rendering', () => {
    test('renders login page with correct structure', () => {
      renderWithRouter();

      expect(screen.getByText('17 @ Peppertree')).toBeInTheDocument();
      expect(screen.getByText('Welcome')).toBeInTheDocument();
      expect(screen.getByText('Please sign in to access your account')).toBeInTheDocument();
      expect(screen.getByText('Sign in')).toBeInTheDocument();
      expect(screen.getByText('Return to main site')).toBeInTheDocument();
    });

    test('renders with correct CSS classes and styling', () => {
      renderWithRouter();

      const container = document.querySelector('.min-h-screen');
      expect(container).toHaveClass('bg-gradient-to-br', 'from-primary', 'to-dark-brown');

      // Get the white card element by its specific classes
      const card = document.querySelector('.bg-white.rounded-2xl.shadow-brown');
      expect(card).toHaveClass('bg-white', 'rounded-2xl', 'shadow-brown');

      const title = screen.getByText('17 @ Peppertree');
      expect(title).toHaveClass('text-3xl', 'font-display', 'font-bold', 'text-primary');

      const subtitle = screen.getByText('Welcome');
      expect(subtitle).toHaveClass('text-xl', 'font-display', 'text-dark-brown');
    });

    test('renders login button with correct styling', () => {
      renderWithRouter();

      const loginButton = screen.getByText('Sign in');
      expect(loginButton.closest('button')).toHaveClass(
        'w-full', 'bg-gradient-to-r', 'from-primary', 'to-accent', 'text-white'
      );

      const icon = document.querySelector('.fa-sign-in-alt');
      expect(icon).toBeInTheDocument();
    });

    test('renders return link with correct styling', () => {
      renderWithRouter();

      const returnLink = screen.getByText('Return to main site');
      expect(returnLink).toHaveClass('text-accent', 'hover:text-primary');
      expect(returnLink).toHaveAttribute('href', '/');

      const backIcon = document.querySelector('.fa-arrow-left');
      expect(backIcon).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    test('renders loading state when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        login: mockLogin,
        loading: true,
        error: null,
        initialized: false,
        user: null,
        logout: jest.fn(),
        getAccessToken: jest.fn(),
        isAdmin: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter();

      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
      expect(screen.queryByText('Sign in')).not.toBeInTheDocument();

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('border-4', 'border-primary');
    });

    test('renders loading state when not initialized', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        login: mockLogin,
        loading: false,
        error: null,
        initialized: false,
        user: null,
        logout: jest.fn(),
        getAccessToken: jest.fn(),
        isAdmin: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter();

      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
      expect(screen.queryByText('Sign in')).not.toBeInTheDocument();
    });

    test('renders main content when initialized and not loading', () => {
      renderWithRouter();

      expect(screen.queryByText('Checking authentication...')).not.toBeInTheDocument();
      expect(screen.getByText('Sign in')).toBeInTheDocument();
    });
  });

  describe('Authentication State Handling', () => {
    test('redirects to admin when already authenticated', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        login: mockLogin,
        loading: false,
        error: null,
        initialized: true,
        user: { username: 'testuser' },
        logout: jest.fn(),
        getAccessToken: jest.fn(),
        isAdmin: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true });
      });
    });

    test('redirects to stored returnTo URL when authenticated', async () => {
      mockSessionStorage.setItem('returnTo', '/custom-dashboard');

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        login: mockLogin,
        loading: false,
        error: null,
        initialized: true,
        user: { username: 'testuser' },
        logout: jest.fn(),
        getAccessToken: jest.fn(),
        isAdmin: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/custom-dashboard', { replace: true });
      });

      expect(mockSessionStorage.getItem('returnTo')).toBeNull();
    });

    test('does not redirect when not authenticated', async () => {
      renderWithRouter();

      // Wait a bit to ensure no navigation occurs
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(screen.getByText('Sign in')).toBeInTheDocument();
    });

    test('does not redirect when not initialized yet', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        login: mockLogin,
        loading: false,
        error: null,
        initialized: false, // Not initialized yet
        user: { username: 'testuser' },
        logout: jest.fn(),
        getAccessToken: jest.fn(),
        isAdmin: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter();

      // Should show loading instead of redirecting
      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Error Display', () => {
    test('displays authentication error', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        login: mockLogin,
        loading: false,
        error: 'Invalid credentials provided',
        initialized: true,
        user: null,
        logout: jest.fn(),
        getAccessToken: jest.fn(),
        isAdmin: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter();

      const errorMessage = screen.getByText('Invalid credentials provided');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage.closest('div')).toHaveClass('bg-red-50', 'border-l-4', 'border-red-500');
      expect(errorMessage).toHaveClass('text-red-700', 'text-sm');
    });

    test('does not display error when error is null', () => {
      renderWithRouter();

      const errorDiv = document.querySelector('.bg-red-50');
      expect(errorDiv).not.toBeInTheDocument();
    });

    test('updates error display when error changes', () => {
      const { rerender } = renderWithRouter();

      // Initially no error
      expect(screen.queryByText('Login failed')).not.toBeInTheDocument();

      // Update with error
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        login: mockLogin,
        loading: false,
        error: 'Login failed',
        initialized: true,
        user: null,
        logout: jest.fn(),
        getAccessToken: jest.fn(),
        isAdmin: jest.fn(),
        handleCallback: jest.fn()
      });

      rerender(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Login failed')).toBeInTheDocument();
    });
  });

  describe('Login Button Interaction', () => {
    test('calls login function when button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const loginButton = screen.getByText('Sign in');
      await user.click(loginButton);

      expect(mockLogin).toHaveBeenCalledTimes(1);
    });

    test('shows loading state during login', async () => {
      const user = userEvent.setup();

      // Mock login to be a pending promise
      let resolveLogin;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      mockLogin.mockReturnValue(loginPromise);

      const { rerender } = renderWithRouter();

      const loginButton = screen.getByText('Sign in');
      await user.click(loginButton);

      // Should show loading state
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
      expect(screen.queryByText('Sign in')).not.toBeInTheDocument();

      const loadingSpinner = document.querySelector('.animate-spin');
      expect(loadingSpinner).toBeInTheDocument();
      expect(loadingSpinner).toHaveClass('border-2', 'border-white');

      const button = screen.getByText('Signing in...').closest('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');

      // Resolve login and simulate successful authentication
      mockUseAuth.mockReturnValue({
        isAuthenticated: true, // Simulate successful login
        login: mockLogin,
        loading: false,
        error: null,
        initialized: true,
        user: { username: 'testuser' },
        logout: jest.fn(),
        getAccessToken: jest.fn(),
        isAdmin: jest.fn(),
        handleCallback: jest.fn()
      });

      resolveLogin();

      // Re-render to trigger the effect with new auth state
      rerender(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      // The component should redirect on successful authentication
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true });
      });
    });

    test('handles login errors and resets loading state', async () => {
      const user = userEvent.setup();
      const error = new Error('Network error');
      mockLogin.mockRejectedValueOnce(error);

      renderWithRouter();

      const loginButton = screen.getByText('Sign in');
      await user.click(loginButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Login error:', error);
      });

      // Should reset to normal state
      expect(screen.getByText('Sign in')).toBeInTheDocument();
      expect(screen.queryByText('Signing in...')).not.toBeInTheDocument();

      const button = screen.getByText('Sign in').closest('button');
      expect(button).not.toBeDisabled();
    });

    test('button is disabled during loading', async () => {
      const user = userEvent.setup();

      let resolveLogin;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      mockLogin.mockReturnValue(loginPromise);

      renderWithRouter();

      const loginButton = screen.getByText('Sign in');
      await user.click(loginButton);

      const button = screen.getByText('Signing in...').closest('button');
      expect(button).toBeDisabled();

      // Try clicking again - should not call login again
      await user.click(button);
      expect(mockLogin).toHaveBeenCalledTimes(1);

      resolveLogin();
    });
  });

  describe('Component Integration', () => {
    test('full successful authentication flow', async () => {
      const user = userEvent.setup();

      // Start with unauthenticated state
      const { rerender } = renderWithRouter();

      expect(screen.getByText('Sign in')).toBeInTheDocument();

      // Click login
      const loginButton = screen.getByText('Sign in');
      await user.click(loginButton);

      // Should show loading
      expect(screen.getByText('Signing in...')).toBeInTheDocument();

      // Simulate successful authentication
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        login: mockLogin,
        loading: false,
        error: null,
        initialized: true,
        user: { username: 'testuser' },
        logout: jest.fn(),
        getAccessToken: jest.fn(),
        isAdmin: jest.fn(),
        handleCallback: jest.fn()
      });

      rerender(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true });
      });
    });

    test('handles initialization sequence', () => {
      // Start uninitialized
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        login: mockLogin,
        loading: true,
        error: null,
        initialized: false,
        user: null,
        logout: jest.fn(),
        getAccessToken: jest.fn(),
        isAdmin: jest.fn(),
        handleCallback: jest.fn()
      });

      const { rerender } = renderWithRouter();
      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();

      // Become initialized
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        login: mockLogin,
        loading: false,
        error: null,
        initialized: true,
        user: null,
        logout: jest.fn(),
        getAccessToken: jest.fn(),
        isAdmin: jest.fn(),
        handleCallback: jest.fn()
      });

      rerender(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      expect(screen.queryByText('Checking authentication...')).not.toBeInTheDocument();
      expect(screen.getByText('Sign in')).toBeInTheDocument();
    });

    test('sessionStorage integration with return URL', async () => {
      const returnUrl = '/admin/bookings';
      mockSessionStorage.setItem('returnTo', returnUrl);

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        login: mockLogin,
        loading: false,
        error: null,
        initialized: true,
        user: { username: 'testuser' },
        logout: jest.fn(),
        getAccessToken: jest.fn(),
        isAdmin: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(returnUrl, { replace: true });
      });

      // Verify returnTo was cleared
      expect(mockSessionStorage.getItem('returnTo')).toBeNull();
    });
  });

  describe('Accessibility and UX', () => {
    test('button has correct accessibility attributes', () => {
      renderWithRouter();

      const button = screen.getByText('Sign in').closest('button');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    test('loading button has correct accessibility state', async () => {
      const user = userEvent.setup();

      let resolveLogin;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      mockLogin.mockReturnValue(loginPromise);

      renderWithRouter();

      await user.click(screen.getByText('Sign in'));

      const button = screen.getByText('Signing in...').closest('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('disabled');

      resolveLogin();
    });

    test('error message is properly announced', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        login: mockLogin,
        loading: false,
        error: 'Authentication failed. Please try again.',
        initialized: true,
        user: null,
        logout: jest.fn(),
        getAccessToken: jest.fn(),
        isAdmin: jest.fn(),
        handleCallback: jest.fn()
      });

      renderWithRouter();

      const errorText = screen.getByText('Authentication failed. Please try again.');
      expect(errorText).toBeInTheDocument();
      expect(errorText.closest('div')).toHaveClass('bg-red-50');
    });
  });
});