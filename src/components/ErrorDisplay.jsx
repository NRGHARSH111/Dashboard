/**
 * Error Display Component
 * Provides consistent error display and handling across the application
 */

import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff, ServerCrash, Bug } from 'lucide-react';

export const ErrorDisplay = ({ 
  error, 
  onRetry, 
  onDismiss,
  className = '',
  showDetails = false,
  variant = 'default' 
}) => {
  if (!error) return null;

  const getErrorIcon = (type) => {
    switch (type) {
      case 'NETWORK_ERROR':
        return <WifiOff className="w-5 h-5" />;
      case 'AUTH_ERROR':
        return <AlertTriangle className="w-5 h-5" />;
      case 'ENDPOINT_NOT_FOUND':
        return <ServerCrash className="w-5 h-5" />;
      default:
        return <Bug className="w-5 h-5" />;
    }
  };

  const getErrorColor = (severity) => {
    switch (severity) {
      case 'HIGH':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const errorColor = getErrorColor(error.severity);
  const errorIcon = getErrorIcon(error.type);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${errorColor} ${className}`}>
        {errorIcon}
        <div className="flex-1">
          <p className="text-sm font-medium">{error.message}</p>
          {error.suggestion && (
            <p className="text-xs mt-1 opacity-75">{error.suggestion}</p>
          )}
        </div>
        <div className="flex gap-2">
          {onRetry && (
            <button
              onClick={handleRetry}
              className="p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
              title="Retry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {onDismiss && (
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
              title="Dismiss"
            >
              ×
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${errorColor} ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {errorIcon}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium mb-1">
            {error.type === 'NETWORK_ERROR' ? 'Connection Error' :
             error.type === 'AUTH_ERROR' ? 'Authentication Error' :
             error.type === 'ENDPOINT_NOT_FOUND' ? 'Not Found' :
             'Error'}
          </h3>
          
          <p className="text-sm mb-2">{error.message}</p>
          
          {error.suggestion && (
            <p className="text-xs opacity-75 mb-3">{error.suggestion}</p>
          )}

          {error.endpoint && (
            <p className="text-xs font-mono opacity-60 mb-3">
              Endpoint: {error.endpoint}
            </p>
          )}

          <div className="flex gap-2">
            {onRetry && (
              <button
                onClick={handleRetry}
                className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-white bg-opacity-50 rounded hover:bg-opacity-70 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            )}
            
            {showDetails && import.meta.env.DEV && (
              <details className="text-xs">
                <summary className="cursor-pointer font-medium">Details</summary>
                <pre className="mt-2 p-2 bg-black bg-opacity-10 rounded overflow-auto text-xs">
                  {JSON.stringify(error, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
            title="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export const ApiErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="min-h-[400px] flex items-center justify-center p-4">
    <div className="max-w-md w-full text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <ServerCrash className="w-8 h-8 text-red-600" />
      </div>
      
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        API Error
      </h2>
      
      <p className="text-gray-600 mb-6">
        {error?.message || 'Failed to load data from the server. Please try again.'}
      </p>

      <div className="space-y-3">
        <button
          onClick={resetErrorBoundary}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
        >
          Reload Page
        </button>
      </div>

      {import.meta.env.DEV && error && (
        <details className="mt-6 text-left">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            Error Details (Development)
          </summary>
          <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(error, null, 2)}
          </pre>
        </details>
      )}
    </div>
  </div>
);

export const NetworkErrorBanner = ({ error, onRetry }) => (
  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
    <div className="flex">
      <div className="flex-shrink-0">
        <WifiOff className="h-5 w-5 text-yellow-400" />
      </div>
      <div className="ml-3">
        <p className="text-sm text-yellow-700">
          <strong>Network Error:</strong> {error?.message || 'Unable to connect to the server'}
        </p>
        {onRetry && (
          <div className="mt-2">
            <button
              onClick={onRetry}
              className="text-sm text-yellow-700 underline hover:text-yellow-600"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default ErrorDisplay;
