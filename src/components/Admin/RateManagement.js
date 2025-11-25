import React, { useState, useEffect } from 'react';
import { useSecureApi } from '../../services/secureApiService';

const RateManagement = () => {
  const secureApi = useSecureApi();
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [formData, setFormData] = useState({
    rate_type: 'base',
    guests: 1,
    amount: '',
    start_date: '',
    end_date: '',
    description: ''
  });

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApi.getRates();
      setRates(response.rates);
    } catch (err) {
      console.error('Failed to fetch rates:', err);
      setError('Failed to load rates');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError(null);
      
      // Validate
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }
      
      if (formData.rate_type === 'special' && (!formData.start_date || !formData.end_date)) {
        setError('Please select start and end dates for special rates');
        return;
      }
      
      const payload = {
        rate_type: formData.rate_type,
        guests: parseInt(formData.guests),
        amount: parseFloat(formData.amount),
        description: formData.description || null
      };
      
      if (formData.rate_type === 'special') {
        payload.start_date = formData.start_date;
        payload.end_date = formData.end_date;
      }
      
      if (editingRate) {
        await secureApi.updateRate(editingRate.id, payload);
      } else {
        await secureApi.createRate(payload);
      }
      
      // Reset form and close modal
      setFormData({
        rate_type: 'base',
        guests: 1,
        amount: '',
        start_date: '',
        end_date: '',
        description: ''
      });
      setShowAddModal(false);
      setEditingRate(null);
      
      // Refresh rates
      await fetchRates();
    } catch (err) {
      console.error('Failed to save rate:', err);
      setError(err.response?.data?.error || 'Failed to save rate');
    }
  };

  const handleEdit = (rate) => {
    setEditingRate(rate);
    setFormData({
      rate_type: rate.rate_type,
      guests: rate.guests,
      amount: rate.amount.toString(),
      start_date: rate.start_date || '',
      end_date: rate.end_date || '',
      description: rate.description || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (rateId) => {
    if (!window.confirm('Are you sure you want to delete this rate?')) {
      return;
    }
    
    try {
      setError(null);
      await secureApi.deleteRate(rateId);
      await fetchRates();
    } catch (err) {
      console.error('Failed to delete rate:', err);
      setError(err.response?.data?.error || 'Failed to delete rate');
    }
  };

  const handleCancel = () => {
    setShowAddModal(false);
    setEditingRate(null);
    setFormData({
      rate_type: 'base',
      guests: 1,
      amount: '',
      start_date: '',
      end_date: '',
      description: ''
    });
    setError(null);
  };

  const baseRates = rates.filter(r => r.rate_type === 'base' && r.is_active);
  const specialRates = rates.filter(r => r.rate_type === 'special' && r.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold text-primary">Rate Management</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-accent transition-colors duration-200 flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          Add Rate
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Base Rates */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-dark-brown mb-4">Base Rates</h3>
        <div className="space-y-3">
          {baseRates.length === 0 ? (
            <p className="text-gray-500">No base rates configured</p>
          ) : (
            baseRates.map(rate => (
              <div key={rate.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <i className="fas fa-user text-primary text-2xl"></i>
                    <p className="text-sm text-gray-600 mt-1">{rate.guests} guest{rate.guests > 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">R{rate.amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">per night</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(rate)}
                    className="text-blue-600 hover:text-blue-800 px-3 py-1"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Special Rates */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-dark-brown mb-4">Special Rates</h3>
        <div className="space-y-3">
          {specialRates.length === 0 ? (
            <p className="text-gray-500">No special rates configured</p>
          ) : (
            specialRates.map(rate => (
              <div key={rate.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-gold text-white px-3 py-1 rounded-full text-sm font-semibold">
                        SPECIAL
                      </span>
                      <span className="text-sm text-gray-600">
                        {rate.guests} guest{rate.guests > 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-primary mb-1">R{rate.amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-600 mb-2">
                      <i className="fas fa-calendar mr-2"></i>
                      {new Date(rate.start_date).toLocaleDateString()} - {new Date(rate.end_date).toLocaleDateString()}
                    </p>
                    {rate.description && (
                      <p className="text-sm text-gray-700">{rate.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(rate)}
                      className="text-blue-600 hover:text-blue-800 px-3 py-1"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(rate.id)}
                      className="text-red-600 hover:text-red-800 px-3 py-1"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-dark-brown">
                  {editingRate ? 'Edit Rate' : 'Add New Rate'}
                </h3>
                <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
                  <i className="fas fa-times"></i>
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md mb-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate Type
                  </label>
                  <select
                    name="rate_type"
                    value={formData.rate_type}
                    onChange={handleInputChange}
                    disabled={editingRate !== null}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100"
                  >
                    <option value="base">Base Rate</option>
                    <option value="special">Special Rate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Guests
                  </label>
                  <select
                    name="guests"
                    value={formData.guests}
                    onChange={handleInputChange}
                    disabled={editingRate !== null && editingRate.rate_type === 'base'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100"
                  >
                    <option value="1">1 Guest</option>
                    <option value="2">2 Guests</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (ZAR)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="850.00"
                  />
                </div>

                {formData.rate_type === 'special' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="e.g., Summer Special, Holiday Discount"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-accent transition-colors duration-200"
                  >
                    {editingRate ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RateManagement;
