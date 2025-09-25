import { ApiService, useApi } from './apiService';
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

describe('ApiService', () => {
  let mockAuthProvider;
  let apiService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthProvider = {
      getAccessToken: jest.fn(),
      refreshAccessToken: jest.fn(),
      logout: jest.fn(),
      tokens: null
    };

    apiService = new ApiService(mockAuthProvider);

    // Set up default environment
    process.env.REACT_APP_API_BASE_URL = 'http://localhost:5000/api';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    test('initializes with custom base URL', () => {
      process.env.REACT_APP_API_BASE_URL = 'https://api.example.com';
      const customApiService = new ApiService(mockAuthProvider);
      expect(customApiService.baseURL).toBe('https://api.example.com');
    });

    test('initializes with default base URL when env var not set', () => {
      delete process.env.REACT_APP_API_BASE_URL;
      const defaultApiService = new ApiService(mockAuthProvider);
      expect(defaultApiService.baseURL).toBe('http://localhost:5000/api');
    });

    test('stores auth provider reference', () => {
      expect(apiService.authProvider).toBe(mockAuthProvider);
    });
  });

  describe('Authentication Handling', () => {
    test('includes Authorization header when access token is available', async () => {
      mockAuthProvider.getAccessToken.mockResolvedValue('test-token');
      fetch.mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ data: 'test' })
      });

      await apiService.get('/test');

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/test', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        method: 'GET'
      });
    });

    test('throws error when no access token and skipAuth is false', async () => {
      mockAuthProvider.getAccessToken.mockResolvedValue(null);

      await expect(apiService.get('/test')).rejects.toThrow('No valid access token available');
    });

    test('allows request without token when skipAuth is true', async () => {
      mockAuthProvider.getAccessToken.mockResolvedValue(null);
      fetch.mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ data: 'test' })
      });

      await apiService.get('/test', { skipAuth: true });

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/test', {
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'GET',
        skipAuth: true
      });
    });
  });

  describe('Token Refresh on 401', () => {
    test('refreshes token and retries request on 401', async () => {
      mockAuthProvider.getAccessToken.mockResolvedValue('expired-token');
      mockAuthProvider.tokens = { refresh_token: 'refresh-token' };
      mockAuthProvider.refreshAccessToken.mockResolvedValue({ access_token: 'new-token' });

      // First call returns 401, second call succeeds
      fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve({ data: 'success' })
        });

      const result = await apiService.get('/test');

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(mockAuthProvider.refreshAccessToken).toHaveBeenCalledWith('refresh-token');
      expect(result).toEqual({ data: 'success' });

      // Second call should have new token
      expect(fetch).toHaveBeenLastCalledWith('http://localhost:5000/api/test', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer new-token'
        },
        method: 'GET'
      });
    });

    test('logs out user when token refresh fails', async () => {
      mockAuthProvider.getAccessToken.mockResolvedValue('expired-token');
      mockAuthProvider.tokens = { refresh_token: 'refresh-token' };
      mockAuthProvider.refreshAccessToken.mockResolvedValue(null);

      fetch.mockResolvedValue({
        ok: false,
        status: 401
      });

      await expect(apiService.get('/test')).rejects.toThrow('Session expired. Please log in again.');
      expect(mockAuthProvider.logout).toHaveBeenCalled();
    });

    test('logs out user when no refresh token available', async () => {
      mockAuthProvider.getAccessToken.mockResolvedValue('expired-token');
      mockAuthProvider.tokens = null;

      fetch.mockResolvedValue({
        ok: false,
        status: 401
      });

      await expect(apiService.get('/test')).rejects.toThrow('Session expired. Please log in again.');
      expect(mockAuthProvider.logout).toHaveBeenCalled();
    });

    test('does not attempt refresh when skipAuth is true', async () => {
      mockAuthProvider.getAccessToken.mockResolvedValue('expired-token');

      fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' })
      });

      await expect(apiService.get('/test', { skipAuth: true })).rejects.toThrow('Unauthorized');
      expect(mockAuthProvider.refreshAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('handles HTTP error responses', async () => {
      mockAuthProvider.getAccessToken.mockResolvedValue('test-token');
      fetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found' })
      });

      await expect(apiService.get('/test')).rejects.toThrow('Not found');
      expect(mockToastError).toHaveBeenCalledWith('Not found');
    });

    test('handles HTTP error without JSON response', async () => {
      mockAuthProvider.getAccessToken.mockResolvedValue('test-token');
      fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await expect(apiService.get('/test')).rejects.toThrow('HTTP error! status: 500');
      expect(mockToastError).toHaveBeenCalledWith('HTTP error! status: 500');
    });

    test('handles network errors', async () => {
      mockAuthProvider.getAccessToken.mockResolvedValue('test-token');
      fetch.mockRejectedValue(new Error('Network error'));

      await expect(apiService.get('/test')).rejects.toThrow('Network error');
      expect(mockToastError).toHaveBeenCalledWith('Network error');
    });

    test('logs errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockAuthProvider.getAccessToken.mockResolvedValue('test-token');
      fetch.mockRejectedValue(new Error('Network error'));

      await expect(apiService.get('/test')).rejects.toThrow('Network error');
      expect(consoleSpy).toHaveBeenCalledWith('API request failed:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    test('handles toast being undefined', async () => {
      // Mock react-toastify to return undefined toast
      jest.doMock('react-toastify', () => ({
        toast: undefined
      }));

      mockAuthProvider.getAccessToken.mockResolvedValue('test-token');
      fetch.mockRejectedValue(new Error('Network error'));

      await expect(apiService.get('/test')).rejects.toThrow('Network error');
      // Should not crash when toast is undefined
    });
  });

  describe('Response Parsing', () => {
    test('parses JSON responses', async () => {
      mockAuthProvider.getAccessToken.mockResolvedValue('test-token');
      const mockData = { id: 1, name: 'test' };

      fetch.mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(mockData)
      });

      const result = await apiService.get('/test');
      expect(result).toEqual(mockData);
    });

    test('parses text responses when content-type is not JSON', async () => {
      mockAuthProvider.getAccessToken.mockResolvedValue('test-token');

      fetch.mockResolvedValue({
        ok: true,
        headers: { get: () => 'text/plain' },
        text: () => Promise.resolve('plain text response')
      });

      const result = await apiService.get('/test');
      expect(result).toBe('plain text response');
    });

    test('parses text responses when content-type header is null', async () => {
      mockAuthProvider.getAccessToken.mockResolvedValue('test-token');

      fetch.mockResolvedValue({
        ok: true,
        headers: { get: () => null },
        text: () => Promise.resolve('default text response')
      });

      const result = await apiService.get('/test');
      expect(result).toBe('default text response');
    });
  });

  describe('HTTP Methods', () => {
    beforeEach(() => {
      mockAuthProvider.getAccessToken.mockResolvedValue('test-token');
      fetch.mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ success: true })
      });
    });

    test('GET method', async () => {
      await apiService.get('/users');

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/users', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        method: 'GET'
      });
    });

    test('POST method with data', async () => {
      const postData = { name: 'test user' };
      await apiService.post('/users', postData);

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/users', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        method: 'POST',
        body: JSON.stringify(postData)
      });
    });

    test('PUT method with data', async () => {
      const putData = { name: 'updated user' };
      await apiService.put('/users/1', putData);

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/users/1', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        method: 'PUT',
        body: JSON.stringify(putData)
      });
    });

    test('DELETE method', async () => {
      await apiService.delete('/users/1');

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/users/1', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        method: 'DELETE'
      });
    });

    test('methods accept additional options', async () => {
      const customHeaders = { 'X-Custom-Header': 'value' };
      await apiService.get('/users', { headers: customHeaders });

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/users', {
        headers: {
          'X-Custom-Header': 'value'
        },
        method: 'GET'
      });
    });
  });

  describe('File Upload', () => {
    beforeEach(() => {
      mockAuthProvider.getAccessToken.mockResolvedValue('test-token');
    });

    test('uploads file with authentication', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

      fetch.mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ uploaded: true })
      });

      const result = await apiService.uploadFile('/upload', mockFile);

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token'
        },
        body: expect.any(FormData)
      });

      const [, config] = fetch.mock.calls[0];
      const formData = config.body;
      expect(formData.get('file')).toBe(mockFile);
      expect(result).toEqual({ uploaded: true });
    });

    test('uploads file with additional form fields', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const additionalFields = { category: 'documents', public: 'true' };

      fetch.mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ uploaded: true })
      });

      await apiService.uploadFile('/upload', mockFile, { fields: additionalFields });

      const [, config] = fetch.mock.calls[0];
      const formData = config.body;
      expect(formData.get('file')).toBe(mockFile);
      expect(formData.get('category')).toBe('documents');
      expect(formData.get('public')).toBe('true');
    });

    test('uploads file with custom headers', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const customHeaders = { 'X-Upload-Type': 'image' };

      fetch.mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ uploaded: true })
      });

      await apiService.uploadFile('/upload', mockFile, { headers: customHeaders });

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'X-Upload-Type': 'image'
        },
        body: expect.any(FormData)
      });
    });

    test('handles upload failure', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

      fetch.mockResolvedValue({
        ok: false,
        status: 413
      });

      await expect(apiService.uploadFile('/upload', mockFile)).rejects.toThrow('Upload failed: 413');
    });

    test('uploads file without access token when not available', async () => {
      mockAuthProvider.getAccessToken.mockResolvedValue(null);
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

      fetch.mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ uploaded: true })
      });

      await apiService.uploadFile('/upload', mockFile);

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: {},
        body: expect.any(FormData)
      });
    });
  });

  describe('Request Configuration', () => {
    beforeEach(() => {
      mockAuthProvider.getAccessToken.mockResolvedValue('test-token');
      fetch.mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ success: true })
      });
    });

    test('merges custom headers with default headers', async () => {
      await apiService.get('/test', {
        headers: {
          'X-Custom': 'value',
          'Content-Type': 'application/xml' // Should override default
        }
      });

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/test', {
        headers: {
          'Content-Type': 'application/xml',
          'X-Custom': 'value'
        },
        method: 'GET'
      });
    });

    test('passes through additional fetch options', async () => {
      await apiService.get('/test', {
        timeout: 5000,
        signal: new AbortController().signal
      });

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/test', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        method: 'GET',
        timeout: 5000,
        signal: expect.any(AbortSignal)
      });
    });

    test('builds correct URL with endpoint', async () => {
      await apiService.get('/users/123?include=profile');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/users/123?include=profile',
        expect.any(Object)
      );
    });
  });

  describe('Retry Logic After Token Refresh', () => {
    test('handles retry request failure after successful token refresh', async () => {
      mockAuthProvider.getAccessToken.mockResolvedValue('expired-token');
      mockAuthProvider.tokens = { refresh_token: 'refresh-token' };
      mockAuthProvider.refreshAccessToken.mockResolvedValue({ access_token: 'new-token' });

      fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: () => Promise.resolve({ message: 'Forbidden' })
        });

      await expect(apiService.get('/test')).rejects.toThrow('HTTP error! status: 403');
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('handles network error on retry after token refresh', async () => {
      mockAuthProvider.getAccessToken.mockResolvedValue('expired-token');
      mockAuthProvider.tokens = { refresh_token: 'refresh-token' };
      mockAuthProvider.refreshAccessToken.mockResolvedValue({ access_token: 'new-token' });

      fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401
        })
        .mockRejectedValueOnce(new Error('Network error on retry'));

      await expect(apiService.get('/test')).rejects.toThrow('Network error on retry');
    });
  });
});

describe('useApi Hook', () => {
  let mockAuth;

  beforeEach(() => {
    mockAuth = {
      getAccessToken: jest.fn(),
      refreshAccessToken: jest.fn(),
      logout: jest.fn(),
      tokens: null
    };

    mockUseAuth.mockReturnValue(mockAuth);
  });

  test('returns ApiService instance', () => {
    const { result } = renderHook(() => useApi());
    expect(result.current).toBeInstanceOf(ApiService);
  });

  test('memoizes ApiService instance based on auth', () => {
    const { result, rerender } = renderHook(() => useApi());
    const firstInstance = result.current;

    // Rerender with same auth - should return same instance
    rerender();
    expect(result.current).toBe(firstInstance);

    // Change auth object - should return new instance
    const newAuth = { ...mockAuth };
    mockUseAuth.mockReturnValue(newAuth);
    rerender();
    expect(result.current).not.toBe(firstInstance);
    expect(result.current).toBeInstanceOf(ApiService);
  });

  test('creates ApiService with correct auth provider', () => {
    const { result } = renderHook(() => useApi());
    expect(result.current.authProvider).toBe(mockAuth);
  });
});

describe('Integration Tests', () => {
  let apiService;
  let mockAuthProvider;

  beforeEach(() => {
    mockAuthProvider = {
      getAccessToken: jest.fn().mockResolvedValue('test-token'),
      refreshAccessToken: jest.fn(),
      logout: jest.fn(),
      tokens: { refresh_token: 'refresh-token' }
    };

    apiService = new ApiService(mockAuthProvider);
  });

  test('complete successful request flow', async () => {
    const mockResponse = { id: 1, data: 'test' };
    fetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve(mockResponse)
    });

    const result = await apiService.get('/test');

    expect(mockAuthProvider.getAccessToken).toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/test', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      method: 'GET'
    });
    expect(result).toEqual(mockResponse);
  });

  test('complete token refresh and retry flow', async () => {
    const mockResponse = { success: true };
    mockAuthProvider.refreshAccessToken.mockResolvedValue({ access_token: 'new-token' });

    fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(mockResponse)
      });

    const result = await apiService.post('/create', { name: 'test' });

    expect(mockAuthProvider.refreshAccessToken).toHaveBeenCalledWith('refresh-token');
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual(mockResponse);

    // Verify retry was called with new token
    const retryCall = fetch.mock.calls[1];
    expect(retryCall[1].headers.Authorization).toBe('Bearer new-token');
  });

  test('complete error handling flow', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Resource not found' })
    });

    await expect(apiService.get('/nonexistent')).rejects.toThrow('Resource not found');

    expect(consoleSpy).toHaveBeenCalledWith('API request failed:', expect.any(Error));
    expect(mockToastError).toHaveBeenCalledWith('Resource not found');

    consoleSpy.mockRestore();
  });
});