import React, { useState, useEffect } from 'react';
import { useApi } from '../../services/apiService';
import { useSecureApi } from '../../services/secureApiService';

const BookingList = ({ onSelectBooking, onBack }) => {
  const api = useApi();
  const secureApi = useSecureApi();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    payment_status: '',
    start_date: '',
    end_date: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchBookings();
  }, [currentPage, filters, searchTerm, sortBy]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: currentPage,
        per_page: 20,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });

      // Use secure API for fetching bookings
      const response = await secureApi.getSecureBookings(Object.fromEntries(params));
      // Handle both direct array and paginated response
      if (Array.isArray(response)) {
        setBookings(response);
        setTotalPages(1);
      } else {
        setBookings(response.bookings || []);
        setTotalPages(response.pages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      payment_status: '',
      start_date: '',
      end_date: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await api.put(`/admin/bookings/${bookingId}/status`, { status });
      // Refresh bookings after status update
      fetchBookings();
    } catch (err) {
      console.error('Failed to update booking status:', err);
      setError('Failed to update booking status');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-ZA');
  };

  const formatDateRange = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 'No dates';
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    return `${checkInDate.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })} - ${checkOutDate.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}`;
  };

  const formatGuestCount = (count) => {
    if (!count) return 'No guests specified';
    return count === 1 ? '1 guest' : `${count} guests`;
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) {
      return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(0);
    }
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  // Filter and sort bookings
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = searchTerm === '' ||
      (booking.guest_name || booking.guestName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.guest_email || booking.email || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filters.status === '' || booking.status === filters.status;
    const matchesPayment = filters.payment_status === '' || booking.payment_status === filters.payment_status;

    return matchesSearch && matchesStatus && matchesPayment;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.guest_name || a.guestName || '').localeCompare(b.guest_name || b.guestName || '');
      case 'checkin':
        return new Date(a.check_in || a.checkIn || '') - new Date(b.check_in || b.checkIn || '');
      case 'date':
      default:
        return new Date(b.created_at || b.createdAt || '') - new Date(a.created_at || a.createdAt || '');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary">Booking Management</h2>
          <p className="text-gray-600 mt-1">Manage all property bookings</p>
        </div>
        <button
          onClick={onBack}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-brown p-6 border border-secondary/20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Sort by:</label>
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="date">Created Date</option>
              <option value="name">Guest Name</option>
              <option value="checkin">Check-in Date</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              <i className="fas fa-times mr-2"></i>
              Clear
            </button>
          </div>
        </div>
      </div>


      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading bookings...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-triangle text-red-400"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={fetchBookings}
                className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {filteredBookings.length === 0 && (
            <div className="bg-white rounded-xl shadow-brown p-8 text-center border border-secondary/20">
              <i className="fas fa-calendar-times text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-500 text-lg">No bookings found</p>
              <p className="text-gray-400 mt-2">There are no bookings to display.</p>
            </div>
          )}

          {filteredBookings.map(booking => (
            <div key={booking.id} className="bg-white rounded-xl shadow-brown border border-secondary/20 cursor-pointer hover:shadow-lg transition-all duration-200" role="article" tabIndex="0"
                onClick={() => onSelectBooking(booking)}
                onKeyDown={(e) => e.key === 'Enter' && onSelectBooking(booking)}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{booking.guest_name || booking.guestName || 'Unknown Guest'}</h3>
                    <p className="text-gray-600">{booking.guest_email || booking.email || 'No email provided'}</p>
                    <p className="text-gray-600">{booking.guest_phone || booking.phone || 'No phone provided'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary" data-testid={`booking-amount-${booking.id}`}>{formatCurrency(booking.payment_amount || booking.totalAmount)}</div>
                    <p className="text-gray-500 text-sm">#{booking.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Check-in - Check-out</p>
                    <p className="font-medium">{formatDateRange(booking.check_in || booking.checkIn, booking.check_out || booking.checkOut)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Guests</p>
                    <p className="font-medium">{formatGuestCount(booking.guests)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`} data-testid={`booking-status-${booking.id}`}>
                      {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Special Requests</p>
                    <p className="font-medium text-sm">{booking.special_requests || booking.specialRequests || 'No special requests'}</p>
                    {booking.created_at && (
                      <p className="text-xs text-gray-400 mt-1">Created: {formatDate(booking.created_at)}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBooking(booking);
                    }}
                    className="bg-primary hover:bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    View Details
                  </button>
                  {booking.status === 'pending' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateBookingStatus(booking.id, 'confirmed');
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      Confirm
                    </button>
                  )}
                  {(booking.status === 'pending' || booking.status === 'confirmed') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateBookingStatus(booking.id, 'cancelled');
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingList;