/**
 * Updated KPI Cards Component using new API service
 * Demonstrates proper error handling and loading states
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, Clock, AlertTriangle, Wifi } from 'lucide-react';
import { useApiCall } from '../hooks/useApiCall';
import { apiService } from '../services/apiClient';
import { LoadingSpinner, LoadingCard } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';

const KPICard = ({ title, value, unit, threshold, icon: Icon, color, change, trend, source }) => {
  const getThresholdColor = (value, threshold) => {
    if (!threshold) return 'text-gray-600';
    
    if (threshold.type === 'min') {
      return value >= threshold.value ? 'text-status-success' : 'text-status-failure';
    } else {
      return value <= threshold.value ? 'text-status-success' : 'text-status-failure';
    }
  };

  const getThresholdBg = (value, threshold) => {
    if (!threshold) return 'bg-gray-100';
    
    if (threshold.type === 'min') {
      return value >= threshold.value ? 'bg-green-50' : 'bg-red-50';
    } else {
      return value <= threshold.value ? 'bg-green-50' : 'bg-red-50';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-status-success" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-status-failure rotate-180" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  const numericValue = typeof value === 'string' ? parseFloat(value.replace('%', '')) : value;

  return (
    <motion.div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Data source indicator */}
      {source && (
        <div className="absolute top-2 right-2">
          <span className={`text-xs px-2 py-1 rounded-full ${
            source === 'mock' ? 'bg-yellow-100 text-yellow-700' :
            source === 'cache' ? 'bg-blue-100 text-blue-700' :
            source === 'fallback' ? 'bg-orange-100 text-orange-700' :
            'bg-green-100 text-green-700'
          }`}>
            {source}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            <p className="text-xs text-gray-500">Live</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className={`flex items-baseline justify-between p-3 rounded-lg ${getThresholdBg(numericValue, threshold)}`}>
          <div>
            <span className={`text-2xl font-bold ${getThresholdColor(numericValue, threshold)}`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {unit && <span className="ml-1 text-sm text-gray-600">{unit}</span>}
          </div>
          
          {change !== undefined && (
            <div className="flex items-center space-x-1">
              {getTrendIcon(trend)}
              <span className={`text-sm font-medium ${
                trend === 'up' ? 'text-status-success' : 
                trend === 'down' ? 'text-status-failure' : 
                'text-gray-600'
              }`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
          )}
        </div>

        {threshold && (
          <div className="text-xs text-gray-500">
            Threshold: {threshold.value}{threshold.unit || ''}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const KPICards = () => {
  // Use the new API service with proper error handling
  const {
    data: kpiData,
    loading,
    error,
    source,
    refetch
  } = useApiCall(
    () => apiService.kpi.getMetrics(),
    {
      immediate: true,
      retryCount: 2,
      onSuccess: (result) => {
        console.log('KPI data loaded from:', result.source);
      },
      onError: (error) => {
        console.error('Failed to load KPI data:', error);
      }
    }
  );

  // Real-time KPI updates
  const {
    data: realtimeData,
    loading: realtimeLoading
  } = useApiCall(
    () => apiService.kpi.getRealtime(),
    {
      immediate: true,
      // Poll every 10 seconds for real-time data
      dependencies: [],
      // Don't retry real-time data automatically
      retryCount: 0
    }
  );

  if (loading && !kpiData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <LoadingCard key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 gap-4">
        <ErrorDisplay
          error={error}
          onRetry={refetch}
          showDetails={import.meta.env.DEV}
        />
      </div>
    );
  }

  if (!kpiData) {
    return (
      <div className="text-center py-8 text-gray-500">
        No KPI data available      
      </div>                                     
    );
  }

  const kpiCards = [
    {                                                   
      title: 'Total Transactions',
      value: kpiData.totalTxnToday?.value || 0,
      unit: '',
      icon: Activity,
      color: 'bg-blue-500',
      change: kpiData.totalTxnToday?.change,
      trend: kpiData.totalTxnToday?.trend,
      threshold: { type: 'min', value: 1000000, unit: 'txns' }
    },

    {
      title: 'Success Rate',                                           
      value: kpiData.successRate?.value || 0,
      unit: '%',
      icon: TrendingUp,
      color: 'bg-green-500',
      change: kpiData.successRate?.change,
      trend: kpiData.successRate?.trend,
      threshold: { type: 'min', value: 99, unit: '%' }
    },
    {
      title: 'Avg Latency',
      value: kpiData.avgLatency?.value || 0,
      unit: 'ms',
      icon: Clock,
      color: 'bg-yellow-500',
      change: kpiData.avgLatency?.change,
      trend: kpiData.avgLatency?.trend,
      threshold: { type: 'max', value: 200, unit: 'ms' }
    },
    {
      title: 'Pending Txns',
      value: kpiData.pendingTxns?.value || 0,
      unit: '%',
      icon: AlertTriangle,
      color: 'bg-orange-500',
      change: kpiData.pendingTxns?.change,
      trend: kpiData.pendingTxns?.trend,
      threshold: { type: 'max', value: 0.1, unit: '%' }
    },
    {
      title: 'NPCI Status',
      value: kpiData.npciStatus?.value || 'Unknown',
      unit: '',
      icon: Wifi,
      color: kpiData.npciStatus?.value === 'Connected' ? 'bg-green-500' : 'bg-red-500',
      change: kpiData.npciStatus?.change,
      trend: kpiData.npciStatus?.trend,
      threshold: null
    }
  ];

  return (
    <div className="space-y-4">
      {/* Real-time metrics bar */}
      {realtimeData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900">Real-time:</span>
              <div className="flex gap-4 text-sm">
                <span>TPS: <strong>{realtimeData.metrics?.currentTPS || 0}</strong></span>
                <span>Peak: <strong>{realtimeData.metrics?.peakTPS || 0}</strong></span>
                <span>Connections: <strong>{realtimeData.metrics?.activeConnections || 0}</strong></span>
              </div>
            </div>
            {realtimeLoading && <LoadingSpinner size="sm" showText={false} />}
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((card, index) => (
          <KPICard
            key={index}
            {...card}
            source={source}
          />
        ))}
      </div>

      {/* Data source info */}
      {source && source !== 'api' && (
        <div className="text-xs text-gray-500 text-center">
          Data source: {source} {source === 'mock' && '(Backend unavailable - using mock data)'}
        </div>
      )}
    </div>
  );
};

export default KPICards;
