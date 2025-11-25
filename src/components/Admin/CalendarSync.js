import React, { useState, useEffect } from 'react';
import { useSecureApi } from '../../services/secureApiService';

const CalendarSync = ({ onBack }) => {
  const secureApi = useSecureApi();
  const [icalInfo, setIcalInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importPlatform, setImportPlatform] = useState('airbnb');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchIcalInfo();
  }, []);

  const fetchIcalInfo = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/ical/info`);
      const data = await response.json();
      setIcalInfo(data);
    } catch (err) {
      console.error('Failed to fetch iCal info:', err);
      setError('Failed to load calendar sync information');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    if (icalInfo?.export_url) {
      navigator.clipboard.writeText(icalInfo.export_url);
      setMessage('URL copied to clipboard!');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    
    if (!importUrl.trim()) {
      setError('Please enter an iCal URL');
      return;
    }

    try {
      setImporting(true);
      setError(null);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/ical/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ical_url: importUrl,
          platform: importPlatform
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Successfully imported ${data.imported} booking(s). ${data.skipped} duplicates skipped.`);
        setImportUrl('');
        setTimeout(() => setMessage(null), 5000);
      } else {
        setError(data.error || 'Failed to import calendar');
      }
    } catch (err) {
      console.error('Import failed:', err);
      setError('Failed to import calendar feed');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading calendar sync...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary">Calendar Synchronization</h2>
          <p className="text-gray-600 mt-1">Sync your bookings with Airbnb, Booking.com, and other platforms</p>
        </div>
        <button
          onClick={onBack}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Dashboard
        </button>
      </div>

      {message && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
          <div className="flex items-center">
            <i className="fas fa-check-circle text-green-400 mr-3"></i>
            <p className="text-sm text-green-700">{message}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center">
            <i className="fas fa-exclamation-triangle text-red-400 mr-3"></i>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Export Section */}
      <div className="bg-white rounded-xl shadow-brown p-6 border border-secondary/20">
        <div className="flex items-center mb-4">
          <i className="fas fa-upload text-primary text-2xl mr-3"></i>
          <h3 className="text-xl font-display font-semibold text-primary">Export Your Bookings</h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          Copy this URL and paste it into other booking platforms to sync your confirmed bookings:
        </p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={icalInfo?.export_url || ''}
            readOnly
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
          />
          <button
            onClick={handleCopyUrl}
            className="bg-primary hover:bg-accent text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            <i className="fas fa-copy mr-2"></i>
            Copy URL
          </button>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">How to use:</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="font-bold mr-2">Airbnb:</span>
              <span>{icalInfo?.instructions?.airbnb}</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">Booking.com:</span>
              <span>{icalInfo?.instructions?.booking_com}</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">Other platforms:</span>
              <span>{icalInfo?.instructions?.general}</span>
            </li>
          </ul>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {icalInfo?.features?.map((feature, index) => (
            <div key={index} className="flex items-center text-sm text-gray-700">
              <i className="fas fa-check text-green-500 mr-2"></i>
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-xl shadow-brown p-6 border border-secondary/20">
        <div className="flex items-center mb-4">
          <i className="fas fa-download text-primary text-2xl mr-3"></i>
          <h3 className="text-xl font-display font-semibold text-primary">Import External Bookings</h3>
        </div>

        <p className="text-gray-600 mb-4">
          Import bookings from Airbnb, Booking.com, or other platforms to keep your calendar in sync:
        </p>

        <form onSubmit={handleImport} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform
            </label>
            <select
              value={importPlatform}
              onChange={(e) => setImportPlatform(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="airbnb">Airbnb</option>
              <option value="booking.com">Booking.com</option>
              <option value="vrbo">VRBO</option>
              <option value="lekkeslaap">LekkeSlaap</option>
              <option value="safarinow">SafariNow</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              iCal Feed URL
            </label>
            <input
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://www.airbnb.com/calendar/ical/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Get this URL from your booking platform's calendar export/sync settings
            </p>
          </div>

          <button
            type="submit"
            disabled={importing}
            className="w-full bg-primary hover:bg-accent text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Importing...
              </>
            ) : (
              <>
                <i className="fas fa-download mr-2"></i>
                Import Bookings
              </>
            )}
          </button>
        </form>

        <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <div className="flex">
            <i className="fas fa-info-circle text-yellow-600 mr-3 mt-0.5"></i>
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Note:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Imported bookings are automatically marked as confirmed</li>
                <li>Duplicate bookings (same dates) are skipped</li>
                <li>You can import from multiple platforms</li>
                <li>Imported bookings will block those dates on your calendar</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Reference */}
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-6 border border-primary/20">
        <h3 className="text-lg font-display font-semibold text-primary mb-3">
          <i className="fas fa-lightbulb mr-2"></i>
          Quick Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-semibold mb-2">Best Practices:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Update platforms when you get new bookings</li>
              <li>Check for conflicts regularly</li>
              <li>Keep your calendar URLs secure</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Sync Frequency:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Export URL updates in real-time</li>
              <li>Import manually when needed</li>
              <li>Most platforms refresh every 24 hours</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarSync;
