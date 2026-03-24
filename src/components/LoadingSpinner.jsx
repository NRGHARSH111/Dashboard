/**
 * Loading Spinner Component
 * Provides consistent loading states across the application
 */

import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

export const LoadingSpinner = ({ 
  size = 'md', 
  text = 'Loading...', 
  className = '',
  showText = true,
  centered = true 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const containerClasses = centered ? 'flex items-center justify-center' : 'flex items-center';

  return (
    <div className={`${containerClasses} ${className}`}>
      <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size]}`} />
      {showText && text && (
        <span className="ml-2 text-gray-600 text-sm">{text}</span>
      )}
    </div>
  );
};

export const LoadingCard = ({ title, className = '' }) => (
  <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="space-y-3">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        <div className="h-3 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  </div>
);

export const LoadingTable = ({ rows = 5, columns = 4 }) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="animate-pulse">
      <div className="border-b border-gray-200 p-4">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="h-3 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const LoadingState = ({ 
  type = 'spinner', 
  title = 'Loading...', 
  description,
  size = 'md',
  className = ''
}) => {
  const renderContent = () => {
    switch (type) {
      case 'card':
        return <LoadingCard title={title} className={className} />;
      
      case 'table':
        return <LoadingTable className={className} />;
      
      case 'skeleton':
        return (
          <div className={`animate-pulse space-y-4 ${className}`}>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        );
      
      default:
        return (
          <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
            <LoadingSpinner size={size} text={title} />
            {description && (
              <p className="mt-2 text-sm text-gray-500 text-center">{description}</p>
            )}
          </div>
        );
    }
  };

  return renderContent();
};

export const RefreshingIndicator = ({ isRefreshing = false, text = 'Refreshing...' }) => (
  <div className={`flex items-center gap-2 text-sm text-gray-600 ${isRefreshing ? 'opacity-100' : 'opacity-0'}`}>
    <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
    <span>{text}</span>
  </div>
);

export default LoadingSpinner;
