import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Activity, TrendingUp, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { grafanaService } from '../services/apiService';

const GrafanaEmbed = ({ dashboardId, title, variables = {}, height = 400 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const embedUrl = grafanaService.getEmbeddedDashboardUrl(dashboardId, variables);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.open(grafanaService.getDashboardUrls()[dashboardId], '_blank')}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Open in Grafana"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLoading(true)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="relative" style={{ height }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
            />
          </div>
        )}
        
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-red-800">Failed to load dashboard</p>
            </div>
          </div>
        ) : (
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            onLoad={() => setLoading(false)}
            onError={() => setError(true)}
            title={title}
          />
        )}
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, unit, change, trend, icon: Icon, color }) => {
  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

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
          </div>
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold text-gray-900">
          {value}
          {unit && <span className="text-lg font-normal ml-1">{unit}</span>}
        </div>
        
        {change && (
          <div className={`flex items-center space-x-1 ${getTrendColor(trend)}`}>
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">{change}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const GrafanaDashboard = () => {
  const [activeView, setActiveView] = useState('overview');
  const [timeRange, setTimeRange] = useState('1h');
  const [refreshInterval, setRefreshInterval] = useState('30s');

  const dashboards = {
    overview: { id: 'tfl-overview', title: 'TFL Overview Dashboard' },
    banl: { id: 'tfl-banl', title: 'BANL Performance Dashboard' },
    imps: { id: 'tfl-imps', title: 'IMPS Performance Dashboard' },
    upi: { id: 'tfl-upi', title: 'UPI Performance Dashboard' },
    npci: { id: 'tfl-npci', title: 'NPCI Connectivity Dashboard' },
    errors: { id: 'tfl-errors', title: 'Error Analysis Dashboard' }
  };

  const timeRanges = [
    { value: '15m', label: 'Last 15 minutes' },
    { value: '1h', label: 'Last 1 hour' },
    { value: '6h', label: 'Last 6 hours' },
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' }
  ];

  const refreshIntervals = [
    { value: '5s', label: '5 seconds' },
    { value: '30s', label: '30 seconds' },
    { value: '1m', label: '1 minute' },
    { value: '5m', label: '5 minutes' }
  ];

  const getVariables = () => ({
    from: `now-${timeRange}`,
    to: 'now',
    refresh: refreshInterval
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Grafana Analytics</h2>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Real-time Visualizations</span>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Dashboard Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dashboard</label>
            <select
              value={activeView}
              onChange={(e) => setActiveView(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.entries(dashboards).map(([key, dashboard]) => (
                <option key={key} value={key}>
                  {dashboard.title}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {timeRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Refresh</label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {refreshIntervals.map(interval => (
                <option key={interval.value} value={interval.value}>
                  {interval.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Requests"
          value="2.8M"
          change="+12.5%"
          trend="up"
          icon={Activity}
          color="bg-blue-600"
        />
        <MetricCard
          title="Success Rate"
          value="99.87"
          unit="%"
          change="+0.03%"
          trend="up"
          icon={TrendingUp}
          color="bg-green-600"
        />
        <MetricCard
          title="Avg Response"
          value="127"
          unit="ms"
          change="-8ms"
          trend="down"
          icon={Activity}
          color="bg-yellow-600"
        />
        <MetricCard
          title="Error Rate"
          value="0.13"
          unit="%"
          change="-0.05%"
          trend="down"
          icon={AlertTriangle}
          color="bg-red-600"
        />
      </div>

      {/* Main Grafana Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <GrafanaEmbed
            dashboardId={dashboards[activeView].id}
            title={dashboards[activeView].title}
            variables={getVariables()}
            height={500}
          />
        </div>
        
        {/* Additional Panels */}
        <GrafanaEmbed
          dashboardId={`${dashboards[activeView].id}-latency`}
          title="Latency Trends"
          variables={getVariables()}
          height={250}
        />
        
        <GrafanaEmbed
          dashboardId={`${dashboards[activeView].id}-errors`}
          title="Error Analysis"
          variables={getVariables()}
          height={250}
        />
      </div>

      {/* Quick Links */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Links</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {Object.entries(dashboards).map(([key, dashboard]) => (
            <button
              key={key}
              onClick={() => window.open(grafanaService.getDashboardUrls()[key], '_blank')}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{dashboard.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GrafanaDashboard;
