import React, { memo } from 'react';
import { useDashboard } from '../context/DashboardContext';

const StageCell = ({ data, stage, type }) => {
  // Handle null/undefined data immediately
  if (!data || data.failPercent === undefined || data.failPercent === null) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">{stage}</h4>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span className="text-xs text-gray-500 font-medium">No Data</span>
          </div>
        </div>
        <div className="text-center text-gray-400">
          <div className="text-sm">Waiting for data...</div>
        </div>
      </div>
    );
  }

  const getStatusColor = (failPercent) => {
    if (failPercent <= 0.1) return 'bg-status-success';
    if (failPercent <= 0.3) return 'bg-status-timeout';
    return 'bg-status-failure';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700">{stage}</h4>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(data.failPercent)} animate-pulse`}></div>
          <span className="text-xs text-gray-500 font-medium">Live</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Count</span>
          <span className="text-sm font-medium text-gray-900">{data.count.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Avg Time</span>
          <span className="text-sm font-medium text-gray-900">{data.avgTime}s</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Fail %</span>
          <span className={`text-sm font-medium ${
            data.failPercent <= 0.1 ? 'text-status-success' : 
            data.failPercent <= 0.3 ? 'text-status-timeout' : 'text-status-failure'
          }`}>
            {data.failPercent}%
          </span>
        </div>
      </div>
    </div>
  );
};

const getFlowTypeColor = (color) => {
    switch (color) {
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'purple': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

const FlowArrow = () => (
  <div className="flex items-center justify-center">
    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  </div>
);

const FlowMatrix = memo(() => {
  const { flowMatrix } = useDashboard();

  const stages = ['Host', 'TFL Switch', 'NPCI', 'TFL Switch', 'Host'];
  const flowTypes = [
    { key: 'banl', label: 'BANL', color: 'blue' },
    { key: 'imps', label: 'IMPS', color: 'green' },
    { key: 'upi', label: 'UPI', color: 'purple' }
  ];

  const getFlowData = (type, stageIndex) => {
    const typeData = flowMatrix[type];
    if (!typeData) return { count: 0, avgTime: 0, failPercent: 0 };
    
    switch (stageIndex) {
      case 0: return typeData.host;
      case 1: return typeData.tfl;
      case 2: return typeData.npci;
      case 3: return typeData.return;
      default: return { count: 0, avgTime: 0, failPercent: 0 };
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">4-Stage Flow Matrix</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-status-success rounded-full animate-pulse"></div>
          <span>Real-time Flow</span>
        </div>
      </div>

      <div className="w-full space-y-4">
        {flowTypes.map((flowType) => (
          <div key={flowType.key} className="w-full space-y-2">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getFlowTypeColor(flowType.color)}`}></div>
              <h3 className="text-lg font-medium text-gray-800">{flowType.label} Flow</h3>
            </div>
            
            <div className="grid grid-cols-5 gap-4 items-center">
              {stages.map((stage, index) => (
                <React.Fragment key={`${flowType.key}-${index}`}>
                  <StageCell 
                    data={getFlowData(flowType.key, index)}
                    stage={stage}
                    type={flowType.key}
                  />
                  {index < stages.length - 1 && <FlowArrow />}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Legend</h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-status-success rounded-full"></div>
            <span className="text-gray-600">Excellent (&le;0.1% failure)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-status-timeout rounded-full"></div>
            <span className="text-gray-600">Warning (0.1-0.3% failure)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-status-failure rounded-full"></div>
            <span className="text-gray-600">Critical (&gt;0.3% failure)</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default FlowMatrix;
