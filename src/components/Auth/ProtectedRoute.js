import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function ProtectedRoute({ children, requiredRoles = [], requireAdmin = false }) {
  const { isAuthenticated, loading, isAdmin, initialized, user, logout } = useAuth();
  const location = useLocation();

  if (loading || !initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-dark-brown flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-brown p-8 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-color text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Store the attempted location for redirect after login
    sessionStorage.setItem('returnTo', location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-dark-brown flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-brown p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <i className="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
            <h2 className="text-2xl font-display font-bold text-red-600 mb-4">Access Denied</h2>
            <p className="text-text-color mb-2">You do not have permission to access this area.</p>
            {user && (
              <p className="text-sm text-gray-500">
                Signed in as: <span className="font-medium">{user.preferred_username || user.email}</span>
              </p>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gradient-to-r from-primary to-accent text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-brown hover:-translate-y-1"
            >
              <i className="fas fa-home mr-2"></i>
              Return to Home
            </button>

            <button
              onClick={logout}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:bg-gray-200"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check specific roles if required
  if (requiredRoles.length > 0) {
    const userRoles = user?.realm_access?.roles || [];
    const clientRoles = user?.resource_access?.['peppertree-admin']?.roles || [];
    const allUserRoles = [...userRoles, ...clientRoles];

    const hasRequiredRole = requiredRoles.some(role => allUserRoles.includes(role));

    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-primary to-dark-brown flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-brown p-8 max-w-md w-full text-center">
            <div className="mb-6">
              <i className="fas fa-user-times text-6xl text-orange-500 mb-4"></i>
              <h2 className="text-2xl font-display font-bold text-orange-600 mb-4">Insufficient Permissions</h2>
              <p className="text-text-color mb-2">You don't have the required role to access this resource.</p>
              <p className="text-sm text-gray-500">Required roles: {requiredRoles.join(', ')}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gradient-to-r from-primary to-accent text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-brown hover:-translate-y-1"
              >
                <i className="fas fa-home mr-2"></i>
                Return to Home
              </button>

              <button
                onClick={logout}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:bg-gray-200"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return children;
}

export default ProtectedRoute;