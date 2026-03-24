/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in component tree and displays fallback UI
 */

import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.group(`🚨 React Error Boundary - ${errorId}`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    this.setState({
      error,
      errorInfo,
      errorId
    });

    // You could also send error to logging service here
    // this.logErrorToService(error, errorInfo, errorId);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = import.meta.env.DEV;
      
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-center text-gray-900 mb-2">
              Something went wrong
            </h2>
            
            <p className="text-gray-600 text-center mb-6">
              {this.props.fallbackMessage || 
               'An unexpected error occurred. Please try refreshing the page.'}
            </p>

            {this.state.errorId && (
              <div className="bg-gray-100 rounded p-3 mb-4">
                <p className="text-xs text-gray-500 text-center">
                  Error ID: <code className="bg-gray-200 px-1 rounded">{this.state.errorId}</code>
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              
              <button
                onClick={this.handleReload}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Reload Page
              </button>
            </div>

            {isDevelopment && this.state.error && (
              <details className="mt-6">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Development Details
                </summary>
                
                <div className="mt-3 space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Error Message:</h4>
                    <pre className="bg-red-50 text-red-800 p-2 rounded text-xs overflow-auto">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Component Stack:</h4>
                    <pre className="bg-gray-50 text-gray-800 p-2 rounded text-xs overflow-auto max-h-32">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
