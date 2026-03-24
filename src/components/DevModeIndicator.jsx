import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Settings, RefreshCw } from 'lucide-react';
import { checkBackendHealth, devModeHelper } from '../utils/backendHealthCheck';

const DevModeIndicator = () => {
  const [health, setHealth] = useState({});
  const [showDetails, setShowDetails] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkHealth = async () => {
    setChecking(true);
    const results = await checkBackendHealth();
    setHealth(results);
    setChecking(false);
  };

  useEffect(() => {
    if (import.meta.env.DEV) {
      checkHealth();
      const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, []);

  const healthyCount = Object.values(health).filter(r => r.status === 'HEALTHY').length;
  const totalCount = Object.keys(health).length;
  const isHealthy = healthyCount === totalCount && totalCount > 0;

  if (!import.meta.env.DEV) {
    return null; // Only show in development
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-64"
      >
        {/* Status Bar */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {isHealthy ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            )}
            <span className="text-xs font-medium">
              {healthyCount}/{totalCount} Services Online
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Settings className="w-3 h-3 text-gray-500" />
            </button>
            <button
              onClick={checkHealth}
              disabled={checking}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <RefreshCw className={`w-3 h-3 text-gray-500 ${checking ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Status */}
        <div className="text-xs text-gray-600">
          {isHealthy ? (
            <span className="text-green-600">🟢 All systems operational</span>
          ) : healthyCount === 0 ? (
            <span className="text-red-600">🔴 Using mock data (backend offline)</span>
          ) : (
            <span className="text-yellow-600">🟡 Partial backend connectivity</span>
          )}
        </div>

        {/* Detailed Health Status */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 pt-3 border-t border-gray-200 space-y-2"
          >
            <div className="text-xs font-semibold text-gray-700 mb-2">Service Status:</div>
            {Object.entries(health).map(([service, status]) => (
              <div key={service} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{service}:</span>
                <span className={`font-medium ${
                  status.status === 'HEALTHY' ? 'text-green-600' : 
                  status.status === 'DOWN' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {status.status}
                </span>
              </div>
            ))}
            
            {/* Development Helper Buttons */}
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
              <div className="text-xs font-semibold text-gray-700 mb-2">Development Tools:</div>
              <button
                onClick={() => devModeHelper.forceMockMode()}
                className="w-full text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded"
              >
                Force Mock Mode
              </button>
              <button
                onClick={() => devModeHelper.forceLiveMode()}
                className="w-full text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded"
              >
                Force Live Mode
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default DevModeIndicator;
