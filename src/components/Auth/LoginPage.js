import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const { isAuthenticated, login, loading, error, initialized } = useAuth();
  const [isLogging, setIsLogging] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && initialized) {
      // Check for return URL from sessionStorage
      const returnTo = sessionStorage.getItem('returnTo') || '/admin';
      sessionStorage.removeItem('returnTo');
      navigate(returnTo, { replace: true });
    }
  }, [isAuthenticated, initialized, navigate]);

  const handleLogin = async () => {
    try {
      setIsLogging(true);
      await login();
    } catch (err) {
      console.error('Login error:', err);
      setIsLogging(false);
    }
  };

  if (loading || !initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-dark-brown flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-brown p-8 w-full max-w-md text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-color">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-dark-brown flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-brown p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-primary mb-2">17 @ Peppertree</h1>
          <h2 className="text-xl font-display text-dark-brown mb-4">Welcome</h2>
          <p className="text-text-color">Please sign in to access your account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={isLogging}
          className={`w-full bg-gradient-to-r from-primary to-accent text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-brown hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
            isLogging ? 'cursor-not-allowed' : ''
          }`}
        >
          {isLogging ? (
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              Signing in...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <i className="fas fa-sign-in-alt"></i>
              Sign in with Keycloak
            </div>
          )}
        </button>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-accent hover:text-primary transition-colors duration-300 text-sm font-medium"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Return to main site
          </a>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;