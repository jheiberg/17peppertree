// contexts/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

const AuthContext = createContext();

// Configuration
const KEYCLOAK_CONFIG = {
  url: process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.REACT_APP_KEYCLOAK_REALM || 'peppertree',
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'peppertree-admin',
  // Always use current origin for redirect to ensure localStorage consistency
  redirectUri: `${window.location.origin}/auth/callback`
};

// Debug configuration
console.log('Keycloak Configuration (PKCE Public Client):', {
  url: KEYCLOAK_CONFIG.url,
  realm: KEYCLOAK_CONFIG.realm,
  clientId: KEYCLOAK_CONFIG.clientId,
  redirectUri: KEYCLOAK_CONFIG.redirectUri,
  clientSecret: 'NOT_SET (PKCE Public Client)',
  currentOrigin: window.location.origin,
  currentUrl: window.location.href
});

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REFRESH_TOKEN: 'REFRESH_TOKEN',
  SET_LOADING: 'SET_LOADING',
  INITIALIZE: 'INITIALIZE'
};

// Initial state
const initialState = {
  isAuthenticated: false,
  user: null,
  tokens: null,
  loading: true,
  initialized: false,
  error: null
};

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null
      };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        tokens: action.payload.tokens,
        loading: false,
        error: null
      };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        tokens: null,
        loading: false,
        error: action.payload.error
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        tokens: null,
        loading: false,
        error: null
      };
    case AUTH_ACTIONS.REFRESH_TOKEN:
      return {
        ...state,
        tokens: action.payload.tokens
      };
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    case AUTH_ACTIONS.INITIALIZE:
      return {
        ...state,
        initialized: true,
        loading: false
      };
    default:
      return state;
  }
}

// Utility functions
const generateState = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

const generateCodeVerifier = () => {
  // Generate a code verifier according to RFC 7636
  // Must be 43-128 characters long, URL-safe
  const array = new Uint8Array(32); // 32 bytes = 43 characters when base64url encoded
  crypto.getRandomValues(array);
  return base64URLEncode(array);
};

const base64URLEncode = (input) => {
  let str;
  if (input instanceof Uint8Array) {
    str = String.fromCharCode(...input);
  } else {
    str = input;
  }
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

const sha256 = async (plain) => {
  try {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API not available');
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return await window.crypto.subtle.digest('SHA-256', data);
  } catch (error) {
    console.error('SHA256 error:', error);
    // For HTTP environments, return null to indicate we should use plain method
    return null;
  }
};

const generateCodeChallenge = async (verifier) => {
  try {
    const hashed = await sha256(verifier);
    if (hashed === null) {
      // Web Crypto API not available, use plain method
      console.log('Using PKCE plain method due to HTTP environment');
      return { challenge: verifier, method: 'plain' };
    }
    return {
      challenge: base64URLEncode(String.fromCharCode(...new Uint8Array(hashed))),
      method: 'S256'
    };
  } catch (error) {
    console.error('Code challenge generation error:', error);
    // Fallback: use plain method
    console.log('Falling back to PKCE plain method');
    return { challenge: verifier, method: 'plain' };
  }
};

// Storage helpers
const STORAGE_KEYS = {
  TOKENS: 'keycloak_tokens',
  USER: 'keycloak_user',
  STATE: 'keycloak_state',
  CODE_VERIFIER: 'keycloak_code_verifier'
};

const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage error:', error);
    }
  },
  remove: (key) => localStorage.removeItem(key),
  clear: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }
};

// AuthProvider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedTokens = storage.get(STORAGE_KEYS.TOKENS);
        const storedUser = storage.get(STORAGE_KEYS.USER);

        if (storedTokens && storedUser) {
          // Check if tokens are still valid
          const isValidToken = await validateToken(storedTokens.access_token);
          
          if (isValidToken) {
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: { tokens: storedTokens, user: storedUser }
            });
          } else {
            // Try to refresh token
            const refreshed = await refreshAccessToken(storedTokens.refresh_token);
            if (refreshed) {
              dispatch({
                type: AUTH_ACTIONS.LOGIN_SUCCESS,
                payload: { tokens: refreshed, user: storedUser }
              });
            } else {
              storage.clear();
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        storage.clear();
      }

      dispatch({ type: AUTH_ACTIONS.INITIALIZE });
    };

    initAuth();
  }, []);

  // Login function
  const login = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      const state = generateState();
      const codeVerifier = generateCodeVerifier();
      const codeChallengeResult = await generateCodeChallenge(codeVerifier);

      console.log('PKCE generation:', {
        state: state,
        codeVerifier: codeVerifier.substring(0, 10) + '...',
        codeVerifierLength: codeVerifier.length,
        codeChallenge: codeChallengeResult.challenge,
        codeChallengeMethod: codeChallengeResult.method,
        codeChallengeLength: codeChallengeResult.challenge.length,
        clientId: KEYCLOAK_CONFIG.clientId,
        redirectUri: KEYCLOAK_CONFIG.redirectUri
      });

      // Store state and code verifier for later verification
      storage.set(STORAGE_KEYS.STATE, state);
      storage.set(STORAGE_KEYS.CODE_VERIFIER, codeVerifier);

      const authParams = new URLSearchParams({
        client_id: KEYCLOAK_CONFIG.clientId,
        redirect_uri: KEYCLOAK_CONFIG.redirectUri,
        response_type: 'code',
        scope: 'openid profile email',
        state: state,
        code_challenge: codeChallengeResult.challenge,
        code_challenge_method: codeChallengeResult.method
      });

      const authUrl = `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/auth?${authParams}`;

      console.log('Redirecting to auth URL:', authUrl);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Login error:', error);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: error.message }
      });
    }
  };

  // Handle callback after redirect from Keycloak
  const handleCallback = useCallback(async (code, state, error) => {
    try {
      if (error) {
        throw new Error(`Authentication error: ${error}`);
      }

      if (!code || !state) {
        throw new Error('Missing authorization code or state');
      }

      // Verify state
      const storedState = storage.get(STORAGE_KEYS.STATE);
      console.log('State validation:', { received: state, stored: storedState });

      if (state !== storedState) {
        throw new Error(`Invalid state parameter. Expected: ${storedState}, Received: ${state}`);
      }

      const codeVerifier = storage.get(STORAGE_KEYS.CODE_VERIFIER);
      console.log('Code verifier validation:', {
        stored: codeVerifier ? codeVerifier.substring(0, 10) + '...' : '[MISSING]',
        length: codeVerifier ? codeVerifier.length : 0
      });

      if (!codeVerifier) {
        throw new Error('Missing code verifier');
      }

      // Exchange code for tokens
      const tokens = await exchangeCodeForTokens(code, codeVerifier);

      // Get user info
      const userInfo = await getUserInfo(tokens.access_token);

      // Store tokens and user info
      storage.set(STORAGE_KEYS.TOKENS, tokens);
      storage.set(STORAGE_KEYS.USER, userInfo);

      // Clean up temporary storage
      storage.remove(STORAGE_KEYS.STATE);
      storage.remove(STORAGE_KEYS.CODE_VERIFIER);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { tokens, user: userInfo }
      });

      return { success: true };
    } catch (error) {
      console.error('Callback handling error:', error);
      storage.clear();

      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: error.message }
      });

      return { success: false, error: error.message };
    }
  }, []); // Empty dependency array since the function doesn't depend on any state

  // Logout function
  const logout = async () => {
    try {
      if (state.tokens?.refresh_token) {
        // Logout from Keycloak
        await fetch(`${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: KEYCLOAK_CONFIG.clientId,
            refresh_token: state.tokens.refresh_token
          })
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      storage.clear();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Refresh access token
  const refreshAccessToken = async (refreshToken) => {
    try {
      console.log('Attempting token refresh with Keycloak...');

      console.log('Refresh token details:', {
        refreshToken: refreshToken ? 'present' : 'missing',
        clientId: KEYCLOAK_CONFIG.clientId,
        url:
      `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`
      });
      const response = await fetch(`${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: KEYCLOAK_CONFIG.clientId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token refresh failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
      }

      const tokens = await response.json();
      console.log('Token refresh successful');

      storage.set(STORAGE_KEYS.TOKENS, tokens);

      dispatch({
        type: AUTH_ACTIONS.REFRESH_TOKEN,
        payload: { tokens }
      });

      return tokens;
    } catch (error) {
      console.error('Token refresh error:', error);

      // Clear invalid tokens and force re-login
      storage.clear();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });

      return null;
    }
  };

  // Exchange authorization code for tokens
  const exchangeCodeForTokens = async (code, codeVerifier) => {
    const tokenRequestBody = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: KEYCLOAK_CONFIG.redirectUri,
      client_id: KEYCLOAK_CONFIG.clientId,
      code_verifier: codeVerifier
    };

    console.log('Token exchange request:', {
      url: `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`,
      body: {
        ...tokenRequestBody,
        client_secret: tokenRequestBody.client_secret ? '[REDACTED]' : undefined,
        code: code ? '[PROVIDED]' : '[MISSING]',
        code_verifier: codeVerifier ? `[PROVIDED-${codeVerifier.length}]` : '[MISSING]',
        redirect_uri_match: tokenRequestBody.redirect_uri === KEYCLOAK_CONFIG.redirectUri
      }
    });

    const response = await fetch(`${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(tokenRequestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Token exchange failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Token exchange failed: ${errorData}`);
    }

    return await response.json();
  };

  // Get user info from Keycloak
  const getUserInfo = async (accessToken) => {
    const response = await fetch(`${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/userinfo`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return await response.json();
  };

  // Validate token
  const validateToken = async (accessToken) => {
    try {
      const response = await fetch(`${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/userinfo`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      return response.ok;
    } catch {
      return false;
    }
  };

  // Get valid access token (refresh if needed)
  const getAccessToken = async () => {
    if (!state.tokens) return null;

    // Check if token is still valid (simple check - you might want to decode JWT for expiry)
    const isValid = await validateToken(state.tokens.access_token);
    
    if (isValid) {
      return state.tokens.access_token;
    }

    // Try to refresh
    if (state.tokens.refresh_token) {
      const newTokens = await refreshAccessToken(state.tokens.refresh_token);
      return newTokens?.access_token || null;
    }

    return null;
  };

  // Decode JWT token (simple base64 decode - for role checking only)
  const decodeJWT = (token) => {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      console.error('JWT decode error:', error);
      return null;
    }
  };

  // Check if user has admin role
  const isAdmin = () => {
    if (!state.tokens?.access_token) return false;

    const tokenData = decodeJWT(state.tokens.access_token);
    if (!tokenData) return false;

    // Check for admin role in JWT token
    const roles = tokenData.realm_access?.roles || [];
    const clientRoles = tokenData.resource_access?.[KEYCLOAK_CONFIG.clientId]?.roles || [];

    return roles.includes('admin') ||
           roles.includes('realm-admin') ||
           clientRoles.includes('admin') ||
           clientRoles.includes('peppertree-admin');
  };

  const contextValue = {
    ...state,
    login,
    logout,
    handleCallback,
    getAccessToken,
    refreshAccessToken,
    isAdmin
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}