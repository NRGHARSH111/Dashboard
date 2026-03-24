import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, RefreshCw, Activity, ArrowUp, ArrowDown, Pause, Play } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { maskRRN } from '../utils/dataMasking';

/**
 * Live Scrolling Feed Component - TFL Monitoring Dashboard
 * 
 * Features:
 * 1. Table with: Timestamp, Switch, Direction, RRN, MsgType, Status, Duration, ErrorCode
 * 2. Color-coded status: Success-Green, Pending-Blue, Timeout-Orange, Failure-Red
 * 3. Frontend filters for Switch Type, Bank ID, and Status
 * 4. 1-second real-time updates (TFL Section 16 compliance)
 * 5. Smooth scrolling and animations
 */
const LiveScrollingFeed = () => {
  const { liveFeed } = useDashboard();
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filters, setFilters] = useState({
    switchType: 'ALL',
    bankId: 'ALL',
    status: 'ALL',
    txnType: 'ALL',
    timeWindow: 'ALL'
  });
  const [searchFilters, setSearchFilters] = useState({
    rrn: '',
    utr: '',
    txnId: '',
    stan: '',
    switchRefId: ''
  });
  const [debouncedSearchFilters, setDebouncedSearchFilters] = useState({
    rrn: '',
    utr: '',
    txnId: '',
    stan: '',
    switchRefId: ''
  });
  const [transactions, setTransactions] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const scrollRef = useRef(null);
  const feedEndRef = useRef(null);
  const intervalRef = useRef(null);

  // Switch types for filter
  const switchTypes = ['ALL', 'UPI', 'IMPS', 'BANL'];
  
  // Bank IDs for filter (mock data)
  const bankIds = ['ALL', 'HDFC', 'ICICI', 'SBI', 'AXIS', 'KOTAK', 'PNB', 'BOB'];
  
  // Status options for filter
  const statusOptions = ['ALL', 'SUCCESS', 'PENDING', 'TIMEOUT', 'FAILURE', 'LINK_DOWN'];
  
  // Transaction type options for filter
  const txnTypeOptions = ['ALL', 'REQ', 'RES', 'ACK', 'ERR'];
  
  // Time window options for filter
  const timeWindowOptions = ['ALL', 'Last 1 min', 'Last 5 min', 'Last 15 min', 'Last 1 hr'];

  // Generate realistic transaction data
  const generateTransaction = (index) => {
    const switches = ['UPI', 'IMPS', 'BANL'];
    const banks = ['HDFC', 'ICICI', 'SBI', 'AXIS', 'KOTAK', 'PNB', 'BOB'];
    const statuses = ['SUCCESS', 'PENDING', 'TIMEOUT', 'FAILURE', 'LINK_DOWN'];
    const messageTypes = ['REQ', 'RES', 'ACK', 'ERR'];
    const directions = ['INBOUND', 'OUTBOUND'];
    
    const switchType = switches[Math.floor(Math.random() * switches.length)];
    const bankId = banks[Math.floor(Math.random() * banks.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const messageType = messageTypes[Math.floor(Math.random() * messageTypes.length)];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    
    // Generate realistic error codes for failures
    let errorCode = null;
    if (status === 'FAILURE') {
      const errorCodes = ['NPCI001', 'NET001', 'VAL001', 'DUP001', 'SYS001'];
      errorCode = errorCodes[Math.floor(Math.random() * errorCodes.length)];
    }
    
    return {
      id: `txn-${Date.now()}-${index}`,
      timestamp: new Date(Date.now() - Math.random() * 60000),
      switch: switchType,
      bankId,
      direction,
      rrn: Math.random().toString().substring(2, 14),
      messageType,
      status,
      duration: Math.round(Math.random() * 5000) / 1000, // in seconds
      errorCode,
      // Additional correlation fields for search
      utr: Math.random().toString(36).substring(2, 15).toUpperCase(),
      txnId: `TXN${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      stan: Math.random().toString().substring(2, 8),
      switchRefId: `SWR${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    };
  };

  // Initialize and update transactions
  useEffect(() => {
    // Generate initial transactions
    const initialTransactions = Array.from({ length: 50 }, (_, i) => generateTransaction(i));
    setTransactions(initialTransactions);

    // Update every second if not paused and tab is visible
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setTransactions(prev => {
          const newTransaction = generateTransaction(Date.now());
          const updated = [newTransaction, ...prev.slice(0, 99)]; // Keep max 100
          return updated;
        });
        setLastUpdate(new Date());
      }, 1000);

      // Handle visibility change
      const handleVisibilityChange = () => {
        if (document.hidden) {
          clearInterval(intervalRef.current);
        } else {
          intervalRef.current = setInterval(() => {
            setTransactions(prev => {
              const newTransaction = generateTransaction(Date.now());
              const updated = [newTransaction, ...prev.slice(0, 99)]; // Keep max 100
              return updated;
            });
            setLastUpdate(new Date());
          }, 1000);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(intervalRef.current);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isPaused]);

  // Auto-scroll to top when new transactions arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current && !isPaused) {
      scrollRef.current.scrollTop = 0;
    }
  }, [transactions, autoScroll, isPaused]);

  // Debounce search filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchFilters(searchFilters);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchFilters]);

  // Filter transactions based on selected filters and search
  const filteredTransactions = useMemo(() => {
    const now = Date.now();
    
    // Get time window in milliseconds
    const getTimeWindowMs = (window) => {
      switch (window) {
        case 'Last 1 min': return 60 * 1000;
        case 'Last 5 min': return 5 * 60 * 1000;
        case 'Last 15 min': return 15 * 60 * 1000;
        case 'Last 1 hr': return 60 * 60 * 1000;
        default: return Infinity;
      }
    };
    
    const timeWindowMs = getTimeWindowMs(filters.timeWindow);
    
    return transactions.filter(txn => {
      const switchMatch = filters.switchType === 'ALL' || txn.switch === filters.switchType;
      const bankMatch = filters.bankId === 'ALL' || txn.bankId === filters.bankId;
      const statusMatch = filters.status === 'ALL' || txn.status === filters.status;
      const txnTypeMatch = filters.txnType === 'ALL' || txn.messageType === filters.txnType;
      const timeMatch = filters.timeWindow === 'ALL' || (now - txn.timestamp.getTime()) <= timeWindowMs;
      
      // Search filters with AND logic
      const rrnMatch = !debouncedSearchFilters.rrn || txn.rrn.toLowerCase().includes(debouncedSearchFilters.rrn.toLowerCase());
      const utrMatch = !debouncedSearchFilters.utr || txn.utr.toLowerCase().includes(debouncedSearchFilters.utr.toLowerCase());
      const txnIdMatch = !debouncedSearchFilters.txnId || txn.txnId.toLowerCase().includes(debouncedSearchFilters.txnId.toLowerCase());
      const stanMatch = !debouncedSearchFilters.stan || txn.stan.toLowerCase().includes(debouncedSearchFilters.stan.toLowerCase());
      const switchRefIdMatch = !debouncedSearchFilters.switchRefId || txn.switchRefId.toLowerCase().includes(debouncedSearchFilters.switchRefId.toLowerCase());
      
      return switchMatch && bankMatch && statusMatch && txnTypeMatch && timeMatch && rrnMatch && utrMatch && txnIdMatch && stanMatch && switchRefIdMatch;
    });
  }, [transactions, filters, debouncedSearchFilters]);

  // Get status color with TFL compliance
  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'PENDING':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'TIMEOUT':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'FAILURE':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'LINK_DOWN':
        return 'bg-red-900/30 text-red-200 border-red-800/50';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  // Get duration color
  const getDurationColor = (duration) => {
    if (duration < 1) return 'text-green-400';
    if (duration < 3) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Get switch type color
  const getSwitchColor = (switchType) => {
    switch (switchType) {
      case 'UPI': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'IMPS': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'BANL': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  // Get direction color
  const getDirectionColor = (direction) => {
    return direction === 'INBOUND' 
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      : 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Handle search filter changes
  const handleSearchFilterChange = (field, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      switchType: 'ALL',
      bankId: 'ALL',
      status: 'ALL',
      txnType: 'ALL',
      timeWindow: 'ALL'
    });
    setSearchFilters({
      rrn: '',
      utr: '',
      txnId: '',
      stan: '',
      switchRefId: ''
    });
  };

  // Clear search filters only
  const clearSearchFilters = () => {
    setSearchFilters({
      rrn: '',
      utr: '',
      txnId: '',
      stan: '',
      switchRefId: ''
    });
  };

  // Highlight matched text in search
  const highlightMatch = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <span key={index} className="bg-yellow-500/30 text-yellow-300 font-medium px-0.5 rounded">
          {part}
        </span>
      ) : part
    );
  };

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02
      }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  };

  return (
    <motion.div 
      className="glass rounded-lg shadow-lg p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <motion.div 
            className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30"
            whileHover={{ scale: 1.05 }}
          >
            <Activity className="w-6 h-6 text-blue-400" />
          </motion.div>
          <div>
            <h2 className="text-xl font-semibold text-gray-100">Live Scrolling Feed</h2>
            <p className="text-sm text-gray-400">Real-time transaction stream with filtering</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <motion.div 
              className={`w-2 h-2 rounded-full ${isPaused ? 'bg-gray-500' : 'bg-green-500'}`}
              animate={!isPaused ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span>{isPaused ? 'Paused' : 'Live'}</span>
          </div>
          <div className="text-xs text-gray-500">
            Last: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <motion.div 
        className="glass-dark rounded-lg p-4 mb-6 border border-gray-700"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-300">Search Correlation IDs</h3>
          </div>
          <motion.button
            onClick={clearSearchFilters}
            className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Clear Search
          </motion.button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* RRN Search */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">RRN</label>
            <input
              type="text"
              value={searchFilters.rrn}
              onChange={(e) => handleSearchFilterChange('rrn', e.target.value)}
              placeholder="Search RRN..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* UTR Search */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">UTR</label>
            <input
              type="text"
              value={searchFilters.utr}
              onChange={(e) => handleSearchFilterChange('utr', e.target.value)}
              placeholder="Search UTR..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* TxnID Search */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">TxnID</label>
            <input
              type="text"
              value={searchFilters.txnId}
              onChange={(e) => handleSearchFilterChange('txnId', e.target.value)}
              placeholder="Search TxnID..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* STAN Search */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">STAN</label>
            <input
              type="text"
              value={searchFilters.stan}
              onChange={(e) => handleSearchFilterChange('stan', e.target.value)}
              placeholder="Search STAN..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* SwitchRefID Search */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">SwitchRefID</label>
            <input
              type="text"
              value={searchFilters.switchRefId}
              onChange={(e) => handleSearchFilterChange('switchRefId', e.target.value)}
              placeholder="Search SwitchRefID..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Active Search Filters Display */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {searchFilters.rrn && (
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs border border-yellow-500/30">
              RRN: {searchFilters.rrn}
            </span>
          )}
          {searchFilters.utr && (
            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs border border-purple-500/30">
              UTR: {searchFilters.utr}
            </span>
          )}
          {searchFilters.txnId && (
            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-xs border border-cyan-500/30">
              TxnID: {searchFilters.txnId}
            </span>
          )}
          {searchFilters.stan && (
            <span className="px-2 py-1 bg-pink-500/20 text-pink-300 rounded text-xs border border-pink-500/30">
              STAN: {searchFilters.stan}
            </span>
          )}
          {searchFilters.switchRefId && (
            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs border border-indigo-500/30">
              SwitchRefID: {searchFilters.switchRefId}
            </span>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div 
        className="glass-dark rounded-lg p-4 mb-6 border border-gray-700"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-300">Filters</h3>
          </div>
          <motion.button
            onClick={clearFilters}
            className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Clear All
          </motion.button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Switch Type Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Switch Type</label>
            <select
              value={filters.switchType}
              onChange={(e) => handleFilterChange('switchType', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {switchTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Bank ID Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Bank ID</label>
            <select
              value={filters.bankId}
              onChange={(e) => handleFilterChange('bankId', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {bankIds.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Txn Type Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Txn Type</label>
            <select
              value={filters.txnType}
              onChange={(e) => handleFilterChange('txnType', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {txnTypeOptions.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Time Window Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Time Window</label>
            <select
              value={filters.timeWindow}
              onChange={(e) => handleFilterChange('timeWindow', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {timeWindowOptions.map(window => (
                <option key={window} value={window}>{window}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        <div className="flex items-center space-x-2 mt-4">
          {filters.switchType !== 'ALL' && (
            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs border border-purple-500/30">
              Switch: {filters.switchType}
            </span>
          )}
          {filters.bankId !== 'ALL' && (
            <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs border border-green-500/30">
              Bank: {filters.bankId}
            </span>
          )}
          {filters.status !== 'ALL' && (
            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs border border-blue-500/30">
              Status: {filters.status}
            </span>
          )}
          {filters.txnType !== 'ALL' && (
            <span className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded text-xs border border-amber-500/30">
              Txn Type: {filters.txnType}
            </span>
          )}
          {filters.timeWindow !== 'ALL' && (
            <span className="px-2 py-1 bg-teal-500/20 text-teal-300 rounded text-xs border border-teal-500/30">
              Time: {filters.timeWindow}
            </span>
          )}
        </div>
      </motion.div>

      {/* Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-400">
          Showing <span className="font-medium text-gray-200">{filteredTransactions.length}</span> of{' '}
          <span className="font-medium text-gray-200">{transactions.length}</span> transactions
        </div>
        
        <div className="flex items-center space-x-2">
          <motion.button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              autoScroll 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-600 text-gray-300'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
          </motion.button>
          
          <motion.button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1 ${
              isPaused 
                ? 'bg-green-600 text-white' 
                : 'bg-red-600 text-white'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </motion.button>
        </div>
      </div>

      {/* Transaction Table */}
      <motion.div 
        className="glass-dark rounded-lg border border-gray-700 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div 
          ref={scrollRef}
          className="overflow-x-auto max-h-96"
        >
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-gray-400 font-medium">Timestamp</th>
                <th className="px-3 py-2 text-left text-gray-400 font-medium">Switch</th>
                <th className="px-3 py-2 text-left text-gray-400 font-medium">Direction</th>
                <th className="px-3 py-2 text-left text-gray-400 font-medium">RRN</th>
                <th className="px-3 py-2 text-left text-gray-400 font-medium">UTR</th>
                <th className="px-3 py-2 text-left text-gray-400 font-medium">TxnID</th>
                <th className="px-3 py-2 text-left text-gray-400 font-medium">STAN</th>
                <th className="px-3 py-2 text-left text-gray-400 font-medium">SwitchRefID</th>
                <th className="px-3 py-2 text-left text-gray-400 font-medium">MsgType</th>
                <th className="px-3 py-2 text-left text-gray-400 font-medium">Status</th>
                <th className="px-3 py-2 text-left text-gray-400 font-medium">Duration</th>
                <th className="px-3 py-2 text-left text-gray-400 font-medium">ErrorCode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              <AnimatePresence>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="px-4 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center space-y-2">
                        <RefreshCw className="w-8 h-8 text-gray-600" />
                        <p>No transactions found</p>
                        <p className="text-xs">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((txn, index) => (
                    <motion.tr
                      key={txn.id}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      transition={{ duration: 0.2, delay: index * 0.01 }}
                      className={`hover:bg-gray-800/30 transition-colors ${
                        index === 0 ? 'bg-blue-900/20' : ''
                      }`}
                    >
                      <td className="px-3 py-2 text-gray-300">
                        {txn.timestamp.toLocaleTimeString()}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getSwitchColor(txn.switch)}`}>
                          {txn.switch}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getDirectionColor(txn.direction)}`}>
                          {txn.direction}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-xs text-gray-300">
                          {highlightMatch(maskRRN(txn.rrn), debouncedSearchFilters.rrn)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-xs text-gray-300">
                          {highlightMatch(txn.utr, debouncedSearchFilters.utr)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-xs text-gray-300">
                          {highlightMatch(txn.txnId, debouncedSearchFilters.txnId)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-xs text-gray-300">
                          {highlightMatch(txn.stan, debouncedSearchFilters.stan)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-xs text-gray-300">
                          {highlightMatch(txn.switchRefId, debouncedSearchFilters.switchRefId)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-300">
                        {txn.messageType}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(txn.status)}`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`font-medium ${getDurationColor(txn.duration)}`}>
                          {txn.duration}s
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {txn.errorCode ? (
                          <span className="font-mono text-xs text-red-400">
                            {txn.errorCode}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
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
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-900 rounded-full border border-red-700"></div>
            <span>Link Down</span>
          </div>
        </div>
        <div>
          Updates every 1 second • Max 100 transactions
        </div>
      </div>
    </motion.div>
  );
};

export default LiveScrollingFeed;
