import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

// Mock crypto API for PKCE
const mockCrypto = {
  getRandomValues: jest.fn((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
  subtle: {
    digest: jest.fn(() => Promise.resolve(new ArrayBuffer(32)))
  }
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true
});

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock window.location
delete window.location;
window.location = { href: '', origin: 'http://localhost:3000' };

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Test component to access context
const TestComponent = ({ children }) => {
  const auth = useAuth();
  return (
    <div data-testid="auth-context">
      <div data-testid="is-authenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="loading">{auth.loading.toString()}</div>
      <div data-testid="initialized">{auth.initialized.toString()}</div>
      <div data-testid="user">{JSON.stringify(auth.user)}</div>
      <div data-testid="error">{auth.error || 'null'}</div>
      {children}
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    fetch.mockClear();
    console.log = jest.fn();
    console.error = jest.fn();

    // Mock environment variables - use localhost to match test expectations
    process.env.REACT_APP_KEYCLOAK_URL = 'http://localhost:8080';
    process.env.REACT_APP_KEYCLOAK_REALM = 'peppertree';
    process.env.REACT_APP_KEYCLOAK_CLIENT_ID = 'peppertree-admin';
    process.env.REACT_APP_KEYCLOAK_REDIRECT_URI = 'http://localhost:3000/auth/callback';

    // Reset window.location
    window.location.href = '';
    window.location.origin = 'http://localhost:3000';
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('Provider Initialization', () => {
    test('provides initial state correctly', async () => {
      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('is-authenticated')).toHaveTextContent('false');
        expect(getByTestId('loading')).toHaveTextContent('false');
        expect(getByTestId('initialized')).toHaveTextContent('true');
        expect(getByTestId('user')).toHaveTextContent('null');
        expect(getByTestId('error')).toHaveTextContent('null');
      });
    });

    test('initializes with stored valid tokens', async () => {
      const mockTokens = {
        access_token: 'valid-token',
        refresh_token: 'refresh-token'
      };
      const mockUser = { sub: '123', name: 'Test User' };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'keycloak_tokens') return JSON.stringify(mockTokens);
        if (key === 'keycloak_user') return JSON.stringify(mockUser);
        return null;
      });

      // Mock successful token validation
      fetch.mockResolvedValueOnce({ ok: true });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('is-authenticated')).toHaveTextContent('true');
        expect(getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      });
    });

    test('refreshes expired tokens on initialization', async () => {
      const oldTokens = {
        access_token: 'expired-token',
        refresh_token: 'refresh-token'
      };
      const newTokens = {
        access_token: 'new-token',
        refresh_token: 'new-refresh-token'
      };
      const mockUser = { sub: '123', name: 'Test User' };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'keycloak_tokens') return JSON.stringify(oldTokens);
        if (key === 'keycloak_user') return JSON.stringify(mockUser);
        return null;
      });

      // Mock token validation failure, then successful refresh
      fetch
        .mockResolvedValueOnce({ ok: false }) // Token validation fails
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(newTokens)
        }); // Token refresh succeeds

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('is-authenticated')).toHaveTextContent('true');
      });

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'keycloak_tokens',
        JSON.stringify(newTokens)
      );
    });

    test('clears storage when token refresh fails', async () => {
      const oldTokens = {
        access_token: 'expired-token',
        refresh_token: 'invalid-refresh-token'
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'keycloak_tokens') return JSON.stringify(oldTokens);
        if (key === 'keycloak_user') return JSON.stringify({});
        return null;
      });

      // Mock token validation failure and refresh failure
      fetch
        .mockResolvedValueOnce({ ok: false }) // Token validation fails
        .mockResolvedValueOnce({ ok: false }); // Token refresh fails

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('is-authenticated')).toHaveTextContent('false');
        expect(getByTestId('initialized')).toHaveTextContent('true');
      });

      // Verify that localStorage.removeItem was called (storage.clear() calls it multiple times)
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
      expect(mockLocalStorage.removeItem.mock.calls.some(call => call[0] === 'keycloak_tokens')).toBe(true);
    });
  });

  describe('Authentication Actions', () => {
    test('login generates PKCE parameters and redirects', async () => {
      let authContext;

      const TestComponentWithActions = () => {
        authContext = useAuth();
        return <div data-testid="test">Test</div>;
      };

      render(
        <AuthProvider>
          <TestComponentWithActions />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authContext).toBeDefined();
      });

      await act(async () => {
        await authContext.login();
      });

      // Verify PKCE parameters were stored
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'keycloak_state',
        expect.any(String)
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'keycloak_code_verifier',
        expect.any(String)
      );

      // Verify redirect URL format (accept any Keycloak server URL)
      expect(window.location.href).toMatch(/\/realms\/peppertree\/protocol\/openid-connect\/auth\?/);
      expect(window.location.href).toMatch(/client_id=peppertree-admin/);
      expect(window.location.href).toMatch(/response_type=code/);
      expect(window.location.href).toMatch(/code_challenge_method=S256/);
    });

    test('handleCallback processes successful authentication', async () => {
      const mockTokens = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token'
      };
      const mockUser = { sub: '123', name: 'Test User', email: 'test@example.com' };
      const testState = 'test-state-123';
      const testCodeVerifier = 'test-code-verifier';

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'keycloak_state') return JSON.stringify(testState);
        if (key === 'keycloak_code_verifier') return JSON.stringify(testCodeVerifier);
        return null;
      });

      // Mock token exchange and user info requests
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokens)
        }) // Token exchange
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUser)
        }); // User info

      let authContext;

      const TestComponentWithActions = () => {
        authContext = useAuth();
        return <div data-testid="test">Test</div>;
      };

      render(
        <AuthProvider>
          <TestComponentWithActions />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authContext).toBeDefined();
      });

      const result = await act(async () => {
        return await authContext.handleCallback('auth-code-123', testState);
      });

      expect(result.success).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'keycloak_tokens',
        JSON.stringify(mockTokens)
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'keycloak_user',
        JSON.stringify(mockUser)
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('keycloak_state');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('keycloak_code_verifier');
    });

    test('handleCallback fails with invalid state', async () => {
      const testState = 'test-state-123';
      const wrongState = 'wrong-state-456';

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'keycloak_state') return JSON.stringify(testState);
        return null;
      });

      let authContext;

      const TestComponentWithActions = () => {
        authContext = useAuth();
        return <div data-testid="test">Test</div>;
      };

      render(
        <AuthProvider>
          <TestComponentWithActions />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authContext).toBeDefined();
      });

      const result = await act(async () => {
        return await authContext.handleCallback('auth-code-123', wrongState);
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid state parameter');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('keycloak_tokens');
    });

    test('logout clears storage and calls Keycloak logout', async () => {
      const mockTokens = {
        access_token: 'access-token',
        refresh_token: 'refresh-token'
      };
      const mockUser = { sub: '123', name: 'Test User' };

      // Set up initial authenticated state
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'keycloak_tokens') return JSON.stringify(mockTokens);
        if (key === 'keycloak_user') return JSON.stringify(mockUser);
        return null;
      });

      // Mock successful token validation and logout
      fetch
        .mockResolvedValueOnce({ ok: true }) // Token validation
        .mockResolvedValueOnce({ ok: true }); // Logout request

      let authContext;

      const TestComponentWithActions = () => {
        authContext = useAuth();
        return <div data-testid="test">Test</div>;
      };

      render(
        <AuthProvider>
          <TestComponentWithActions />
        </AuthProvider>
      );

      // Wait for initialization and then logout
      await waitFor(() => {
        expect(authContext).toBeDefined();
        expect(authContext.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await authContext.logout();
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/realms\/peppertree\/protocol\/openid-connect\/logout$/),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
      );

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('keycloak_tokens');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('keycloak_user');
    });
  });

  describe('Token Management', () => {
    test('getAccessToken returns valid token', async () => {
      const mockTokens = {
        access_token: 'valid-token',
        refresh_token: 'refresh-token'
      };
      const mockUser = { sub: '123', name: 'Test User' };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'keycloak_tokens') return JSON.stringify(mockTokens);
        if (key === 'keycloak_user') return JSON.stringify(mockUser);
        return null;
      });

      // Mock successful token validation
      fetch
        .mockResolvedValueOnce({ ok: true }) // Initial validation
        .mockResolvedValueOnce({ ok: true }); // getAccessToken validation

      let authContext;

      const TestComponentWithActions = () => {
        authContext = useAuth();
        return <div data-testid="test">Test</div>;
      };

      render(
        <AuthProvider>
          <TestComponentWithActions />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authContext).toBeDefined();
        expect(authContext.isAuthenticated).toBe(true);
      });

      const token = await act(async () => {
        return await authContext.getAccessToken();
      });

      expect(token).toBe('valid-token');
    });

    test('getAccessToken refreshes expired token', async () => {
      const oldTokens = {
        access_token: 'expired-token',
        refresh_token: 'refresh-token'
      };
      const newTokens = {
        access_token: 'new-token',
        refresh_token: 'new-refresh-token'
      };
      const mockUser = { sub: '123', name: 'Test User' };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'keycloak_tokens') return JSON.stringify(oldTokens);
        if (key === 'keycloak_user') return JSON.stringify(mockUser);
        return null;
      });

      // Mock token validation success initially, then failure, then successful refresh
      fetch
        .mockResolvedValueOnce({ ok: true }) // Initial load validation
        .mockResolvedValueOnce({ ok: false }) // getAccessToken validation fails
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(newTokens)
        }); // Token refresh succeeds

      let authContext;

      const TestComponentWithActions = () => {
        authContext = useAuth();
        return <div data-testid="test">Test</div>;
      };

      render(
        <AuthProvider>
          <TestComponentWithActions />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authContext).toBeDefined();
        expect(authContext.isAuthenticated).toBe(true);
      });

      const token = await act(async () => {
        return await authContext.getAccessToken();
      });

      expect(token).toBe('new-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'keycloak_tokens',
        JSON.stringify(newTokens)
      );
    });
  });

  describe('Admin Role Checking', () => {
    test('isAdmin returns true for admin role', async () => {
      // Create a valid base64 encoded JWT payload with admin role
      const payload = {
        realm_access: { roles: ['admin'] },
        sub: '123',
        name: 'Test Admin'
      };
      const encodedPayload = btoa(JSON.stringify(payload));

      const mockTokens = {
        access_token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${encodedPayload}.signature`
      };
      const mockUser = { sub: '123', name: 'Test Admin' };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'keycloak_tokens') return JSON.stringify(mockTokens);
        if (key === 'keycloak_user') return JSON.stringify(mockUser);
        return null;
      });

      fetch.mockResolvedValueOnce({ ok: true });

      let authContext;

      const TestComponentWithActions = () => {
        authContext = useAuth();
        return <div data-testid="test">Test</div>;
      };

      render(
        <AuthProvider>
          <TestComponentWithActions />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authContext).toBeDefined();
        expect(authContext.isAuthenticated).toBe(true);
        expect(authContext.isAdmin()).toBe(true);
      });
    });

    test('isAdmin returns false for non-admin user', async () => {
      // Create a valid base64 encoded JWT payload with user role
      const payload = {
        realm_access: { roles: ['user'] },
        sub: '123',
        name: 'Test User'
      };
      const encodedPayload = btoa(JSON.stringify(payload));

      const mockTokens = {
        access_token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${encodedPayload}.signature`
      };
      const mockUser = { sub: '123', name: 'Test User' };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'keycloak_tokens') return JSON.stringify(mockTokens);
        if (key === 'keycloak_user') return JSON.stringify(mockUser);
        return null;
      });

      fetch.mockResolvedValueOnce({ ok: true });

      let authContext;

      const TestComponentWithActions = () => {
        authContext = useAuth();
        return <div data-testid="test">Test</div>;
      };

      render(
        <AuthProvider>
          <TestComponentWithActions />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authContext).toBeDefined();
        expect(authContext.isAdmin()).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    test('handles storage errors gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('is-authenticated')).toHaveTextContent('false');
        expect(getByTestId('initialized')).toHaveTextContent('true');
      });
    });

    test('handles network errors during login', async () => {
      let authContext;

      const TestComponentWithActions = () => {
        authContext = useAuth();
        return <div data-testid="test">Test</div>;
      };

      render(
        <AuthProvider>
          <TestComponentWithActions />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authContext).toBeDefined();
      });

      // Mock crypto to throw error
      mockCrypto.subtle.digest.mockRejectedValueOnce(new Error('Crypto error'));

      await act(async () => {
        await authContext.login();
      });

      // Should still attempt login with fallback
      expect(window.location.href).toMatch(/\/realms\/peppertree\/protocol\/openid-connect\/auth/);
    });

    test('handles callback with error parameter', async () => {
      let authContext;

      const TestComponentWithActions = () => {
        authContext = useAuth();
        return <div data-testid="test">Test</div>;
      };

      render(
        <AuthProvider>
          <TestComponentWithActions />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authContext).toBeDefined();
      });

      const result = await act(async () => {
        return await authContext.handleCallback(null, null, 'access_denied');
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication error: access_denied');
    });
  });

  describe('Hook Usage', () => {
    test('useAuth throws error when used outside provider', () => {
      const TestComponentOutsideProvider = () => {
        try {
          useAuth();
          return <div>Should not render</div>;
        } catch (error) {
          return <div data-testid="error">{error.message}</div>;
        }
      };

      const { getByTestId } = render(<TestComponentOutsideProvider />);
      expect(getByTestId('error')).toHaveTextContent('useAuth must be used within an AuthProvider');
    });
  });
});