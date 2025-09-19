import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export function UserProfile() {
  const { user, logout, isAuthenticated } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  if (!isAuthenticated || !user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100"
      >
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
          {user.given_name?.[0] || user.preferred_username?.[0] || 'U'}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900">
            {user.name || user.preferred_username}
          </p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      </button>

      {showDetails && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                {user.given_name?.[0] || user.preferred_username?.[0] || 'U'}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {user.name || user.preferred_username}
                </h3>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Username:</span>
                <p className="text-gray-600">{user.preferred_username}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email Verified:</span>
                <p className="text-gray-600">{user.email_verified ? 'Yes' : 'No'}</p>
              </div>
            </div>
            
            {user.realm_access?.roles && (
              <div>
                <span className="font-medium text-gray-700">Roles:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {user.realm_access.roles.map(role => (
                    <span
                      key={role}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={logout}
              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
