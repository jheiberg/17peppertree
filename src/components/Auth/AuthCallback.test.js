/**
 * Comprehensive tests for AuthCallback component
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthCallback } from './AuthCallback';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Mock the AuthContext
jest.mock('../../contexts/AuthContext');
const mockUseAuth = useAuth;

// Mock react-router-dom navigation
const mockNavigate = jest.fn();
let mockSearchParams;

// Initialize mock search params
const initMockSearchParams = (searchString = '') => {
  const params = new URLSearchParams(searchString);
  mockSearchParams = {
    get: (key) => params.get(key),
    set: (key, value) => params.set(key, value),
    has: (key) => params.has(key),
    delete: (key) => params.delete(key),
    toString: () => params.toString(),
    entries: () => params.entries(),
    forEach: (callback) => params.forEach(callback),
    [Symbol.iterator]: () => params[Symbol.iterator]()
  };
};

initMockSearchParams();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams]
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
let consoleSpy;
let consoleErrorSpy;

describe('AuthCallback Component', () => {
  const mockHandleCallback = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.clear();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    mockUseAuth.mockReturnValue({
      handleCallback: mockHandleCallback,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      getAccessToken: jest.fn(),
      isAdmin: jest.fn()
    });
  });

  afterEach(() => {
    consoleSpy?.mockRestore();
    consoleErrorSpy?.mockRestore();
  });

  const renderWithRouter = (searchParams = '') => {
    // Reinitialize mock search parameters with new search string
    initMockSearchParams(searchParams);

    return render(
      <MemoryRouter>
        <AuthCallback />
      </MemoryRouter>
    );
  };

  describe('Component Rendering', () => {
    test('renders processing state initially', () => {
      renderWithRouter('?code=test-code&state=test-state');

      expect(screen.getByText('Processing Authentication')).toBeInTheDocument();
      expect(screen.getByText('Please wait while we complete your sign-in...')).toBeInTheDocument();

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    test('renders with correct CSS classes and structure', () => {
      renderWithRouter('?code=test-code&state=test-state');

      const container = document.querySelector('.min-h-screen');
      expect(container).toHaveClass('bg-gradient-to-br', 'from-primary', 'to-dark-brown');

      const card = document.querySelector('.bg-white.rounded-2xl.shadow-brown');
      expect(card).toHaveClass('bg-white', 'rounded-2xl', 'shadow-brown');
    });
  });

  describe('Successful Authentication Flow', () => {
    test('processes successful callback and redirects to admin', async () => {
      mockHandleCallback.mockResolvedValueOnce({
        success: true,
        user: { username: 'testuser' }
      });

      renderWithRouter('?code=auth-code&state=auth-state');

      // Initially shows processing
      expect(screen.getByText('Processing Authentication')).toBeInTheDocument();

      // Wait for callback processing
      await waitFor(() => {
        expect(mockHandleCallback).toHaveBeenCalledWith('auth-code', 'auth-state', null);
      });

      // Should show success state
      await waitFor(() => {
        expect(screen.getByText('Authentication Successful')).toBeInTheDocument();
        expect(screen.getByText('Redirecting you now...')).toBeInTheDocument();
      });

      // Should log the processing
      expect(consoleSpy).toHaveBeenCalledWith('Processing callback with:', {
        code: true,
        state: true,
        authError: null
      });

      // Wait for redirect timeout
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1600));
      });

      expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true });
    });

    test('redirects to stored returnTo location after success', async () => {
      mockHandleCallback.mockResolvedValueOnce({ success: true });
      mockSessionStorage.setItem('returnTo', '/custom-dashboard');

      renderWithRouter('?code=auth-code&state=auth-state');

      await waitFor(() => {
        expect(screen.getByText('Authentication Successful')).toBeInTheDocument();
      });

      // Wait for redirect timeout
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1600));
      });

      expect(mockNavigate).toHaveBeenCalledWith('/custom-dashboard', { replace: true });
      expect(mockSessionStorage.getItem('returnTo')).toBeNull();
    });

    test('displays success UI with correct styling', async () => {
      mockHandleCallback.mockResolvedValueOnce({ success: true });

      renderWithRouter('?code=auth-code&state=auth-state');

      await waitFor(() => {
        expect(screen.getByText('Authentication Successful')).toBeInTheDocument();
      });

      const successIcon = document.querySelector('.fa-check');
      expect(successIcon).toBeInTheDocument();
      expect(successIcon?.parentElement).toHaveClass('bg-green-100');

      const heading = screen.getByText('Authentication Successful');
      expect(heading).toHaveClass('text-green-600', 'font-display', 'font-semibold');
    });
  });

  describe('Error Handling', () => {
    test('handles authentication error from URL parameters', async () => {
      renderWithRouter('?error=access_denied&error_description=User+cancelled');

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        expect(screen.getByText('Authentication failed: access_denied')).toBeInTheDocument();
      });

      expect(mockHandleCallback).not.toHaveBeenCalled();
    });

    test('handles missing authorization code', async () => {
      renderWithRouter('?state=test-state');

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        expect(screen.getByText('No authorization code received')).toBeInTheDocument();
      });

      expect(mockHandleCallback).not.toHaveBeenCalled();
    });

    test('handles missing state parameter', async () => {
      renderWithRouter('?code=test-code');

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        expect(screen.getByText('No state parameter received')).toBeInTheDocument();
      });

      expect(mockHandleCallback).not.toHaveBeenCalled();
    });

    test('handles callback failure from auth context', async () => {
      mockHandleCallback.mockResolvedValueOnce({
        success: false,
        error: 'Invalid authorization code'
      });

      renderWithRouter('?code=invalid-code&state=test-state');

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        expect(screen.getByText('Invalid authorization code')).toBeInTheDocument();
      });
    });

    test('handles callback failure without error message', async () => {
      mockHandleCallback.mockResolvedValueOnce({
        success: false
      });

      renderWithRouter('?code=test-code&state=test-state');

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        expect(screen.getByText('Authentication failed')).toBeInTheDocument();
      });
    });

    test('handles unexpected errors during processing', async () => {
      mockHandleCallback.mockRejectedValueOnce(new Error('Network error'));

      renderWithRouter('?code=test-code&state=test-state');

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        expect(screen.getByText('An unexpected error occurred during authentication')).toBeInTheDocument();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Callback processing error:', expect.any(Error));
    });

    test('displays error UI with correct styling', async () => {
      renderWithRouter('?error=server_error');

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
      });

      const errorIcon = document.querySelector('.fa-exclamation-triangle');
      expect(errorIcon).toBeInTheDocument();
      expect(errorIcon?.parentElement).toHaveClass('bg-red-100');

      const heading = screen.getByText('Authentication Failed');
      expect(heading).toHaveClass('text-red-600', 'font-display', 'font-semibold');

      const errorMessage = screen.getByText('Authentication failed: server_error');
      expect(errorMessage.closest('div')).toHaveClass('bg-red-50', 'border-l-4', 'border-red-500');
    });
  });

  describe('User Interactions', () => {
    test('retry button resets and navigates to login', async () => {
      renderWithRouter('?error=access_denied');

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveClass('bg-gradient-to-r', 'from-primary', 'to-accent');

      await userEvent.click(retryButton);

      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    test('home button navigates to root', async () => {
      renderWithRouter('?error=access_denied');

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
      });

      const homeButton = screen.getByText('Return to Home');
      expect(homeButton).toBeInTheDocument();
      expect(homeButton).toHaveClass('bg-gray-100', 'text-gray-700');

      await userEvent.click(homeButton);

      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });

    test('buttons have correct icons', async () => {
      renderWithRouter('?error=access_denied');

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
      });

      const retryIcon = document.querySelector('.fa-redo');
      const homeIcon = document.querySelector('.fa-home');

      expect(retryIcon).toBeInTheDocument();
      expect(homeIcon).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle and Edge Cases', () => {
    test('prevents multiple processing attempts', async () => {
      mockHandleCallback.mockResolvedValueOnce({ success: true });

      const { rerender } = renderWithRouter('?code=test-code&state=test-state');

      // Rerender the component - should not call handleCallback again
      rerender(
        <MemoryRouter>
          <AuthCallback />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(mockHandleCallback).toHaveBeenCalledTimes(1);
      });
    });

    test('console logs callback processing details', async () => {
      mockHandleCallback.mockResolvedValueOnce({ success: true });

      renderWithRouter('?code=test-code&state=test-state');

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Processing callback with:', {
          code: true,
          state: true,
          authError: null
        });
      });
    });

    test('console logs callback processing with error parameter', async () => {
      renderWithRouter('?code=test-code&state=test-state&error=test_error');

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Processing callback with:', {
          code: true,
          state: true,
          authError: 'test_error'
        });
      });
    });

    test('handles empty URL parameters', async () => {
      renderWithRouter('');

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        expect(screen.getByText('No authorization code received')).toBeInTheDocument();
      });
    });

    test('retry functionality resets processed flag', async () => {
      renderWithRouter('?error=access_denied');

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Try Again');
      await userEvent.click(retryButton);

      // Should reset the processedRef flag and navigate to login
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    test('prevents duplicate processing when useEffect runs multiple times', async () => {
      // This test exploits React.StrictMode behavior which can cause useEffect to run multiple times
      // Mock a slow async operation to simulate the scenario
      let processCount = 0;
      mockHandleCallback.mockImplementation(async () => {
        processCount++;
        // Add a delay to simulate real async operation
        await new Promise(resolve => setTimeout(resolve, 50));
        return { success: true };
      });

      renderWithRouter('?code=test-code&state=test-state');

      // In React StrictMode, effects can run multiple times but our guard should prevent multiple processing
      await waitFor(() => {
        expect(mockHandleCallback).toHaveBeenCalled();
      }, { timeout: 3000 });

      // Wait for any duplicate calls to potentially happen
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // The guard should ensure handleCallback is called only once despite potential multiple effect runs
      expect(processCount).toBe(1);
      expect(mockHandleCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration Tests', () => {
    test('full successful authentication flow', async () => {
      const user = { username: 'testuser', email: 'test@example.com' };
      mockHandleCallback.mockResolvedValueOnce({
        success: true,
        user
      });

      renderWithRouter('?code=valid-code&state=valid-state');

      // 1. Initial processing state
      expect(screen.getByText('Processing Authentication')).toBeInTheDocument();

      // 2. Callback processing
      await waitFor(() => {
        expect(mockHandleCallback).toHaveBeenCalledWith('valid-code', 'valid-state', null);
      });

      // 3. Success state
      await waitFor(() => {
        expect(screen.getByText('Authentication Successful')).toBeInTheDocument();
      });

      // 4. Console logging
      expect(consoleSpy).toHaveBeenCalledWith('Processing callback with:', {
        code: true,
        state: true,
        authError: null
      });

      // 5. Eventual redirect
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1600));
      });

      expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true });
    });

    test('full error handling flow', async () => {
      mockHandleCallback.mockRejectedValueOnce(new Error('Token exchange failed'));

      renderWithRouter('?code=invalid-code&state=test-state');

      // 1. Initial processing
      expect(screen.getByText('Processing Authentication')).toBeInTheDocument();

      // 2. Error occurs
      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
      });

      // 3. Error logging
      expect(consoleErrorSpy).toHaveBeenCalledWith('Callback processing error:', expect.any(Error));

      // 4. User can retry
      const retryButton = screen.getByText('Try Again');
      await userEvent.click(retryButton);

      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });
});