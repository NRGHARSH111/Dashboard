import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, TrendingUp, TrendingDown, Activity, Clock, AlertTriangle } from 'lucide-react';

const BankSelector = ({ banks, selectedBank, onBankChange }) => (
  <div className="flex items-center space-x-4 mb-6">
    <label className="text-sm font-medium text-gray-700">Select Bank:</label>
    <select
      value={selectedBank}
      onChange={(e) => onBankChange(e.target.value)}
      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
    >
      <option value="all">All Banks</option>
      {banks.map((bank) => (
        <option key={bank.id} value={bank.id}>
          {bank.name} ({bank.code})
        </option>
      ))}
    </select>
  </div>
);

const BankMetricCard = ({ title, value, unit, change, trend, icon: Icon, color, threshold }) => {
  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getThresholdStatus = (value, threshold) => {
    if (!threshold) return 'OK';
    if (threshold.type === 'min') {
      return value >= threshold.value ? 'OK' : 'ALERT';
    } else {
      return value <= threshold.value ? 'OK' : 'ALERT';
    }
  };

  const thresholdStatus = getThresholdStatus(value, threshold);

  return (
    <motion.div 
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-5 h-5 text-white" />      
            

          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
            {threshold && (
              <p className="text-xs text-gray-500">
                Target: {threshold.type === 'min' ? '≥' : '≤'} {threshold.value}{threshold.unit || ''}
              </p>
            )}
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          thresholdStatus === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {thresholdStatus}
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold text-gray-900">
          {value}
          {unit && <span className="text-lg font-normal ml-1">{unit}</span>}
        </div>
        
        {change && (
          <div className={`flex items-center space-x-1 ${getTrendColor(trend)}`}>
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4" />
            ) : trend === 'down' ? (
              <TrendingDown className="w-4 h-4" />
            ) : null}
            <span className="text-sm font-medium">{change}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const SwitchPerformanceTable = ({ data }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-gray-700 font-medium">Switch</th>
            <th className="px-4 py-3 text-left text-gray-700 font-medium">Success %</th>
            <th className="px-4 py-3 text-left text-gray-700 font-medium">Fail %</th>
            <th className="px-4 py-3 text-left text-gray-700 font-medium">Pending</th>
            <th className="px-4 py-3 text-left text-gray-700 font-medium">Avg Latency</th>
            <th className="px-4 py-3 text-left text-gray-700 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row, index) => (
            <motion.tr 
              key={row.switch}
              className="hover:bg-gray-50 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <td className="px-4 py-3 font-medium text-gray-900">{row.switch}</td>
              <td className="px-4 py-3">
                <span className={`font-medium ${
                  row.successPercent >= 99.5 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {row.successPercent}%
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`font-medium ${
                  row.failPercent <= 0.5 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {row.failPercent}%
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="font-medium text-gray-900">{row.pending}</span>
              </td>
              <td className="px-4 py-3">
                <span className={`font-medium ${
                  row.avgLatency <= 200 ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {row.avgLatency}ms
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  row.status === 'HEALTHY' ? 'bg-green-100 text-green-800' :
                  row.status === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {row.status}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const BankTenantView = () => {
  const [selectedBank, setSelectedBank] = useState('all');

  // Mock bank data
  const banks = [
    { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC' },
    { id: 'icici', name: 'ICICI Bank', code: 'ICICI' },
    { id: 'sbi', name: 'State Bank of India', code: 'SBI' },
    { id: 'pnb', name: 'Punjab National Bank', code: 'PNB' },
    { id: 'boi', name: 'Bank of India', code: 'BOI' },
    { id: 'citi', name: 'Citibank', code: 'CITI' },
    { id: 'axis', name: 'Axis Bank', code: 'AXIS' },
    { id: 'kotak', name: 'Kotak Mahindra', code: 'KOTAK' }
  ];

  // Mock metrics data
  const getBankMetrics = (bankId) => {
    if (bankId === 'all') {
      return {
        totalTxns: { value: '2.8M', change: '+12.5%', trend: 'up' },
        successRate: { value: 99.87, change: '+0.03%', trend: 'up', threshold: { type: 'min', value: 99.5, unit: '%' } },
        avgLatency: { value: 127, change: '-8ms', trend: 'down', unit: 'ms' },
        pendingTxns: { value: 0.08, change: '-0.02%', trend: 'down', unit: '%', threshold: { type: 'max', value: 0.2, unit: '%' } },
        errorRate: { value: 0.13, change: '-0.05%', trend: 'down', unit: '%' }
      };
    }
    
    // Bank-specific data would vary
    return {
      totalTxns: { value: '347K', change: '+8.2%', trend: 'up' },
      successRate: { value: 99.92, change: '+0.01%', trend: 'up', threshold: { type: 'min', value: 99.5, unit: '%' } },
      avgLatency: { value: 118, change: '-12ms', trend: 'down', unit: 'ms' },
      pendingTxns: { value: 0.06, change: '-0.03%', trend: 'down', unit: '%', threshold: { type: 'max', value: 0.2, unit: '%' } },
      errorRate: { value: 0.08, change: '-0.02%', trend: 'down', unit: '%' }
    };
  };

  const getSwitchPerformance = (bankId) => {
    const baseData = [
      { switch: 'BANL', successPercent: 99.85, failPercent: 0.15, pending: 23, avgLatency: 145, status: 'HEALTHY' },
      { switch: 'IMPS', successPercent: 99.91, failPercent: 0.09, pending: 18, avgLatency: 98, status: 'HEALTHY' },
      { switch: 'UPI', successPercent: 99.88, failPercent: 0.12, pending: 31, avgLatency: 112, status: 'HEALTHY' }
    ];

    if (bankId === 'all') {
      return baseData;
    }

    // Bank-specific variations
    return baseData.map(row => ({
      ...row,
      successPercent: row.successPercent + (Math.random() - 0.5) * 0.2,
      avgLatency: row.avgLatency + Math.floor((Math.random() - 0.5) * 20),
      pending: Math.max(0, row.pending + Math.floor((Math.random() - 0.5) * 10))
    }));
  };

  const metrics = getBankMetrics(selectedBank);
  const switchData = getSwitchPerformance(selectedBank);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Bank-wise Tenant View</h2>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Multi-Bank Dashboard</span>
        </div>
      </div>

      {/* Bank Selector */}
      <BankSelector 
        banks={banks} 
        selectedBank={selectedBank} 
        onBankChange={setSelectedBank}
      />

      {/* Bank Metrics */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800">
          {selectedBank === 'all' ? 'All Banks' : banks.find(b => b.id === selectedBank)?.name} - Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <BankMetricCard
            title="Total Transactions"
            value={metrics.totalTxns.value}
            change={metrics.totalTxns.change}
            trend={metrics.totalTxns.trend}
            icon={Activity}
            color="bg-blue-600"
          />
          <BankMetricCard
            title="Success Rate"
            value={metrics.successRate.value}
            unit="%"
            change={metrics.successRate.change}
            trend={metrics.successRate.trend}
            icon={TrendingUp}
            color="bg-green-600"
            threshold={metrics.successRate.threshold}
          />
          <BankMetricCard
            title="Avg Latency"
            value={metrics.avgLatency.value}
            unit={metrics.avgLatency.unit}
            change={metrics.avgLatency.change}
            trend={metrics.avgLatency.trend}
            icon={Clock}
            color="bg-yellow-600"
          />
          <BankMetricCard
            title="Pending Txns"
            value={metrics.pendingTxns.value}
            unit={metrics.pendingTxns.unit}
            change={metrics.pendingTxns.change}
            trend={metrics.pendingTxns.trend}
            icon={AlertTriangle}
            color="bg-orange-600"
            threshold={metrics.pendingTxns.threshold}
          />
          <BankMetricCard
            title="Error Rate"
            value={metrics.errorRate.value}
            unit={metrics.errorRate.unit}
            change={metrics.errorRate.change}
            trend={metrics.errorRate.trend}
            icon={AlertTriangle}
            color="bg-red-600"
          />
        </div>
      </div>

      {/* Switch Performance Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800">Switch Performance Breakdown</h3>
        <SwitchPerformanceTable data={switchData} />
      </div>

      {/* Bank Summary */}
      {selectedBank !== 'all' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Bank Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">All switches performing within SLA</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Real-time monitoring active</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-600">Last updated: 2 seconds ago</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankTenantView;
