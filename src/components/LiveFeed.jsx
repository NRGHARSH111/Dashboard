import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../context/DashboardContext';
import { maskAccount, maskRRN } from '../utils/dataMasking';
import { Filter, ChevronDown, Calendar, X, RefreshCw } from 'lucide-react';

const LiveFeed = () => {
  const { liveFeed } = useDashboard();
  const [isLive, setIsLive] = useState(true);

  // Filter states
  const [filters, setFilters] = useState({
    switchType: 'all',
    bankId: 'all',
    status: 'all',
    timeWindow: '1h'
  });
  const [showFilters, setShowFilters] = useState(false);

  console.log('📡 LiveFeed: Using centralized data from DashboardContext with TFL Section 16 compliant 1s refresh');
  console.log('🔒 LiveFeed: Account numbers masked for TFL Section 17 compliance');
  console.log('🔍 LiveFeed: Filter interface implemented with glassmorphism theme');

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS': return 'text-status-success bg-green-50';
      case 'PENDING': return 'text-status-pending bg-blue-50';
      case 'TIMEOUT': return 'text-status-timeout bg-orange-50';
      case 'FAILURE': return 'text-status-failure bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getLatencyColor = (latency) => {
    if (latency <= 100) return 'text-status-success';
    if (latency <= 200) return 'text-status-pending';
    if (latency <= 300) return 'text-status-timeout';
    return 'text-status-failure';
  };

  // Filter options
  const switchTypes = [
    { value: 'all', label: 'All Switches' },
    { value: 'UPI', label: 'UPI' },
    { value: 'IMPS', label: 'IMPS' },
    { value: 'BANL', label: 'BANL' }
  ];

  const bankIds = [
    { value: 'all', label: 'All Banks' },
    { value: 'TFL001', label: 'TFL Bank Ltd' },
    { value: 'SBI001', label: 'State Bank of India' },
    { value: 'HDFC001', label: 'HDFC Bank' },
    { value: 'ICIC001', label: 'ICICI Bank' },
    { value: 'PNB001', label: 'Punjab National Bank' }
  ];

  const statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'SUCCESS', label: 'Success' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'TIMEOUT', label: 'Timeout' },
    { value: 'FAILURE', label: 'Failure' }
  ];

  const timeWindows = [
    { value: '15m', label: 'Last 15 Minutes' },
    { value: '1h', label: 'Last 1 Hour' },
    { value: '6h', label: 'Last 6 Hours' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' }
  ];

  // Filter logic
  const filteredFeed = useMemo(() => {
    let filtered = [...liveFeed];
    
    // Time window filter
    if (filters.timeWindow !== 'all') {
      const now = new Date();
      const timeMap = {
        '15m': 15 * 60 * 1000,
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
      };
      const cutoffTime = new Date(now.getTime() - timeMap[filters.timeWindow]);
      filtered = filtered.filter(txn => new Date(txn.timestamp) >= cutoffTime);
    }

    // Switch type filter
    if (filters.switchType !== 'all') {
      filtered = filtered.filter(txn => txn.type === filters.switchType);
    }

    // Bank ID filter
    if (filters.bankId !== 'all') {
      filtered = filtered.filter(txn => 
        txn.fromBank === filters.bankId || txn.toBank === filters.bankId
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(txn => txn.status === filters.status);
    }

    return filtered;
  }, [liveFeed, filters]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const clearFilters = () => {
    setFilters({
      switchType: 'all',
      bankId: 'all',
      status: 'all',
      timeWindow: '1h'
    });
  };

  const activeFilterCount = Object.values(filters).filter(value => value !== 'all' && value !== '1h').length;

  return (
    <motion.div 
      className="w-full glass rounded-lg shadow-sm border border-gray-200 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header with Filter Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">📊</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Live Transaction Feed</h2>
          <motion.div 
            className="flex items-center space-x-2"
            animate={{ opacity: isLive ? [1, 0.5, 1] : 1 }}
            transition={{ duration: 1, repeat: isLive ? Infinity : 0 }}
          >
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-status-success' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">{isLive ? 'Live' : 'Paused'}</span>
          </motion.div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Filter Button */}
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
              showFilters || activeFilterCount > 0
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'glass border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <motion.span 
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                {activeFilterCount}
              </motion.span>
            )}
          </motion.button>

          <motion.button
            onClick={() => setIsLive(!isLive)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isLive 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-status-success hover:bg-green-600 text-white'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLive ? 'Pause' : 'Resume'}
          </motion.button>
        </div>
      </div>

      {/* Filter Bar - Glassmorphism Theme */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="glass rounded-lg border border-gray-200 p-4 mb-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Switch Type Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 flex items-center space-x-1">
                  <RefreshCw className="w-3 h-3" />
                  <span>Switch Type</span>
                </label>
                <div className="relative">
                  <select
                    value={filters.switchType}
                    onChange={(e) => handleFilterChange('switchType', e.target.value)}
                    className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer hover:bg-white/90 transition-colors"
                  >
                    {switchTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Bank ID Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 flex items-center space-x-1">
                  <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                  <span>Bank ID</span>
                </label>
                <div className="relative">
                  <select
                    value={filters.bankId}
                    onChange={(e) => handleFilterChange('bankId', e.target.value)}
                    className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer hover:bg-white/90 transition-colors"
                  >
                    {bankIds.map(bank => (
                      <option key={bank.value} value={bank.value}>
                        {bank.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Status</span>
                </label>
                <div className="relative">
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer hover:bg-white/90 transition-colors"
                  >
                    {statuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Time Window Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>Time Window</span>
                </label>
                <div className="relative">
                  <select
                    value={filters.timeWindow}
                    onChange={(e) => handleFilterChange('timeWindow', e.target.value)}
                    className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer hover:bg-white/90 transition-colors"
                  >
                    {timeWindows.map(window => (
                      <option key={window.value} value={window.value}>
                        {window.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-600">
                {activeFilterCount > 0 && (
                  <span className="flex items-center space-x-1">
                    <span>{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>
                    <span className="text-gray-400">•</span>
                    <span>{filteredFeed.length} transactions found</span>
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {activeFilterCount > 0 && (
                  <motion.button
                    onClick={clearFilters}
                    className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-3 h-3" />
                    <span>Clear All</span>
                  </motion.button>
                )}
                <motion.button
                  onClick={() => setShowFilters(false)}
                  className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Close
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-gray-700 font-medium">Time</th>
                <th className="px-4 py-3 text-left text-gray-700 font-medium">Type</th>
                <th className="px-4 py-3 text-left text-gray-700 font-medium">RRN</th>
                <th className="px-4 py-3 text-left text-gray-700 font-medium">From</th>
                <th className="px-4 py-3 text-left text-gray-700 font-medium">To</th>
                <th className="px-4 py-3 text-left text-gray-700 font-medium">Amount</th>
                <th className="px-4 py-3 text-left text-gray-700 font-medium">Latency</th>
                <th className="px-4 py-3 text-left text-gray-700 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredFeed.map((txn, index) => (
                <motion.tr 
                  key={txn.id} 
                  className={`hover:bg-gray-50 transition-colors ${
                    index === 0 ? 'bg-blue-50' : ''
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                >
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(txn.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {txn.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                    {maskRRN(txn.rrn)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-600">
                      <div className="text-xs">{txn.fromBank}</div>
                      <div className="font-mono text-xs">{maskAccount(txn.fromAccount)}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-600">
                      <div className="text-xs">{txn.toBank}</div>
                      <div className="font-mono text-xs">{maskAccount(txn.toAccount)}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    ₹{parseFloat(txn.amount).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${getLatencyColor(txn.latency)}`}>
                      {txn.latency}ms
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(txn.status)}`}>
                      {txn.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <div>Showing {filteredFeed.length} of {liveFeed.length} transactions</div>
        <div>Updates every 1 second</div>
      </div>
    </motion.div>
  );
};

export default LiveFeed;
