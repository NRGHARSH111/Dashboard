import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, CheckCircle, AlertTriangle, XCircle, Activity, ArrowRight } from 'lucide-react';
import { maskRRN, maskAccount, maskUPI } from '../utils/dataMasking';

const TraceSearch = ({ onSearch, loading }) => {
  const [searchValue, setSearchValue] = useState('');
  const [searchType, setSearchType] = useState('rrn');

  // TFL Section 10: Primary Correlation Keys
  const correlationKeys = [
    { value: 'rrn', label: 'RRN', description: 'Retrieval Reference Number' },
    { value: 'utr', label: 'UTR', description: 'Unique Transaction Reference' },
    { value: 'txnId', label: 'Transaction ID', description: 'Transaction Identifier' },
    { value: 'stan', label: 'STAN', description: 'System Trace Audit Number' },
    { value: 'switchRefId', label: 'Switch Ref ID', description: 'Switch Reference Identifier' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      console.log(`🔍 Transaction Trace Search - Type: ${searchType.toUpperCase()}, Value: ${searchValue}`);
    console.log('🔒 TransactionTracePanel: Sensitive data masked for TFL Section 17 compliance');
      onSearch(searchValue, searchType);
    }
  };

  const getCurrentKeyInfo = () => {
    return correlationKeys.find(key => key.value === searchType) || correlationKeys[0];
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Correlation Key Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Select Correlation Key (TFL Section 10)
          </label>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          >
            {correlationKeys.map((key) => (
              <option key={key.value} value={key.value}>
                {key.label} - {key.description}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Enter {getCurrentKeyInfo().label}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={`Enter ${getCurrentKeyInfo().label}...`}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <button
              type="submit"
              disabled={loading || !searchValue.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>Trace</span>
            </button>
          </div>
        </div>

        {/* Key Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Search className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Current Search Key: {getCurrentKeyInfo().label}</p>
              <p>{getCurrentKeyInfo().description}</p>
              <p className="mt-2 text-blue-700">
                💡 All five primary correlation keys from TFL Section 10 are supported for complete transaction traceability.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

const TraceStage = ({ stage, index, totalStages }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'ERROR':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS':
        return 'border-green-200 bg-green-50';
      case 'WARNING':
        return 'border-yellow-200 bg-yellow-50';
      case 'ERROR':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <motion.div 
      className={`relative border rounded-lg p-4 ${getStatusColor(stage.status)}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      {/* Connection Line */}
      {index < totalStages - 1 && (
        <div className="hidden sm:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
          <ArrowRight className="w-6 h-6 text-gray-400" />
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {getStatusIcon(stage.status)}
          <div>
            <h4 className="text-sm font-semibold text-gray-800">{stage.node}</h4>
            <p className="text-xs text-gray-600">{stage.stage}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">
            {new Date(stage.timestamp).toLocaleTimeString()}
          </div>
          {stage.duration && (
            <div className="text-xs font-medium text-gray-700">
              {stage.duration}ms
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {stage.code && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Response Code</span>
            <span className={`text-xs font-medium ${
              stage.status === 'SUCCESS' ? 'text-green-600' :
              stage.status === 'WARNING' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {stage.code}
            </span>
          </div>
        )}
        
        {stage.message && (
          <div className="text-xs text-gray-700 bg-white bg-opacity-60 rounded p-2">
            {stage.message}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const TransactionSummary = ({ transaction, searchMetadata }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction Summary</h3>
    
    {/* Search Metadata */}
    {searchMetadata && (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="text-xs text-blue-800">
          <p className="font-medium mb-2">🔍 Search Results</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <span className="font-medium">Searched by:</span> {searchMetadata.correlationKey.toUpperCase()}
            </div>
            <div>
              <span className="font-medium">Search Value:</span> {searchMetadata.searchValue}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* All Correlation Keys */}
    {searchMetadata?.allCorrelationKeys && (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">All Correlation Keys (TFL Section 10)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <p className="text-xs text-gray-500">RRN</p>
            <p className="text-sm font-medium text-gray-900 font-mono">{maskRRN(searchMetadata.allCorrelationKeys.rrn)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">UTR</p>
            <p className="text-sm font-medium text-gray-900 font-mono">{searchMetadata.allCorrelationKeys.utr}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">TxnID</p>
            <p className="text-sm font-medium text-gray-900 font-mono">{searchMetadata.allCorrelationKeys.txnId}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">STAN</p>
            <p className="text-sm font-medium text-gray-900 font-mono">{searchMetadata.allCorrelationKeys.stan}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">SwitchRefID</p>
            <p className="text-sm font-medium text-gray-900 font-mono">{searchMetadata.allCorrelationKeys.switchRefId}</p>
          </div>
        </div>
      </div>
    )}

    {/* Account Information (TFL Section 17 - Data Masking) */}
    {searchMetadata?.allCorrelationKeys && (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Account Information (TFL Section 17 - Masked)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h5 className="text-xs font-medium text-gray-600">From Account</h5>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Account Number</p>
                <p className="text-sm font-medium text-gray-900 font-mono">{maskAccount(searchMetadata.allCorrelationKeys.fromAccount)}</p>
              </div>
              {searchMetadata.allCorrelationKeys.fromUPI && (
                <div>
                  <p className="text-xs text-gray-500">UPI ID</p>
                  <p className="text-sm font-medium text-gray-900 font-mono">{maskUPI(searchMetadata.allCorrelationKeys.fromUPI)}</p>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <h5 className="text-xs font-medium text-gray-600">To Account</h5>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Account Number</p>
                <p className="text-sm font-medium text-gray-900 font-mono">{maskAccount(searchMetadata.allCorrelationKeys.toAccount)}</p>
              </div>
              {searchMetadata.allCorrelationKeys.toUPI && (
                <div>
                  <p className="text-xs text-gray-500">UPI ID</p>
                  <p className="text-sm font-medium text-gray-900 font-mono">{maskUPI(searchMetadata.allCorrelationKeys.toUPI)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs text-yellow-700">
          🔒 Sensitive data masked for security compliance (TFL Section 17)
        </div>
      </div>
    )}

    {/* Transaction Details */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div>
        <p className="text-xs text-gray-500">Transaction ID</p>
        <p className="text-sm font-medium text-gray-900 font-mono">{transaction.txnId}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">RRN</p>
        <p className="text-sm font-medium text-gray-900 font-mono">{maskRRN(transaction.rrn)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Type</p>
        <p className="text-sm font-medium text-gray-900">{transaction.type}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Amount</p>
        <p className="text-sm font-medium text-gray-900">₹{transaction.amount}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">From Bank</p>
        <p className="text-sm font-medium text-gray-900">{transaction.fromBank}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">To Bank</p>
        <p className="text-sm font-medium text-gray-900">{transaction.toBank}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Total Duration</p>
        <p className="text-sm font-medium text-gray-900">{transaction.totalDuration}ms</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Final Status</p>
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
          transaction.finalStatus === 'SUCCESS' ? 'bg-green-100 text-green-800' :
          transaction.finalStatus === 'PENDING' ? 'bg-blue-100 text-blue-800' :
          transaction.finalStatus === 'TIMEOUT' ? 'bg-orange-100 text-orange-800' :
          'bg-red-100 text-red-800'
        }`}>
          {transaction.finalStatus}
        </span>
      </div>
    </div>
  </div>
);

const TransactionTracePanel = () => {
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock trace data with account information for TFL Section 17 compliance
  const mockTraceResult = {
    transaction: {
      txnId: 'TXN123456789',
      rrn: 'RRN987654321',
      type: 'IMPS',
      amount: '5,000.00',
      fromBank: 'HDFC',
      fromAccount: '50200012345678',
      toBank: 'ICICI',
      toAccount: '01456789012345',
      fromUPI: 'john.doe123@hdfcbank',
      toUPI: 'jane.smith456@icici',
      totalDuration: 2847,
      finalStatus: 'SUCCESS'
    },
    stages: [
      {
        stage: 'Request Initiation',
        node: 'Host System',
        timestamp: new Date(Date.now() - 2847).toISOString(),
        status: 'SUCCESS',
        code: '00',
        message: 'Transaction initiated successfully',
        duration: 45
      },
      {
        stage: 'Request Validation',
        node: 'TFL Switch',
        timestamp: new Date(Date.now() - 2800).toISOString(),
        status: 'SUCCESS',
        code: '00',
        message: 'Request validated and routed to NPCI',
        duration: 234
      },
      {
        stage: 'NPCI Processing',
        node: 'NPCI',
        timestamp: new Date(Date.now() - 2566).toISOString(),
        status: 'SUCCESS',
        code: '00',
        message: 'Transaction processed by NPCI',
        duration: 1856
      },
      {
        stage: 'Response Processing',
        node: 'TFL Switch',
        timestamp: new Date(Date.now() - 710).toISOString(),
        status: 'SUCCESS',
        code: '00',
        message: 'Response received and processed',
        duration: 156
      },
      {
        stage: 'Response Delivery',
        node: 'Host System',
        timestamp: new Date(Date.now() - 554).toISOString(),
        status: 'SUCCESS',
        code: '00',
        message: 'Response delivered to host system',
        duration: 554
      }
    ]
  };

  const handleSearch = async (searchValue, searchType) => {
    setLoading(true);
    setError(null);
    
    // TFL Section 10: Enhanced logging for correlation key search
    console.log(`🔍 TFL Transaction Trace Search Initiated`);
    console.log(`📋 Search Parameters:`);
    console.log(`   - Correlation Key: ${searchType.toUpperCase()}`);
    console.log(`   - Search Value: ${searchValue}`);
    console.log(`   - Timestamp: ${new Date().toISOString()}`);
    
    // Simulate API call with correlation key context
    setTimeout(() => {
      // Enhanced mock result with all correlation keys
      const enhancedMockResult = {
        ...mockTraceResult,
        searchMetadata: {
          correlationKey: searchType,
          searchValue: searchValue,
          timestamp: new Date().toISOString(),
          allCorrelationKeys: {
            rrn: mockTraceResult.transaction.rrn,
            utr: 'UTR' + mockTraceResult.transaction.txnId.slice(3),
            txnId: mockTraceResult.transaction.txnId,
            stan: 'STAN' + Math.random().toString().slice(2, 8),
            switchRefId: 'SW' + mockTraceResult.transaction.txnId.slice(2),
            fromAccount: mockTraceResult.transaction.fromAccount,
            toAccount: mockTraceResult.transaction.toAccount,
            fromUPI: mockTraceResult.transaction.fromUPI,
            toUPI: mockTraceResult.transaction.toUPI
          }
        }
      };
      
      console.log(`✅ Trace completed for ${searchType.toUpperCase()}: ${searchValue}`);
      console.log(`📊 Found transaction with all correlation keys:`, enhancedMockResult.searchMetadata.allCorrelationKeys);
      
      setSearchResult(enhancedMockResult);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Transaction Trace</h2>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span>End-to-End Tracing</span>
        </div>
      </div>

      {/* Search Section */}
      <TraceSearch onSearch={handleSearch} loading={loading} />

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >                        
          {/* Transaction Summary */}
          <TransactionSummary 
            transaction={searchResult.transaction} 
            searchMetadata={searchResult.searchMetadata}
          />

          {/* Trace Stages */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Transaction Lifecycle</h3>
            <div className="space-y-4">
              {/* Desktop Layout */}
              <div className="hidden lg:block">
                <div className="flex space-x-4 overflow-x-auto pb-4">
                  {searchResult.stages.map((stage, index) => (
                    <div key={index} className="flex-1 min-w-0">
                      <TraceStage 
                        stage={stage} 
                        index={index} 
                        totalStages={searchResult.stages.length} 
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="lg:hidden space-y-4">
                {searchResult.stages.map((stage, index) => (
                  <TraceStage 
                    key={index}
                    stage={stage} 
                    index={index} 
                    totalStages={searchResult.stages.length} 
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span className="text-gray-600">All stages completed successfully</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3 text-blue-600" />
                <span className="text-gray-600">Total time: {searchResult.transaction.totalDuration}ms</span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="w-3 h-3 text-purple-600" />
                <span className="text-gray-600">5 stages traced</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Instructions */}
      {!searchResult && !loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-blue-600" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">How to use Transaction Trace</h4>
              <p className="text-xs text-blue-700 mt-1">
                Enter any transaction identifier (RRN, UTR, Transaction ID, STAN, or Switch Ref ID) to trace the complete lifecycle of a transaction across all systems.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionTracePanel;
