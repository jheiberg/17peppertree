import { toast } from 'react-toastify'; // Optional: for user notifications

class ApiService {
  constructor(authProvider) {
    this.authProvider = authProvider;
    this.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
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

    const url = `${this.baseURL}${endpoint}`;

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
      console.error('API request failed:', error);
      
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

  // Convenience methods
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

  // File upload with authentication
  async uploadFile(endpoint, file, options = {}) {
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

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    return this.parseResponse(response);
  }
}

export { ApiService };

// Hook to use API service
import { useAuth } from '../contexts/AuthContext';
import { useMemo } from 'react';

export function useApi() {
  const auth = useAuth();
  
  const apiService = useMemo(() => {
    return new ApiService(auth);
  }, [auth]);

  return apiService;
}