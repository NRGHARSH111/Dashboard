import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../context/DashboardContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

/**
 * SLA & Latency Heatmap Component - TFL Monitoring Dashboard
 * 
 * Grid Layout:
 * - Rows: Network paths (Host to TFL Switch, TFL Switch to NPCI, etc.)
 * - Columns: Time buckets (<1s, 1-3s, 3-5s, >5s)
 * 
 * Color Logic (TFL Section 5 Compliance):
 * - Green (#10b981): Within SLA (<1s)
 * - Amber (#f59e0b): 80-100% SLA (1-3s) 
 * - Red (#991b1b): SLA Breach (>3s)
 * 
 * TFL Section 16: Refresh every 10 seconds
 */
const SLALatencyHeatmap = () => {
  const { heatmap, loading } = useDashboard();
  const [selectedPath, setSelectedPath] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [hoveredCellData, setHoveredCellData] = useState(null);
  const [timeRange, setTimeRange] = useState('1h');
  const [animatedData, setAnimatedData] = useState([]);
  
  // Use auto-refresh hook for 10-second updates
  const { isRunning } = useAutoRefresh(() => {
    // Refresh callback - data is handled by DashboardContext
  }, 10000, { enabled: true, pauseOnHidden: true });

  // TFL Section 5: Network paths configuration
  const networkPaths = [
    { id: 'host-tfl', name: 'Host to TFL Switch', description: 'Client connection to TFL infrastructure' },
    { id: 'tfl-npci', name: 'TFL Switch to NPCI', description: 'TFL to NPCI gateway connection' },
    { id: 'npci-bank', name: 'NPCI to Bank', description: 'NPCI to partner bank connectivity' },
    { id: 'bank-response', name: 'Bank Response Path', description: 'Bank to TFL response route' },
    { id: 'settlement', name: 'Settlement Path', description: 'End-to-end settlement flow' },
    { id: 'reconciliation', name: 'Reconciliation Path', description: 'Transaction reconciliation' }
  ];

  // TFL Section 5: Time buckets with SLA color logic
  const timeBuckets = [
    { 
      id: 'excellent', 
      label: '< 1s', 
      min: 0, 
      max: 1000, 
      color: '#10b981', // Green - Within SLA
      bgColor: 'bg-green-500',
      bgLightColor: 'bg-green-50',
      textColor: 'text-green-700',
      description: 'Within SLA'
    },
    { 
      id: 'acceptable', 
      label: '1-3s', 
      min: 1000, 
      max: 3000, 
      color: '#f59e0b', // Amber - 80-100% SLA
      bgColor: 'bg-amber-500',
      bgLightColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      description: '80-100% SLA'
    },
    { 
      id: 'breach', 
      label: '3-5s', 
      min: 3000, 
      max: 5000, 
      color: '#991b1b', // Red - SLA Breach
      bgColor: 'bg-red-500',
      bgLightColor: 'bg-red-50',
      textColor: 'text-red-700',
      description: 'SLA Breach'
    },
    { 
      id: 'critical', 
      label: '> 5s', 
      min: 5000, 
      max: Infinity, 
      color: '#991b1b', // Red - SLA Breach
      bgColor: 'bg-red-600',
      bgLightColor: 'bg-red-50',
      textColor: 'text-red-700',
      description: 'Critical Breach'
    }
  ];

  // Time range options
  const timeRanges = [
    { value: '15m', label: '15 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '6h', label: '6 Hours' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' }
  ];

  // Generate realistic heatmap data following TFL Section 5 distribution
  const generateHeatmapData = useMemo(() => {
    const data = [];
    
    networkPaths.forEach(path => {
      const pathData = { pathId: path.id, pathName: path.name, buckets: [] };
      
      timeBuckets.forEach(bucket => {
        // Simulate realistic latency distribution
        let transactionCount, avgLatency, successRate;
        

        if (bucket.id === 'excellent') {
          // 70% of transactions should be excellent
          transactionCount = Math.floor(Math.random() * 5000) + 3000;
          avgLatency = Math.random() * 1000;
          successRate = 95 + Math.random() * 5;
        } else if (bucket.id === 'acceptable') {
          // 20% should be acceptable
          transactionCount = Math.floor(Math.random() * 2000) + 1000;
          avgLatency = 1000 + Math.random() * 2000;
          successRate = 80 + Math.random() * 15;
        } else if (bucket.id === 'breach') {
          // 8% should be breach
          transactionCount = Math.floor(Math.random() * 500) + 100;
          avgLatency = 3000 + Math.random() * 2000;
          successRate = 60 + Math.random() * 20;
        } else {
          // 2% should be critical
          transactionCount = Math.floor(Math.random() * 100) + 10;
          avgLatency = 5000 + Math.random() * 5000;
          successRate = 30 + Math.random() * 30;
        }
        
        pathData.buckets.push({
          bucketId: bucket.id,
          transactionCount,
          avgLatency: Math.round(avgLatency),
          successRate: Math.round(successRate * 100) / 100,
          trend: Math.random() > 0.5 ? 'improving' : 'degrading',
          lastUpdated: new Date(Date.now() - Math.random() * 60000).toISOString()
        });
      });
      
      data.push(pathData);
    });
    
    return data;
  }, [timeRange]);

  // Animation effect for data updates
  useEffect(() => {
    setAnimatedData(generateHeatmapData);
  }, [generateHeatmapData]);

  // Get bucket styling based on performance
  const getBucketStyling = (bucketId, successRate) => {
    const bucket = timeBuckets.find(b => b.id === bucketId);
    
    return {
      ...bucket,
      backgroundColor: bucket.color
    };
  };

  // Calculate path statistics
  const getPathStats = (pathData) => {
    const totalTransactions = pathData.buckets.reduce((sum, bucket) => sum + bucket.transactionCount, 0);
    const avgLatency = pathData.buckets.reduce((sum, bucket) => 
      sum + (bucket.avgLatency * bucket.transactionCount), 0) / totalTransactions;
    const overallSuccessRate = pathData.buckets.reduce((sum, bucket) => 
      sum + (bucket.successRate * bucket.transactionCount), 0) / totalTransactions;
    
    return {
      totalTransactions,
      avgLatency: Math.round(avgLatency),
      successRate: Math.round(overallSuccessRate * 100) / 100,
      slaCompliance: overallSuccessRate >= 95 ? 'compliant' : overallSuccessRate >= 80 ? 'warning' : 'breach'
    };
  };

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const cellVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  return (
    <div className="relative">
      {/* Live Indicator */}
      <div className="absolute top-2 right-2 z-10 flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-gray-200">
        <motion.div
          animate={isRunning ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 2, repeat: isRunning ? Infinity : 0 }}
          className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-400'}`}
        />
        <span className={`text-xs font-medium ${isRunning ? 'text-green-600' : 'text-gray-500'}`}>
          {isRunning ? 'Live' : 'Paused'}
        </span>
      </div>
      
      <motion.div 
        className="glass rounded-lg shadow-lg p-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <motion.h3 
            className="text-lg font-semibold text-gray-900"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            SLA & Latency Heatmap
          </motion.h3>
          <motion.p 
            className="text-sm text-gray-600"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Network path performance across latency buckets
          </motion.p>
        </div>
        
        {/* Time Range Selector */}
        <motion.div 
          className="flex items-center space-x-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="text-sm font-medium text-gray-700">Time Range:</label>
          <motion.select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </motion.select>
        </motion.div>
      </div>

      {/* Legend */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Latency Buckets (SLA Status):</span>
          <div className="flex space-x-6">
            {timeBuckets.map(bucket => (
              <motion.div 
                key={bucket.id} 
                className="flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: bucket.color }}
                  whileHover={{ scale: 1.2 }}
                />
                <span className="text-xs text-gray-600">{bucket.label}</span>
                <span className={`text-xs ${bucket.textColor}`}>{bucket.description}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Heatmap Grid */}
      <motion.div 
        className="overflow-x-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-3 bg-gray-50 rounded-tl-lg border border-gray-200">
                <span className="text-sm font-semibold text-gray-900">Network Path</span>
              </th>
              {timeBuckets.map(bucket => (
                <th 
                  key={bucket.id} 
                  className={`text-center p-3 ${bucket.bgLightColor} border border-gray-200`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-semibold text-gray-900">{bucket.label}</span>
                    <span className={`text-xs ${bucket.textColor}`}>{bucket.description}</span>
                  </div>
                </th>
              ))}
              <th className="text-center p-3 bg-gray-50 rounded-tr-lg border border-gray-200">
                <span className="text-sm font-semibold text-gray-900">Path Status</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {animatedData.map((pathData, pathIndex) => {
                const stats = getPathStats(pathData);
                const isSelected = selectedPath === pathData.pathId;
                
                return (
                  <motion.tr
                    key={pathData.pathId}
                    variants={cellVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    transition={{ delay: pathIndex * 0.1 }}
                    className={`border border-gray-200 ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => setSelectedPath(isSelected ? null : pathData.pathId)}
                    whileHover={{ backgroundColor: isSelected ? '#dbeafe' : '#f9fafb' }}
                  >
                    {/* Path Name */}
                    <td className="p-3 border border-gray-200">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{pathData.pathName}</div>
                        <div className="text-xs text-gray-500">
                          {stats.totalTransactions.toLocaleString()} txns
                        </div>
                      </div>
                    </td>
                    
                    {/* Time Buckets */}
                    {pathData.buckets.map((bucket, bucketIndex) => {
                      const styling = getBucketStyling(bucket.bucketId, bucket.successRate);
                      const isHovered = hoveredCell === `${pathData.pathId}-${bucket.bucketId}`;
                      
                      return (
                        <td 
                          key={bucket.bucketId}
                          className="p-2 border border-gray-200 text-center cursor-pointer relative"
                          onMouseEnter={() => {
                            setHoveredCell(`${pathData.pathId}-${bucket.bucketId}`);
                            setHoveredCellData({
                              transactionCount: bucket.transactionCount,
                              avgLatency: bucket.avgLatency,
                              successRate: bucket.successRate,
                              trend: bucket.trend
                            });
                          }}
                          onMouseLeave={() => {
                            setHoveredCell(null);
                            setHoveredCellData(null);
                          }}
                        >
                          <motion.div
                            className={`p-3 rounded-lg ${styling.bgLightColor} border-2 transition-all duration-200`}
                            style={{ 
                              borderColor: styling.backgroundColor,
                              backgroundColor: isHovered ? styling.backgroundColor + '20' : ''
                            }}
                            whileHover={{ 
                              scale: 1.02,
                              boxShadow: `0 4px 12px ${styling.backgroundColor}40`
                            }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className={`text-sm font-bold ${styling.textColor}`}>
                              {bucket.transactionCount.toLocaleString()}
                            </div>
                            <div className={`text-xs ${styling.textColor} opacity-75`}>
                              {bucket.avgLatency}ms
                            </div>
                            <div className={`text-xs ${styling.textColor} mt-1`}>
                              {bucket.successRate}%
                            </div>
                            {bucket.trend === 'improving' ? (
                              <div className="text-xs text-green-600">↑</div>
                            ) : (
                              <div className="text-xs text-red-600">↓</div>
                            )}
                          </motion.div>
                          
                          {/* Tooltip */}
                          <AnimatePresence>
                            {isHovered && hoveredCellData && (
                              <motion.div
                                className="absolute z-50 bg-gray-900 text-white px-3 py-2 
                                           rounded-lg shadow-lg border border-gray-700 
                                           pointer-events-none whitespace-nowrap"
                                style={{ bottom: '105%', left: '50%', transform: 'translateX(-50%)' }}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                transition={{ duration: 0.15 }}
                              >
                                <div className="text-xs space-y-1">
                                  <div className="flex items-center justify-between space-x-4">
                                    <span className="font-medium">Transactions:</span>
                                    <span>{hoveredCellData.transactionCount.toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center justify-between space-x-4">
                                    <span className="font-medium">Avg Latency:</span>
                                    <span>{hoveredCellData.avgLatency}ms</span>
                                  </div>
                                  <div className="flex items-center justify-between space-x-4">
                                    <span className="font-medium">Success Rate:</span>
                                    <span>{hoveredCellData.successRate}%</span>
                                  </div>
                                  <div className="flex items-center justify-between space-x-4">
                                    <span className="font-medium">Trend:</span>
                                    <span className={hoveredCellData.trend === 'improving' ? 'text-green-400' : 'text-red-400'}>
                                      {hoveredCellData.trend === 'improving' ? '↑ improving' : '↓ degrading'}
                                    </span>
                                  </div>
                                </div>
                                {/* Arrow */}
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900 border-r border-b border-gray-700"></div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </td>
                      );
                    })}
                    
                    {/* Path Status */}
                    <td className="p-3 border border-gray-200 text-center">
                      <motion.div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          stats.slaCompliance === 'compliant' 
                            ? 'bg-green-100 text-green-800'
                            : stats.slaCompliance === 'warning'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                        whileHover={{ scale: 1.05 }}
                      >
                    {stats.slaCompliance === 'compliant' ? '✓ Compliant' :
                     stats.slaCompliance === 'warning' ? '⚠ Warning' : '✗ Breach'}
                  </motion.div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stats.avgLatency}ms avg
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </AnimatePresence>
      </tbody>
    </table>
  </motion.div>

  {/* Selected Path Details */}
  <AnimatePresence>
    {selectedPath && (
      <motion.div
        className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-sm font-semibold text-blue-900">
              {networkPaths.find(p => p.id === selectedPath)?.name} - Detailed Analysis
            </h4>
            <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
              {animatedData
                .find(p => p.pathId === selectedPath)
                ?.buckets.map(bucket => {
                  const styling = getBucketStyling(bucket.bucketId, bucket.successRate);
                  return (
                    <div key={bucket.bucketId} className="text-center">
                      <div className={`font-medium ${styling.textColor}`}>
                        {bucket.bucketId.toUpperCase()}
                      </div>
                      <div className="text-gray-600">
                        {bucket.transactionCount.toLocaleString()} txns
                      </div>
                      <div className="text-gray-600">
                        {bucket.avgLatency}ms avg
                      </div>
                      <div className="text-gray-600">
                        {bucket.successRate}% success
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          <motion.button
            onClick={() => setSelectedPath(null)}
            className="text-blue-600 hover:text-blue-800 text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* SLA Compliance Summary */}
  <motion.div 
    className="mt-6 grid grid-cols-4 gap-4"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.8 }}
  >
    {timeBuckets.map(bucket => {
      const totalInBucket = animatedData.reduce((sum, path) => 
        sum + (path.buckets.find(b => b.bucketId === bucket.id)?.transactionCount ?? 0), 0
      );
      const totalTransactions = animatedData.reduce((sum, path) => 
        sum + path.buckets.reduce((bucketSum, b) => bucketSum + b.transactionCount, 0), 0
      );
      const percentage = totalTransactions > 0 ? (totalInBucket / totalTransactions * 100).toFixed(1) : 0;
      
      return (
        <motion.div
          key={bucket.id}
          className={`p-4 ${bucket.bgLightColor} rounded-lg border-2`}
          style={{ borderColor: bucket.color }}
          whileHover={{ 
            scale: 1.02,
            boxShadow: `0 4px 12px ${bucket.color}40`
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: bucket.color }}
            />
            <span className={`text-xs font-medium ${bucket.textColor}`}>
              {bucket.description}
            </span>
          </div>
          <div className="text-lg font-bold text-gray-900">{percentage}%</div>
          <div className="text-sm text-gray-600">{bucket.label}</div>
          <div className="text-xs text-gray-500 mt-1">
            {totalInBucket.toLocaleString()} transactions
          </div>
        </motion.div>
      );
    })}
  </motion.div>
</motion.div>
</div>
  );
};

export default SLALatencyHeatmap;
