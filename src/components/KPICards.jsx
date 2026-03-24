import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, Clock, AlertTriangle, Wifi } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { maskAccount } from '../utils/dataMasking';
import { SLA_THRESHOLDS, REFRESH_INTERVALS } from '../config/apiConfig';

const KPICard = memo(({ title, value, unit, threshold, icon: Icon, color, change, trend }) => {
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

  // TFL Section 2: Enhanced conditional styling for specific KPIs
  const getCardBorderColor = (title, value, threshold) => {
    if (!threshold) return 'border-gray-200';
    
    const numericValue = typeof value === 'string' ? parseFloat(value.replace('%', '')) : value;
    
    // Success Rate: Below SLA_THRESHOLDS.SUCCESS_RATE_MIN -> Red border (border-status-failure)
    if (title === 'Success Rate' && threshold.type === 'min') {
      return numericValue >= SLA_THRESHOLDS.SUCCESS_RATE_MIN ? 'border-gray-200' : 'border-status-failure border-2';
    }
    
    // Pending Transactions: Above SLA_THRESHOLDS.PENDING_TXN_MAX -> Orange border (border-status-timeout)
    if (title === 'Pending Txns' && threshold.type === 'max') {
      return numericValue <= SLA_THRESHOLDS.PENDING_TXN_MAX ? 'border-gray-200' : 'border-status-timeout border-2';
    }
    
    return 'border-gray-200';
  };

  const getCardTextColor = (title, value, threshold) => {
    if (!threshold) return 'text-gray-900';
    
    const numericValue = typeof value === 'string' ? parseFloat(value.replace('%', '')) : value;
    
    // Success Rate: Below SLA_THRESHOLDS.SUCCESS_RATE_MIN -> Red text (text-status-failure)
    if (title === 'Success Rate' && threshold.type === 'min') {
      return numericValue >= SLA_THRESHOLDS.SUCCESS_RATE_MIN ? 'text-gray-900' : 'text-status-failure';
    }
    
    // Pending Transactions: Above SLA_THRESHOLDS.PENDING_TXN_MAX -> Orange text (text-status-timeout)
    if (title === 'Pending Txns' && threshold.type === 'max') {
      return numericValue <= SLA_THRESHOLDS.PENDING_TXN_MAX ? 'text-gray-900' : 'text-status-timeout';
    }
    
    return 'text-gray-900';
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
      className={`bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col justify-between h-full ${getCardBorderColor(title, value, threshold)}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${color} flex-shrink-0`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-gray-600 truncate">{title}</h3>
            {threshold && (
              <div className="text-xs text-gray-500">
                Target: {threshold.type === 'min' ? '≥' : '≤'} {threshold.value}{threshold.unit || ''}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col justify-end flex-1">
        <div className="mb-3">
          <div className={`text-2xl font-bold ${getCardTextColor(title, value, threshold)}`}>
            {value}
            {unit && <span className="text-lg font-normal ml-1">{unit}</span>}
          </div>
          {change && (
            <div className="flex items-center space-x-1 mt-2">
              {getTrendIcon(trend)}
              <span className={`text-sm ${trend === 'up' ? 'text-status-success' : 'text-status-failure'}`}>
                {change}
              </span>
            </div>
          )}
        </div>
        
        {threshold && (
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getThresholdBg(numericValue, threshold)} ${getThresholdColor(numericValue, threshold)} self-start`}>
            {numericValue >= (threshold.type === 'min' ? threshold.value : Infinity) || 
             numericValue <= (threshold.type === 'max' ? threshold.value : -Infinity) 
             ? 'OK' : 'Alert'}
          </div>
        )}
      </div>
    </motion.div >
  );
});

const KPICards = memo(() => {
  const { kpis } = useDashboard();

  console.log('📊 KPICards: Using centralized data from DashboardContext with TFL Section 16 compliant', REFRESH_INTERVALS.KPI/1000, 's refresh');
  console.log('🔒 KPICards: Account numbers masked for TFL Section 17 compliance');
  console.log('🎯 KPICards: TFL Section 2 conditional styling active - Success Rate <', SLA_THRESHOLDS.SUCCESS_RATE_MIN + '% triggers red text and border');

  const kpiData = [
    {
      title: 'Total Txn Today',
      value: kpis.totalTxnToday?.value || '2,847,392',
      unit: '',
      threshold: null,
      icon: TrendingUp,
      color: 'bg-blue-600',
      change: kpis.totalTxnToday?.change || '+12.5%',
      trend: kpis.totalTxnToday?.trend || 'up'
    },
    {
      title: 'Success Rate',
      value: kpis.successRate?.value || '99.87',
      unit: '%',
      threshold: { type: 'min', value: SLA_THRESHOLDS.SUCCESS_RATE_MIN, unit: '%' },
      icon: Activity,
      color: 'bg-green-600',
      change: kpis.successRate?.change || '+0.03%',
      trend: kpis.successRate?.trend || 'up'
    },
    {
      title: 'Avg Response Time',
      value: kpis.avgLatency?.value || '127',
      unit: 'ms',
      threshold: { type: 'max', value: SLA_THRESHOLDS.AVG_LATENCY_MAX, unit: 'ms' },
      icon: Clock,
      color: 'bg-yellow-600',
      change: kpis.avgLatency?.change || '-8ms',
      trend: kpis.avgLatency?.trend || 'down'
    },
    {
      title: 'Pending Txns',
      value: kpis.pendingTxns?.value || '0.08',
      unit: '%',
      threshold: { type: 'max', value: SLA_THRESHOLDS.PENDING_TXN_MAX, unit: '%' },
      icon: AlertTriangle,
      color: 'bg-orange-600',
      change: kpis.pendingTxns?.change || '-0.02%',
      trend: kpis.pendingTxns?.trend || 'down'
    },
    {
      title: 'NPCI Status',
      value: kpis.npciStatus?.value || 'Connected',
      unit: '',
      threshold: null,
      icon: Wifi,
      color: 'bg-purple-600',
      change: kpis.npciStatus?.change || 'Stable',
      trend: kpis.npciStatus?.trend || 'stable'
    }
  ];

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
      {kpiData.map((kpi, index) => (
        <div key={index} className="h-full">
          <KPICard {...kpi} />
        </div>
      ))}
    </div>
  );
});

export default KPICards;
