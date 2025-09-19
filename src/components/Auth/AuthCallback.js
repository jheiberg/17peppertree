import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function AuthCallback() {
  const { handleCallback } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple processing attempts
    if (processedRef.current) {
      return;
    }

    const processCallback = async () => {
      try {
        processedRef.current = true;

        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const authError = searchParams.get('error');

        console.log('Processing callback with:', { code: !!code, state: !!state, authError });

        if (authError) {
          setStatus('error');
          setError(`Authentication failed: ${authError}`);
          return;
        }

        if (!code) {
          setStatus('error');
          setError('No authorization code received');
          return;
        }

        if (!state) {
          setStatus('error');
          setError('No state parameter received');
          return;
        }

        const result = await handleCallback(code, state, authError);

        if (result.success) {
          setStatus('success');
          // Redirect to intended destination or admin dashboard after a brief success message
          setTimeout(() => {
            const returnTo = sessionStorage.getItem('returnTo') || '/admin';
            sessionStorage.removeItem('returnTo');
            navigate(returnTo, { replace: true });
          }, 1500);
        } else {
          setStatus('error');
          setError(result.error || 'Authentication failed');
        }
      } catch (err) {
        console.error('Callback processing error:', err);
        setStatus('error');
        setError('An unexpected error occurred during authentication');
      }
    };

    processCallback();
  }, [handleCallback, searchParams, navigate]); // handleCallback is now properly memoized

  const handleRetry = () => {
    processedRef.current = false; // Reset the processed flag
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-dark-brown flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-brown p-8 w-full max-w-md text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-6"></div>
            <h2 className="text-xl font-display font-semibold text-primary mb-2">Processing Authentication</h2>
            <p className="text-text-color">Please wait while we complete your sign-in...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-check text-2xl text-green-600"></i>
            </div>
            <h2 className="text-xl font-display font-semibold text-green-600 mb-2">Authentication Successful</h2>
            <p className="text-text-color">Redirecting you now...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-exclamation-triangle text-2xl text-red-600"></i>
            </div>
            <h2 className="text-xl font-display font-semibold text-red-600 mb-4">Authentication Failed</h2>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md text-left">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full bg-gradient-to-r from-primary to-accent text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-brown hover:-translate-y-1"
              >
                <i className="fas fa-redo mr-2"></i>
                Try Again
              </button>
              <button
                onClick={() => navigate('/', { replace: true })}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:bg-gray-200"
              >
                <i className="fas fa-home mr-2"></i>
                Return to Home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;