import React from 'react';
import { useDashboard } from '../context/DashboardContext';

const HeatmapCell = ({ latency, status, rowLabel, colLabel }) => {
  const getLatencyColor = (latency, status) => {
    if (status === 'error') return 'bg-red-500';
    if (status === 'warning') return 'bg-yellow-500';
    if (latency < 1) return 'bg-green-500';
    if (latency < 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getLatencyTextColor = (latency, status) => {
    if (status === 'error') return 'text-red-700';
    if (status === 'warning') return 'text-yellow-700';
    if (latency < 1) return 'text-green-700';
    if (latency < 3) return 'text-yellow-700';
    return 'text-red-700';
  };

  return (
    <div className="relative group">
      <div 
        className={`w-full h-16 ${getLatencyColor(latency, status)} rounded-md flex items-center justify-center text-white font-medium text-sm transition-all hover:scale-105 cursor-pointer`}
      >
        {latency.toFixed(2)}s
      </div>
      
      <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-xs rounded-lg p-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        <div className="font-medium">{rowLabel} → {colLabel}</div>
        <div>Latency: {latency.toFixed(3)}s</div>
        <div>Status: {status}</div>
        <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
      </div>
    </div>
  );
};

const LatencyHeatmap = () => {
  const { heatmap } = useDashboard();

  const rowLabels = ['BANL', 'IMPS', 'UPI', 'NPCI Link'];
  const colLabels = ['Host → TFL', 'TFL → NPCI', 'NPCI → TFL', 'TFL → Host'];

  const getOverallStats = () => {
    const flatData = heatmap.flat();
    const avgLatency = flatData.reduce((sum, cell) => sum + cell.latency, 0) / flatData.length;
    const errorCount = flatData.filter(cell => cell.status === 'error').length;
    const warningCount = flatData.filter(cell => cell.status === 'warning').length;
    const successCount = flatData.filter(cell => cell.status === 'success').length;
    
    return {
      avgLatency: avgLatency.toFixed(2),
      errorRate: ((errorCount / flatData.length) * 100).toFixed(1),
      warningRate: ((warningCount / flatData.length) * 100).toFixed(1),
      successRate: ((successCount / flatData.length) * 100).toFixed(1)
    };
  };

  const stats = getOverallStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">SLA & Latency Heatmap</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Real-time SLA Monitoring</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Avg Latency</p>
              <p className="text-lg font-semibold text-gray-900">{stats.avgLatency}s</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Success Rate</p>
              <p className="text-lg font-semibold text-green-600">{stats.successRate}%</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Warning Rate</p>
              <p className="text-lg font-semibold text-yellow-600">{stats.warningRate}%</p>
            </div>
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Error Rate</p>
              <p className="text-lg font-semibold text-red-600">{stats.errorRate}%</p>
            </div>
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="space-y-4">
          {/* Column Headers */}
          <div className="grid grid-cols-5 gap-2">
            <div className="text-xs font-medium text-gray-500 text-right pr-2">From / To</div>
            {colLabels.map((label, index) => (
              <div key={index} className="text-xs font-medium text-gray-700 text-center">
                {label}
              </div>
            ))}
          </div>

          {/* Heatmap Rows */}
          {heatmap.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-5 gap-2 items-center">
              <div className="text-xs font-medium text-gray-700 text-right pr-2">
                {rowLabels[rowIndex]}
              </div>
              {row.map((cell, colIndex) => (
                <HeatmapCell
                  key={`${rowIndex}-${colIndex}`}
                  latency={cell.latency}
                  status={cell.status}
                  rowLabel={rowLabels[rowIndex]}
                  colLabel={colLabels[colIndex]}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">SLA Thresholds</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-600">Excellent (&lt;1s latency)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-gray-600">Warning (1-3s latency)</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-gray-600">Critical (&gt;3s latency)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-gray-600">Error (system failure)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatencyHeatmap;
