import React, { useState, useEffect } from 'react';
import { useApi } from '../../services/apiService';

const BookingList = ({ onSelectBooking, onBack }) => {
  const api = useApi();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    payment_status: '',
    start_date: '',
    end_date: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchBookings();
  }, [currentPage, filters]);

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

      const data = await api.get(`/admin/bookings?${params}`);
      setBookings(data.bookings);
      setTotalPages(data.pages);
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
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-ZA');
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
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

  const getPaymentColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-orange-100 text-orange-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-display font-bold text-primary">Booking Management</h2>
        <button
          onClick={onBack}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-brown p-6 border border-secondary/20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment</label>
            <select
              name="payment_status"
              value={filters.payment_status}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Payments</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
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
        <div className="bg-white rounded-xl shadow-brown border border-secondary/20">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guests</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{booking.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.guest_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.guest_email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(booking.check_in)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(booking.check_out)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.guests}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentColor(booking.payment_status)}`}>
                        {booking.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(booking.payment_amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => onSelectBooking(booking)}
                        className="bg-primary hover:bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {bookings.length === 0 && (
            <div className="p-8 text-center">
              <i className="fas fa-calendar-times text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-500 text-lg">No bookings found</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                <i className="fas fa-chevron-left mr-2"></i>
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Next
                <i className="fas fa-chevron-right ml-2"></i>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingList;