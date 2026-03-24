import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Copy, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import MaskedField from './MaskedField';
import { maskAccountNumber, maskUTR, maskCardNumber, maskMobile } from '../utils/dataMasking';

/**
 * TransactionTracePanel Component - TFL Section 9
 * 
 * Shows 6-stage vertical timeline for transaction tracing:
 * 1. Host Request
 * 2. TFL Switch Received  
 * 3. NPCI Sent
 * 4. NPCI Response
 * 5. Switch Processed
 * 6. Host Response
 */

const TransactionTracePanel = () => {
  const [searchTxnId, setSearchTxnId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [traceData, setTraceData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Mock transaction trace data generator
  const generateMockTraceData = (txnId) => {
    const baseTime = new Date(Date.now() - Math.random() * 3600000);
    const nodes = ['HDFC-CBS', 'TFL-SWITCH-01', 'NPCI-GATEWAY', 'NPCI-GATEWAY', 'TFL-SWITCH-01', 'HDFC-CBS'];
    const statuses = ['success', 'success', 'success', 'pending', 'success', 'success'];
    const httpCodes = [200, 200, 200, 202, 200, 200];
    const isoCodes = ['00', '00', '00', '91', '00', '00'];
    const messages = [
      'Transaction initiated successfully',
      'Request received and validated',
      'Forwarded to NPCI for processing',
      'Processing in progress',
      'Response received from NPCI',
      'Transaction completed successfully'
    ];
    
    const stages = [];
    let cumulativeTime = 0;
    
    for (let i = 0; i < 6; i++) {
      const duration = Math.floor(Math.random() * 500) + 50; // 50-550ms
      cumulativeTime += duration;
      
      stages.push({
        stageNumber: i + 1,
        stageName: [
          'Host Request',
          'TFL Switch Received',
          'NPCI Sent',
          'NPCI Response',
          'Switch Processed',
          'Host Response'
        ][i],
        timestamp: new Date(baseTime.getTime() + cumulativeTime),
        nodeName: nodes[i],
        status: statuses[i],
        httpCode: httpCodes[i],
        isoCode: isoCodes[i],
        message: messages[i],
        duration: duration
      });
    }

    return {
      txnId,
      accountNumber: '5020001234567890',
      utr: 'HDFC20241234567890',
      cardNumber: '4111111111111111',
      mobile: '9876543210',
      amount: (Math.random() * 10000 + 100).toFixed(2),
      currency: 'INR',
      stages
    };
  };

  const handleSearch = async () => {
    if (!searchTxnId.trim()) return;

    setIsLoading(true);
    setTraceData(null);

    // Show loading skeleton for 500ms
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate mock data (90% chance of success)
    if (Math.random() > 0.1) {
      setTraceData(generateMockTraceData(searchTxnId.trim()));
    } else {
      setTraceData(null);
    }

    setIsLoading(false);
  };

  const handleCopyTrace = async () => {
    if (!traceData) return;

    const traceJson = JSON.stringify(traceData, null, 2);
    await navigator.clipboard.writeText(traceJson);
    
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'var(--status-success)';
      case 'pending':
        return 'var(--status-pending)';
      case 'timeout':
        return 'var(--status-timeout)';
      case 'failure':
        return 'var(--status-failure)';
      default:
        return 'var(--status-pending)';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'timeout':
        return <AlertCircle className="w-4 h-4" />;
      case 'failure':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const formatDuration = (duration) => {
    return `${duration}ms`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const stageVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  const skeletonVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const skeletonItemVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        repeat: Infinity,
        repeatType: 'reverse',
        duration: 1.5
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <motion.div
        className="glass rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Transaction Trace</h2>
            <p className="text-sm text-gray-600 mt-1">TFL Section 9 - End-to-End Transaction Tracking</p>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTxnId}
              onChange={(e) => setSearchTxnId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter Transaction ID (TxnID)..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <motion.button
            onClick={handleSearch}
            disabled={!searchTxnId.trim() || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            whileHover={{ scale: searchTxnId.trim() && !isLoading ? 1.02 : 1 }}
            whileTap={{ scale: searchTxnId.trim() && !isLoading ? 0.98 : 1 }}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </motion.button>

          {traceData && (
            <motion.button
              onClick={handleCopyTrace}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Trace as JSON</span>
                </>
              )}
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          // Loading Skeleton
          <motion.div
            key="loading"
            className="glass rounded-lg p-6"
            variants={skeletonVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="flex items-start space-x-4"
                  variants={skeletonItemVariants}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-300"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : traceData ? (
          // Trace Results
          <motion.div
            key="results"
            className="glass rounded-lg p-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {/* Transaction Details Header */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Transaction ID:</span>
                  <div className="font-semibold">{traceData.txnId}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Amount:</span>
                  <div className="font-semibold">{traceData.currency} {traceData.amount}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Account:</span>
                  <MaskedField 
                    value={traceData.accountNumber} 
                    maskFn={maskAccountNumber} 
                  />
                </div>
                <div>
                  <span className="text-sm text-gray-600">UTR:</span>
                  <MaskedField 
                    value={traceData.utr} 
                    maskFn={maskUTR} 
                  />
                </div>
                <div>
                  <span className="text-sm text-gray-600">Card:</span>
                  <MaskedField 
                    value={traceData.cardNumber} 
                    maskFn={maskCardNumber} 
                  />
                </div>
                <div>
                  <span className="text-sm text-gray-600">Mobile:</span>
                  <MaskedField 
                    value={traceData.mobile} 
                    maskFn={maskMobile} 
                  />
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gray-300"></div>

              {/* Stages */}
              <div className="space-y-6">
                {traceData.stages.map((stage, index) => (
                  <motion.div
                    key={stage.stageNumber}
                    className="flex items-start space-x-4 relative"
                    variants={stageVariants}
                  >
                    {/* Stage Circle */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold relative z-10"
                      style={{ backgroundColor: getStatusColor(stage.status) }}
                    >
                      {stage.stageNumber}
                    </div>

                    {/* Stage Content */}
                    <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900">{stage.stageName}</h3>
                          <div className="text-sm text-gray-600">{formatTimestamp(stage.timestamp)}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div
                            className="flex items-center space-x-1"
                            style={{ color: getStatusColor(stage.status) }}
                          >
                            {getStatusIcon(stage.status)}
                            <span className="text-sm font-medium capitalize">{stage.status}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Node: </span>
                          <span className="font-medium">{stage.nodeName}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">HTTP: </span>
                          <span className="font-medium">{stage.httpCode}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">ISO: </span>
                          <span className="font-medium">{stage.isoCode}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Duration: </span>
                          <span className="font-medium">{formatDuration(stage.duration)}</span>
                        </div>
                      </div>

                      <div className="mt-2 text-sm">
                        <span className="text-gray-600">Message: </span>
                        <span className="text-gray-900">{stage.message}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : searchTxnId && !isLoading ? (
          // Not Found State
          <motion.div
            key="notfound"
            className="glass rounded-lg p-12 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit="hidden"
          >
            <div className="text-gray-400 mb-4">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Transaction Not Found</h3>
            <p className="text-gray-600">No transaction trace found for TxnID: {searchTxnId}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default TransactionTracePanel;
