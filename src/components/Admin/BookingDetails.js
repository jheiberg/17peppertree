import React, { useState, useEffect } from 'react';
import { useApi } from '../../services/apiService';

const BookingDetails = ({ bookingId, onBack, onUpdate }) => {
  const api = useApi();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: '',
    admin_notes: '',
    notify_guest: true
  });
  const [paymentForm, setPaymentForm] = useState({
    payment_status: '',
    payment_amount: '',
    payment_reference: '',
    payment_method: ''
  });

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get(`/admin/booking/${bookingId}`);
      setBooking(data);
      setStatusForm({
        status: data.status,
        admin_notes: data.admin_notes || '',
        notify_guest: true
      });
      setPaymentForm({
        payment_status: data.payment_status || 'pending',
        payment_amount: data.payment_amount || '',
        payment_reference: data.payment_reference || '',
        payment_method: data.payment_method || ''
      });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch booking details:', err);
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await api.put(`/admin/booking/${bookingId}/status`, statusForm);
      alert('Booking status updated successfully');
      fetchBookingDetails();
      onUpdate();
    } catch (err) {
      console.error('Failed to update booking status:', err);
      alert('Failed to update booking status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentUpdate = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await api.put(`/admin/booking/${bookingId}/payment`, paymentForm);
      alert('Payment information updated successfully');
      fetchBookingDetails();
      onUpdate();
    } catch (err) {
      console.error('Failed to update payment:', err);
      alert('Failed to update payment information');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this booking?')) {
      return;
    }

    try {
      setUpdating(true);
      await api.delete(`/admin/booking/${bookingId}`);
      alert('Booking deleted successfully');
      onBack();
      onUpdate();
    } catch (err) {
      console.error('Failed to delete booking:', err);
      alert('Failed to delete booking');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-ZA');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <i className="fas fa-exclamation-triangle text-red-400"></i>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-display font-bold text-primary">Booking #{booking.id}</h2>
        <button
          onClick={onBack}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to List
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-brown p-6 border border-secondary/20">
          <h3 className="text-xl font-display font-semibold text-primary mb-4">Guest Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="font-medium text-gray-700">Name:</span>
              <span className="text-gray-900">{booking.guest_name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="font-medium text-gray-700">Email:</span>
              <span className="text-gray-900">{booking.guest_email}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="font-medium text-gray-700">Phone:</span>
              <span className="text-gray-900">{booking.guest_phone}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-brown p-6 border border-secondary/20">
          <h3 className="text-xl font-display font-semibold text-primary mb-4">Booking Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="font-medium text-gray-700">Check-in:</span>
              <span className="text-gray-900">{formatDate(booking.check_in)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="font-medium text-gray-700">Check-out:</span>
              <span className="text-gray-900">{formatDate(booking.check_out)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="font-medium text-gray-700">Number of Guests:</span>
              <span className="text-gray-900">{booking.guests}</span>
            </div>
            <div className="py-2">
              <span className="font-medium text-gray-700 block mb-2">Special Requests:</span>
              <span className="text-gray-900">{booking.message || 'None'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-brown p-6 border border-secondary/20">
          <h3 className="text-xl font-display font-semibold text-primary mb-4">Status Management</h3>
          <form onSubmit={handleStatusUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusForm.status}
                onChange={(e) => setStatusForm({...statusForm, status: e.target.value})}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
              <textarea
                value={statusForm.admin_notes}
                onChange={(e) => setStatusForm({...statusForm, admin_notes: e.target.value})}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Add notes about this status change..."
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notify_guest"
                checked={statusForm.notify_guest}
                onChange={(e) => setStatusForm({...statusForm, notify_guest: e.target.checked})}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="notify_guest" className="ml-2 block text-sm text-gray-700">
                Notify guest via email
              </label>
            </div>
            <button
              type="submit"
              disabled={updating}
              className="w-full bg-gradient-to-r from-primary to-accent text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-brown hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? 'Updating...' : 'Update Status'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-brown p-6 border border-secondary/20">
          <h3 className="text-xl font-display font-semibold text-primary mb-4">Payment Management</h3>
          <form onSubmit={handlePaymentUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <select
                value={paymentForm.payment_status}
                onChange={(e) => setPaymentForm({...paymentForm, payment_status: e.target.value})}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount (ZAR)</label>
              <input
                type="number"
                step="0.01"
                value={paymentForm.payment_amount}
                onChange={(e) => setPaymentForm({...paymentForm, payment_amount: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Reference</label>
              <input
                type="text"
                value={paymentForm.payment_reference}
                onChange={(e) => setPaymentForm({...paymentForm, payment_reference: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Transaction reference or receipt number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select method</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit_card">Credit Card</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={updating}
              className="w-full bg-gradient-to-r from-primary to-accent text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-brown hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? 'Updating...' : 'Update Payment'}
            </button>
          </form>
        </div>
      </div>

      {booking.status_history && booking.status_history.length > 0 && (
        <div className="bg-white rounded-xl shadow-brown p-6 border border-secondary/20">
          <h3 className="text-xl font-display font-semibold text-primary mb-4">Status History</h3>
          <div className="space-y-3">
            {booking.status_history.map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">{formatDateTime(entry.changed_at)}</span>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {entry.status || entry.type}
                  </span>
                  <span className="text-sm text-gray-700">{entry.changed_by}</span>
                </div>
                {entry.notes && (
                  <span className="text-sm text-gray-600 italic">{entry.notes}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-brown p-6 border border-secondary/20">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <div>Created: {formatDateTime(booking.created_at)}</div>
            {booking.updated_at && <div>Updated: {formatDateTime(booking.updated_at)}</div>}
          </div>
          <button
            onClick={handleDelete}
            disabled={updating}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-trash mr-2"></i>
            Delete Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;