import React from 'react';
import { TrendingUp, Clock, AlertTriangle, Activity, Zap } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

const KPICard = ({ title, value, unit, threshold, icon: Icon, color }) => {
  const getThresholdColor = (value, threshold) => {
    if (threshold.type === 'min') {
      return value >= threshold.value ? 'text-green-600' : 'text-red-600';
    } else {
      return value <= threshold.value ? 'text-green-600' : 'text-red-600';
    }
  };

  const getThresholdBg = (value, threshold) => {
    if (threshold.type === 'min') {
      return value >= threshold.value ? 'bg-green-100' : 'bg-red-100';
    } else {
      return value <= threshold.value ? 'bg-green-100' : 'bg-red-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getThresholdBg(value, threshold)} ${getThresholdColor(value, threshold)}`}>
          {threshold.type === 'min' ? `≥${threshold.value}${unit}` : `≤${threshold.value}${unit}`}
        </div>
      </div>
      <div className="flex items-baseline space-x-1">
        <span className={`text-2xl font-bold ${getThresholdColor(value, threshold)}`}>
          {value}
        </span>
        <span className="text-sm text-gray-500">{unit}</span>
      </div>
    </div>
  );
};

const ExecutiveSummary = () => {
  const { kpis } = useDashboard();

  const kpiCards = [
    {
      title: 'Success Rate',
      value: kpis.successRate,
      unit: '%',
      threshold: { type: 'min', value: 99.5 },
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'Pending Transactions',
      value: kpis.pendingTxns,
      unit: '%',
      threshold: { type: 'max', value: 0.2 },
      icon: Clock,
      color: 'text-blue-600'
    },
    {
      title: 'Total Transactions',
      value: kpis.totalTransactions.toLocaleString(),
      unit: '',
      threshold: { type: 'none', value: 0 },
      icon: Activity,
      color: 'text-purple-600'
    },
    {
      title: 'Avg Response Time',
      value: kpis.avgResponseTime,
      unit: 's',
      threshold: { type: 'max', value: 1.0 },
      icon: Zap,
      color: 'text-yellow-600'
    },
    {
      title: 'Error Rate',
      value: kpis.errorRate,
      unit: '%',
      threshold: { type: 'max', value: 0.5 },
      icon: AlertTriangle,
      color: 'text-red-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Executive Summary</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live KPIs</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>
    </div>
  );
};

export default ExecutiveSummary;
