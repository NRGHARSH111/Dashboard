import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Bell, CheckCircle } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

const AlertItem = ({ alert, onResolve }) => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className={`border rounded-lg p-4 mb-3 ${getSeverityColor(alert.severity)}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <AlertTriangle className={`w-5 h-5 mt-0.5 ${getSeverityIcon(alert.severity)}`} />
          <div>
            <h4 className="font-semibold text-sm">{alert.title}</h4>
            <p className="text-xs mt-1 opacity-80">{alert.message}</p>
            <p className="text-xs mt-2 opacity-60">
              {new Date(alert.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
        <button
          onClick={() => onResolve(alert.id)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

const AlertSystem = () => {
  const { alerts, resolveAlert } = useDashboard();
  const [showAlerts, setShowAlerts] = useState(false);

  // Simulate real-time alerts
  useEffect(() => {
    const interval = setInterval(() => {
      // Random alert generation for demo
      if (Math.random() > 0.95) {
        const mockAlert = {
          id: Date.now(),
          title: 'High Latency Detected',
          message: 'UPI transactions experiencing latency > 3s',
          severity: 'high',
          timestamp: new Date()
        };
        // addAlert(mockAlert);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-20 right-4 z-50">
      {/* Alert Bell */}
      <button
        onClick={() => setShowAlerts(!showAlerts)}
        className="relative p-3 bg-white rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {alerts.active.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
            {alerts.active.length}
          </span>
        )}
      </button>

      {/* Alert Panel */}
      <AnimatePresence>
        {showAlerts && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 right-0 w-80 max-h-96 overflow-hidden bg-white rounded-lg shadow-xl border border-gray-200"
          >
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Active Alerts</h3>
              <p className="text-xs text-gray-500">
                {alerts.active.length} active alerts
              </p>
            </div>
            
            <div className="max-h-64 overflow-y-auto p-4">
              {alerts.active.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No active alerts</p>
                </div>
              ) : (
                alerts.active.map((alert) => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    onResolve={resolveAlert}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AlertSystem;
