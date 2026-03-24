import React, { useEffect, useRef } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { maskRRN } from '../utils/dataMasking';

const TransactionStream = () => {
  const { liveFeed } = useDashboard();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [liveFeed]);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-blue-600 bg-blue-100';
      case 'timeout':
        return 'text-orange-600 bg-orange-100';
      case 'failure':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getDurationColor = (duration) => {
    if (duration < 1) return 'text-green-600';
    if (duration < 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Real-time Transaction Stream</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live Feed</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Recent Transactions</h3>
            <span className="text-xs text-gray-500">Last 50 transactions</span>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="overflow-y-auto max-h-96"
        >
          <div className="divide-y divide-gray-200">
            {liveFeed.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="flex flex-col items-center space-y-2">
                  <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No transactions available</p>
                  <p className="text-xs">Waiting for live data...</p>
                </div>
              </div>
            ) : (
              liveFeed.map((transaction, index) => (
                <div key={`${transaction.timestamp}-${index}`} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                      
                      <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                        <div>
                          <p className="text-xs text-gray-500">Timestamp</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(transaction.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500">Switch</p>
                          <p className="text-sm font-medium text-gray-900">{transaction.switch}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500">RRN</p>
                          <p className="text-sm font-mono text-gray-900">
                            {maskRRN(transaction.rrn)}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500">Status</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className={`text-sm font-medium ${getDurationColor(transaction.duration)}`}>
                            {transaction.duration}s
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Success</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Timeout</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Failure</span>
              </div>
            </div>
            <div>
              <span>Auto-refresh: 1 second</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionStream;
