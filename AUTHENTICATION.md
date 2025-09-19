# Authentication System

## Overview

The application uses Keycloak for authentication with a React frontend and proper session management. The AuthContext has been redesigned to provide reliable authentication flow for admin users.

## Key Components

### AuthContext (`src/contexts/AuthContext.js`)
- **Automatic Initialization**: Keycloak initializes on app startup, not just on login
- **Session Detection**: Uses `check-sso` to detect existing sessions without forcing login
- **State Management**: Clean React state management with proper initialization tracking
- **Token Management**: Automatic token refresh and proper cleanup

### ProtectedRoute (`src/components/Admin/ProtectedRoute.js`)
- Guards admin routes requiring authentication
- Simplified logic that works with the redesigned AuthContext
- Proper loading states and redirect handling

### Silent SSO (`public/silent-check-sso.html`)
- Required file for Keycloak silent authentication checks
- Enables seamless session detection across page refreshes

## Authentication Flow

### 1. App Startup
- AuthContext automatically initializes Keycloak with `check-sso`
- Checks for existing authentication tokens
- Sets up token refresh intervals if authenticated

### 2. Existing Session
- User automatically authenticated if valid session exists
- No additional login required on page refresh
- Seamless experience across browser sessions

### 3. New Login Process
1. User clicks "Sign in with Keycloak" on `/admin/login`
2. Clean redirect to Keycloak authentication server
3. User completes authentication
4. Redirect back to `/admin` dashboard
5. AuthContext loads user profile and sets up session

### 4. Token Management
- Automatic token refresh every 60 seconds
- Refreshes tokens 30 seconds before expiry
- Axios interceptor automatically includes auth headers
- Complete cleanup on logout

### 5. Logout Process
- Clears all authentication state
- Removes token refresh intervals
- Clears Axios authorization headers
- Redirects to Keycloak logout with return to home page

## Configuration

### Environment Variables
```bash
# Keycloak Server Configuration
KEYCLOAK_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=peppertree
KEYCLOAK_CLIENT_ID=peppertree-admin
KEYCLOAK_CLIENT_SECRET=FJFjicG2Qv8u8wfYZIjwGPzMYDd4aZy0

# React App Configuration
REACT_APP_KEYCLOAK_URL=http://localhost:8080
REACT_APP_KEYCLOAK_REALM=peppertree
REACT_APP_KEYCLOAK_CLIENT_ID=peppertree-admin
```

### Keycloak Setup
- Realm: `peppertree`
- Client: `peppertree-admin`
- Valid redirect URIs: `http://localhost:3000/admin/*`
- Admin role: `peppertree-admin` or `admin`

## Key Features

### Session Persistence
- Authentication persists across page refreshes
- Silent SSO checking for seamless user experience
- Proper session cleanup on logout

### Role-Based Access
- Admin role checking with `isAdmin()` function
- Supports both `admin` and `peppertree-admin` roles
- Role verification before granting access

### Error Handling
- Graceful handling of authentication failures
- Proper fallback states during loading
- Clear error messages and redirect flows

## Troubleshooting

### Common Issues
1. **Keycloak not accessible**: Verify `KEYCLOAK_SERVER_URL` is correct
2. **Redirect loops**: Check valid redirect URIs in Keycloak client config
3. **Token refresh failures**: Verify client secret and realm configuration
4. **Role access denied**: Ensure user has `peppertree-admin` or `admin` role

### Development Setup
1. Start Keycloak server on port 8080
2. Configure realm and client as specified
3. Create admin user with appropriate roles
4. Verify environment variables match Keycloak configuration

## Security Considerations

- Tokens are automatically refreshed and secured
- No sensitive data stored in localStorage
- Proper cleanup prevents token leakage
- Role-based access control enforced
- HTTPS recommended for production environments