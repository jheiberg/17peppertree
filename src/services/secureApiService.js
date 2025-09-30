import { toast } from 'react-toastify';

class SecureApiService {
  constructor(authProvider) {
    this.authProvider = authProvider;
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    this.secureBaseURL = `${this.baseURL}/secure`;
  }

  async request(endpoint, options = {}) {
    const accessToken = await this.authProvider.getAccessToken();

    if (!accessToken && !options.skipAuth) {
      throw new Error('No valid access token available');
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        ...options.headers,
      },
      ...options,
    };

    const url = `${this.secureBaseURL}${endpoint}`;

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized
      if (response.status === 401 && !options.skipAuth) {
        // Token might be expired, try to refresh
        const currentTokens = this.authProvider.tokens;
        if (currentTokens?.refresh_token) {
          const newTokens = await this.authProvider.refreshAccessToken(currentTokens.refresh_token);

          if (newTokens?.access_token) {
            // Retry the request with new token
            config.headers.Authorization = `Bearer ${newTokens.access_token}`;
            const retryResponse = await fetch(url, config);

            if (!retryResponse.ok) {
              throw new Error(`HTTP error! status: ${retryResponse.status}`);
            }

            return this.parseResponse(retryResponse);
          }
        }

        // Refresh failed, redirect to login
        this.authProvider.logout();
        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return this.parseResponse(response);
    } catch (error) {
      console.error('Secure API request failed:', error);

      // Optional: Show user-friendly error messages
      if (toast) {
        toast.error(error.message || 'An error occurred');
      }

      throw error;
    }
  }

  async parseResponse(response) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }

  // Convenience methods for secure endpoints
  get(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data, options) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // Secure API specific methods
  async getSecureHealth() {
    return this.get('/health');
  }

  async getSecureBookings(filters = {}) {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });

    const endpoint = queryParams.toString() ? `/bookings?${queryParams}` : '/bookings';
    return this.get(endpoint);
  }

  async getSecureBooking(bookingId) {
    return this.get(`/booking/${bookingId}`);
  }

  async createSecureBooking(bookingData) {
    return this.post('/booking', bookingData);
  }

  async getSecureDashboardStats() {
    return this.get('/dashboard/stats');
  }

  async testClientCredentials() {
    return this.get('/auth/test');
  }

  async getClientInfo() {
    return this.get('/client/info');
  }

  // File upload with authentication to secure endpoints
  async uploadFileSecure(endpoint, file, options = {}) {
    const accessToken = await this.authProvider.getAccessToken();

    const formData = new FormData();
    formData.append('file', file);

    // Add any additional form fields
    if (options.fields) {
      Object.entries(options.fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const config = {
      method: 'POST',
      headers: {
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        ...options.headers,
      },
      body: formData,
    };

    const response = await fetch(`${this.secureBaseURL}${endpoint}`, config);

    if (!response.ok) {
      throw new Error(`Secure upload failed: ${response.status}`);
    }

    return this.parseResponse(response);
  }
}

export { SecureApiService };

// Hook to use secure API service
import { useAuth } from '../contexts/AuthContext';
import { useMemo } from 'react';

export function useSecureApi() {
  const auth = useAuth();

  const secureApiService = useMemo(() => {
    return new SecureApiService(auth);
  }, [auth]);

  return secureApiService;
}