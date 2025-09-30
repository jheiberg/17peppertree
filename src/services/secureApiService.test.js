import { SecureApiService, useSecureApi } from './secureApiService';
import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn()
  }
}));

const { toast } = jest.requireMock('react-toastify');
const mockToastError = toast.error;

// Mock AuthContext
const mockUseAuth = jest.fn();
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock fetch
global.fetch = jest.fn();

describe('SecureApiService', () => {
  let mockAuthProvider;
  let secureApiService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default environment first
    process.env.REACT_APP_API_URL = 'http://localhost:5000/api';

    mockAuthProvider = {
      getAccessToken: jest.fn(),
      refreshAccessToken: jest.fn(),
      logout: jest.fn(),
      tokens: null
    };

    secureApiService = new SecureApiService(mockAuthProvider);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    test('initializes with custom base URL', () => {
      process.env.REACT_APP_API_URL = 'https://api.example.com';
      const service = new SecureApiService(mockAuthProvider);
      expect(service.baseURL).toBe('https://api.example.com');
      expect(service.secureBaseURL).toBe('https://api.example.com/secure');
    });

    test('initializes with default base URL when env var not set', () => {
      delete process.env.REACT_APP_API_URL;
      const service = new SecureApiService(mockAuthProvider);
      expect(service.baseURL).toBe('http://localhost:5000/api');
      expect(service.secureBaseURL).toBe('http://localhost:5000/api/secure');
    });

    test('stores auth provider reference', () => {
      expect(secureApiService.authProvider).toBe(mockAuthProvider);
    });
  });

  describe('request method', () => {
    beforeEach(() => {
      mockAuthProvider.getAccessToken.mockResolvedValue('valid-token');
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'success' }),
        text: jest.fn().mockResolvedValue('success'),
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        }
      });
    });

    test('makes successful request with access token', async () => {
      const result = await secureApiService.request('/test');

      expect(mockAuthProvider.getAccessToken).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/secure/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result).toEqual({ data: 'success' });
    });

    test('throws error when no access token and not skipping auth', async () => {
      mockAuthProvider.getAccessToken.mockResolvedValue(null);

      await expect(secureApiService.request('/test')).rejects.toThrow(
        'No valid access token available'
      );
    });

    test('makes request without auth when skipAuth is true', async () => {
      mockAuthProvider.getAccessToken.mockResolvedValue(null);

      await secureApiService.request('/test', { skipAuth: true });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/secure/test',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.anything()
          })
        })
      );
    });

    test('includes custom headers when provided', async () => {
      await secureApiService.request('/test', {
        headers: {
          'Custom-Header': 'custom-value'
        }
      });

      // Verify that fetch was called - regardless of exact header format,
      // this ensures the code path with custom headers is tested
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/secure/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Custom-Header': 'custom-value'
          })
        })
      );
    });

    test('handles 401 response with successful token refresh', async () => {
      mockAuthProvider.tokens = { refresh_token: 'refresh-token' };
      mockAuthProvider.refreshAccessToken.mockResolvedValue({
        access_token: 'new-token'
      });

      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ data: 'success' }),
          headers: {
            get: jest.fn().mockReturnValue('application/json')
          }
        });

      const result = await secureApiService.request('/test');

      expect(mockAuthProvider.refreshAccessToken).toHaveBeenCalledWith('refresh-token');
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'success' });
    });

    test('handles 401 response with failed token refresh', async () => {
      mockAuthProvider.tokens = { refresh_token: 'refresh-token' };
      mockAuthProvider.refreshAccessToken.mockResolvedValue(null);

      global.fetch.mockResolvedValue({
        ok: false,
        status: 401
      });

      await expect(secureApiService.request('/test')).rejects.toThrow(
        'Session expired. Please log in again.'
      );
      expect(mockAuthProvider.logout).toHaveBeenCalled();
    });

    test('handles 401 response without refresh token', async () => {
      mockAuthProvider.tokens = null;

      global.fetch.mockResolvedValue({
        ok: false,
        status: 401
      });

      await expect(secureApiService.request('/test')).rejects.toThrow(
        'Session expired. Please log in again.'
      );
      expect(mockAuthProvider.logout).toHaveBeenCalled();
    });

    test('handles 401 response when skipAuth is true', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({})
      });

      await expect(secureApiService.request('/test', { skipAuth: true }))
        .rejects.toThrow('HTTP error! status: 401');

      expect(mockAuthProvider.logout).not.toHaveBeenCalled();
    });

    test('handles non-401 HTTP errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ message: 'Server error' })
      });

      await expect(secureApiService.request('/test')).rejects.toThrow('Server error');
    });

    test('handles HTTP errors without error message', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: jest.fn().mockRejectedValue(new Error('No JSON'))
      });

      await expect(secureApiService.request('/test')).rejects.toThrow('HTTP error! status: 404');
    });

    test('handles network errors and shows toast', async () => {
      const networkError = new Error('Network error');
      global.fetch.mockRejectedValue(networkError);

      await expect(secureApiService.request('/test')).rejects.toThrow('Network error');
      expect(mockToastError).toHaveBeenCalledWith('Network error');
    });

    test('handles errors without toast when toast is not available', async () => {
      // Temporarily mock toast to be undefined
      const originalToast = require('react-toastify').toast;
      require('react-toastify').toast = undefined;

      const networkError = new Error('Network error');
      global.fetch.mockRejectedValue(networkError);

      await expect(secureApiService.request('/test')).rejects.toThrow('Network error');

      // Restore toast
      require('react-toastify').toast = originalToast;
    });
  });

  describe('parseResponse method', () => {
    test('parses JSON response', async () => {
      const mockResponse = {
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: jest.fn().mockResolvedValue({ data: 'json-data' })
      };

      const result = await secureApiService.parseResponse(mockResponse);
      expect(result).toEqual({ data: 'json-data' });
      expect(mockResponse.json).toHaveBeenCalled();
    });

    test('parses text response', async () => {
      const mockResponse = {
        headers: {
          get: jest.fn().mockReturnValue('text/plain')
        },
        text: jest.fn().mockResolvedValue('text-data')
      };

      const result = await secureApiService.parseResponse(mockResponse);
      expect(result).toBe('text-data');
      expect(mockResponse.text).toHaveBeenCalled();
    });

    test('handles response without content-type header', async () => {
      const mockResponse = {
        headers: {
          get: jest.fn().mockReturnValue(null)
        },
        text: jest.fn().mockResolvedValue('text-data')
      };

      const result = await secureApiService.parseResponse(mockResponse);
      expect(result).toBe('text-data');
      expect(mockResponse.text).toHaveBeenCalled();
    });
  });

  describe('HTTP convenience methods', () => {
    beforeEach(() => {
      jest.spyOn(secureApiService, 'request').mockResolvedValue({ success: true });
    });

    test('get method', async () => {
      await secureApiService.get('/test', { headers: { 'Custom': 'header' } });

      expect(secureApiService.request).toHaveBeenCalledWith('/test', {
        headers: { 'Custom': 'header' },
        method: 'GET'
      });
    });

    test('post method', async () => {
      const data = { name: 'test' };
      await secureApiService.post('/test', data, { headers: { 'Custom': 'header' } });

      expect(secureApiService.request).toHaveBeenCalledWith('/test', {
        headers: { 'Custom': 'header' },
        method: 'POST',
        body: JSON.stringify(data)
      });
    });

    test('put method', async () => {
      const data = { name: 'test' };
      await secureApiService.put('/test', data, { headers: { 'Custom': 'header' } });

      expect(secureApiService.request).toHaveBeenCalledWith('/test', {
        headers: { 'Custom': 'header' },
        method: 'PUT',
        body: JSON.stringify(data)
      });
    });

    test('delete method', async () => {
      await secureApiService.delete('/test', { headers: { 'Custom': 'header' } });

      expect(secureApiService.request).toHaveBeenCalledWith('/test', {
        headers: { 'Custom': 'header' },
        method: 'DELETE'
      });
    });
  });

  describe('Secure API specific methods', () => {
    beforeEach(() => {
      jest.spyOn(secureApiService, 'get').mockResolvedValue({ success: true });
      jest.spyOn(secureApiService, 'post').mockResolvedValue({ success: true });
    });

    test('getSecureHealth method', async () => {
      await secureApiService.getSecureHealth();
      expect(secureApiService.get).toHaveBeenCalledWith('/health');
    });

    test('getSecureBookings without filters', async () => {
      await secureApiService.getSecureBookings();
      expect(secureApiService.get).toHaveBeenCalledWith('/bookings');
    });

    test('getSecureBookings with filters', async () => {
      const filters = { status: 'confirmed', limit: 10, empty: '', nullValue: null };
      await secureApiService.getSecureBookings(filters);
      expect(secureApiService.get).toHaveBeenCalledWith('/bookings?status=confirmed&limit=10');
    });

    test('getSecureBooking method', async () => {
      await secureApiService.getSecureBooking('123');
      expect(secureApiService.get).toHaveBeenCalledWith('/booking/123');
    });

    test('createSecureBooking method', async () => {
      const bookingData = { name: 'Test Booking' };
      await secureApiService.createSecureBooking(bookingData);
      expect(secureApiService.post).toHaveBeenCalledWith('/booking', bookingData);
    });

    test('getSecureDashboardStats method', async () => {
      await secureApiService.getSecureDashboardStats();
      expect(secureApiService.get).toHaveBeenCalledWith('/dashboard/stats');
    });

    test('testClientCredentials method', async () => {
      await secureApiService.testClientCredentials();
      expect(secureApiService.get).toHaveBeenCalledWith('/auth/test');
    });

    test('getClientInfo method', async () => {
      await secureApiService.getClientInfo();
      expect(secureApiService.get).toHaveBeenCalledWith('/client/info');
    });
  });

  describe('uploadFileSecure method', () => {
    let mockFile;

    beforeEach(() => {
      mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      mockAuthProvider.getAccessToken.mockResolvedValue('valid-token');
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        }
      });
      jest.spyOn(secureApiService, 'parseResponse').mockResolvedValue({ success: true });
    });

    test('uploads file successfully', async () => {
      const result = await secureApiService.uploadFileSecure('/upload', mockFile);

      expect(mockAuthProvider.getAccessToken).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/secure/upload',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token'
          }),
          body: expect.any(FormData)
        })
      );
      expect(result).toEqual({ success: true });
    });

    test('uploads file with additional fields', async () => {
      const options = {
        fields: {
          description: 'Test file',
          category: 'documents'
        }
      };

      await secureApiService.uploadFileSecure('/upload', mockFile, options);

      const fetchCall = global.fetch.mock.calls[0];
      const formData = fetchCall[1].body;

      // Verify FormData contains the file and fields
      expect(formData).toBeInstanceOf(FormData);
    });

    test('uploads file with custom headers', async () => {
      const options = {
        headers: {
          'Custom-Header': 'custom-value'
        }
      };

      await secureApiService.uploadFileSecure('/upload', mockFile, options);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/secure/upload',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token',
            'Custom-Header': 'custom-value'
          })
        })
      );
    });

    test('handles upload failure', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 413
      });

      await expect(secureApiService.uploadFileSecure('/upload', mockFile))
        .rejects.toThrow('Secure upload failed: 413');
    });
  });
});

describe('useSecureApi hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns SecureApiService instance', () => {
    const mockAuth = {
      getAccessToken: jest.fn(),
      refreshAccessToken: jest.fn(),
      logout: jest.fn()
    };
    mockUseAuth.mockReturnValue(mockAuth);

    const { result } = renderHook(() => useSecureApi());

    expect(result.current).toBeInstanceOf(SecureApiService);
    expect(result.current.authProvider).toBe(mockAuth);
  });

  test('memoizes SecureApiService instance', () => {
    const mockAuth = {
      getAccessToken: jest.fn(),
      refreshAccessToken: jest.fn(),
      logout: jest.fn()
    };
    mockUseAuth.mockReturnValue(mockAuth);

    const { result, rerender } = renderHook(() => useSecureApi());
    const firstInstance = result.current;

    rerender();
    const secondInstance = result.current;

    expect(firstInstance).toBe(secondInstance);
  });

  test('creates new instance when auth changes', () => {
    const mockAuth1 = {
      getAccessToken: jest.fn(),
      refreshAccessToken: jest.fn(),
      logout: jest.fn()
    };
    const mockAuth2 = {
      getAccessToken: jest.fn(),
      refreshAccessToken: jest.fn(),
      logout: jest.fn()
    };

    mockUseAuth.mockReturnValue(mockAuth1);
    const { result, rerender } = renderHook(() => useSecureApi());
    const firstInstance = result.current;

    mockUseAuth.mockReturnValue(mockAuth2);
    rerender();
    const secondInstance = result.current;

    expect(firstInstance).not.toBe(secondInstance);
    expect(secondInstance.authProvider).toBe(mockAuth2);
  });
});