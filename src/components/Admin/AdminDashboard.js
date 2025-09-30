import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../services/apiService';
import { useSecureApi } from '../../services/secureApiService';
import BookingList from './BookingList';
import BookingDetails from './BookingDetails';
import DashboardStats from './DashboardStats';

const AdminDashboard = () => {
  const { user, isAdmin, logout } = useAuth();
  const api = useApi();
  const secureApi = useSecureApi();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAdmin()) {
      setError('You do not have permission to access this page');
      return;
    }
    fetchDashboardStats();
  }, [isAdmin]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use secure API for dashboard stats
      const data = await secureApi.getSecureDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSelect = (booking) => {
    setSelectedBooking(booking);
    setCurrentView('details');
  };

  const handleBackToList = () => {
    setSelectedBooking(null);
    setCurrentView('bookings');
  };

  const handleBackToDashboard = () => {
    setSelectedBooking(null);
    setCurrentView('dashboard');
    fetchDashboardStats();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-display font-bold text-primary">17 @ Peppertree Admin</h1>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setCurrentView('dashboard');
                  if (currentView !== 'dashboard') {
                    fetchDashboardStats();
                  }
                }}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  currentView === 'dashboard'
                    ? 'bg-primary text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <i className="fas fa-chart-pie mr-2"></i>
                Dashboard
              </button>
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setCurrentView('bookings');
                  setError(null);
                }}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  currentView === 'bookings'
                    ? 'bg-primary text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <i className="fas fa-calendar-alt mr-2"></i>
                Bookings
              </button>
            </nav>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-sm text-gray-500">
                Welcome, <span className="font-medium text-gray-900">{user?.name || user?.preferred_username || user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden border-t border-gray-200">
          <div className="px-4 py-3 space-y-1">
            <button
              onClick={() => {
                setSelectedBooking(null);
                setCurrentView('dashboard');
                if (currentView !== 'dashboard') {
                  fetchDashboardStats();
                }
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                currentView === 'dashboard'
                  ? 'bg-primary text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <i className="fas fa-chart-pie mr-2"></i>
              Dashboard
            </button>
            <button
              onClick={() => {
                setSelectedBooking(null);
                setCurrentView('bookings');
                setError(null);
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                currentView === 'bookings'
                  ? 'bg-primary text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <i className="fas fa-calendar-alt mr-2"></i>
              Bookings
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-exclamation-triangle text-red-400"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={fetchDashboardStats}
                  className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {currentView === 'dashboard' && (
              <DashboardStats
                stats={stats}
                onViewBookings={() => setCurrentView('bookings')}
              />
            )}

            {currentView === 'bookings' && !selectedBooking && (
              <BookingList
                onSelectBooking={handleBookingSelect}
                onBack={handleBackToDashboard}
              />
            )}

            {currentView === 'details' && selectedBooking && (
              <BookingDetails
                bookingId={selectedBooking.id}
                onBack={handleBackToList}
                onUpdate={fetchDashboardStats}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;