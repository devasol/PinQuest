import React from 'react';
import { useNavigate } from 'react-router-dom';

const FallbackErrorPage = ({ error = null, resetError = null, message = "An unexpected error occurred" }) => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    if (resetError) {
      resetError();
    }
    window.location.reload();
  };

  const handleGoHome = () => {
    if (resetError) {
      resetError();
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
          <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Oops! Something went wrong</h1>
        <p className="mt-2 text-gray-600">
          {message}
        </p>
        {process.env.NODE_ENV === 'development' && error && (
          <div className="mt-4 text-left text-sm text-gray-500 bg-gray-50 p-3 rounded">
            <details>
              <summary className="cursor-pointer">Error details</summary>
              <pre className="mt-2 overflow-auto max-h-40">
                {error.toString()}
              </pre>
            </details>
          </div>
        )}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Refresh Page
          </button>
          <button
            onClick={handleGoHome}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default FallbackErrorPage;