
import React from 'react';

const DashboardStats = ({ stats, onViewBookings }) => {
  if (!stats) return null;

  const formatCurrency = (amount) => {
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-display font-bold text-primary">Dashboard Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-brown p-6 border border-secondary/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Bookings</h3>
              <p className="text-3xl font-bold text-primary mt-2">{stats.stats.total_bookings}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-calendar-alt text-2xl text-blue-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-brown p-6 border border-secondary/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Pending Bookings</h3>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.stats.pending_bookings}</p>
              {stats.stats.pending_bookings > 0 && (
                <button
                  onClick={onViewBookings}
                  className="mt-3 text-sm text-yellow-600 hover:text-yellow-800 font-medium transition-colors duration-200"
                >
                  View Pending →
                </button>
              )}
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-clock text-2xl text-yellow-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-brown p-6 border border-secondary/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Approved Bookings</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.stats.approved_bookings}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-check-circle text-2xl text-green-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-brown p-6 border border-secondary/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Pending Payments</h3>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.stats.pending_payments}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-credit-card text-2xl text-orange-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-brown p-6 border border-secondary/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Paid Bookings</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.stats.paid_bookings}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-dollar-sign text-2xl text-green-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-brown p-6 border border-secondary/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Revenue</h3>
              <p className="text-3xl font-bold text-primary mt-2">{formatCurrency(stats.stats.total_revenue)}</p>
            </div>
            <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center">
              <i className="fas fa-chart-line text-2xl text-gold"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-brown border border-secondary/20">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-display font-semibold text-primary">Recent Bookings</h3>
        </div>

        <div className="overflow-hidden">
          {stats.recent_bookings && stats.recent_bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recent_bookings.map(booking => (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{booking.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.guest_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(booking.check_in).toLocaleDateString('en-ZA')}
                      </td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <i className="fas fa-calendar-times text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-500 text-lg">No recent bookings</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={onViewBookings}
            className="w-full bg-gradient-to-r from-primary to-accent text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-brown hover:-translate-y-1"
          >
            <i className="fas fa-list mr-2"></i>
            View All Bookings
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;