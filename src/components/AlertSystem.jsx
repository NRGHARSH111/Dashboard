import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, AlertCircle, Info, WifiOff } from 'lucide-react';

/**
 * Alert System Component - TFL Monitoring Dashboard
 * 
 * Severity Levels:
 * - CRITICAL: NPCI Link Down - Full-width red flashing banner (10s lock)
 * - HIGH: Failure rate > 1% - Orange toast, dismissible immediately  
 * - MEDIUM: Latency high - Amber toast, auto-dismiss after 10s
 * - LOW: General warnings - Badge counter only
 */

const AlertSystem = () => {
  const [alerts, setAlerts] = useState([]);
  const [criticalLockTime, setCriticalLockTime] = useState(0);
  const alertIdCounter = useRef(0);
  const criticalIntervalRef = useRef(null);

  // Mock trigger: generate random alert every 15 seconds
  useEffect(() => {
    const generateMockAlert = () => {
      const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      
      const messages = {
        CRITICAL: 'NPCI Link Down - Connection lost to NPCI gateway',
        HIGH: 'Failure rate exceeded 1% threshold',
        MEDIUM: 'High latency detected on TFL Switch path',
        LOW: 'General system warning detected'
      };

      const newAlert = {
        id: ++alertIdCounter.current,
        severity,
        message: messages[severity],
        timestamp: new Date(),
        dismissible: severity !== 'CRITICAL'
      };

      // TODO: Trigger SMS + Call + Email via NotificationAPI (TFL Section 11)
      if (severity === 'CRITICAL') {
        console.warn('CRITICAL ALERT: Notify via SMS + Call + Email', newAlert);
      }

      setAlerts(prev => {
        // Sort alerts: CRITICAL first, then HIGH, MEDIUM
        const updated = [newAlert, ...prev].sort((a, b) => {
          const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        });
        
        // Keep max 5 visible alerts (excluding LOW which are just counters)
        return updated.filter((alert, index) => alert.severity === 'LOW' || index < 5);
      });

      // Set critical lock for 10 seconds
      if (severity === 'CRITICAL') {
        setCriticalLockTime(10);
        if (criticalIntervalRef.current) clearInterval(criticalIntervalRef.current);
        
        criticalIntervalRef.current = setInterval(() => {
          setCriticalLockTime(prev => {
            if (prev <= 1) {
              clearInterval(criticalIntervalRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }

      // Auto-dismiss MEDIUM alerts after 10 seconds
      if (severity === 'MEDIUM') {
        setTimeout(() => {
          setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
        }, 10000);
      }
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.3) { // 70% chance to generate alert
        generateMockAlert();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);


  const dismissAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
    setCriticalLockTime(0);
    if (criticalIntervalRef.current) {
      clearInterval(criticalIntervalRef.current);
    }
  };

  const getLowSeverityCount = () => {
    return alerts.filter(alert => alert.severity === 'LOW').length;
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return <WifiOff className="w-5 h-5" />;
      case 'HIGH':
        return <AlertTriangle className="w-5 h-5" />;
      case 'MEDIUM':
        return <AlertCircle className="w-5 h-5" />;
      case 'LOW':
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-900 text-white border-red-700';
      case 'HIGH':
        return 'bg-orange-800 text-white border-orange-600';
      case 'MEDIUM':
        return 'bg-yellow-700 text-white border-yellow-600';
      case 'LOW':
        return 'bg-gray-600 text-white border-gray-500';
      default:
        return 'bg-gray-600 text-white border-gray-500';
    }
  };

  const getSeverityBadgeStyles = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-600 text-white';
      case 'HIGH':
        return 'bg-orange-600 text-white';
      case 'MEDIUM':
        return 'bg-yellow-600 text-white';
      case 'LOW':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Critical alert banner
  const criticalAlert = alerts.find(alert => alert.severity === 'CRITICAL');

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      {/* Critical Alert Banner */}
      <AnimatePresence>
        {criticalAlert && (
          <motion.div
            className="pointer-events-auto"
            initial={{ opacity: 0, y: -100 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: criticalLockTime > 0 ? [1, 1.02, 1] : 1
            }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ 
              duration: 0.3,
              scale: criticalLockTime > 0 ? {
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              } : {}
            }}
          >
            <div className="w-full bg-red-900 text-white px-4 py-3 flex items-center justify-between border-b-4 border-red-700">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: criticalLockTime > 0 ? [0, 10, -10, 0] : 0 }}
                  transition={{ duration: 0.5, repeat: criticalLockTime > 0 ? Infinity : 0 }}
                >
                  <WifiOff className="w-6 h-6" />
                </motion.div>
                <div>
                  <div className="font-bold text-lg">CRITICAL ALERT</div>
                  <div className="text-sm opacity-90">{criticalAlert.message}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {criticalLockTime > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="text-sm">Cannot dismiss for</div>
                    <div className="bg-red-800 px-2 py-1 rounded font-mono font-bold">
                      {criticalLockTime}s
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => dismissAlert(criticalAlert.id)}
                  disabled={criticalLockTime > 0}
                  className={`p-2 rounded-full transition-colors ${
                    criticalLockTime > 0 
                      ? 'bg-red-800 text-gray-400 cursor-not-allowed' 
                      : 'bg-red-800 hover:bg-red-700 text-white'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert Toasts Container */}
      <div className="fixed top-4 right-4 space-y-2 pointer-events-none">
        <AnimatePresence>
          {alerts
            .filter(alert => alert.severity !== 'CRITICAL' && alert.severity !== 'LOW')
            .map(alert => (
              <motion.div
                key={alert.id}
                className="pointer-events-auto"
                initial={{ opacity: 0, x: 300, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 300, scale: 0.8 }}
                transition={{ duration: 0.3, type: "spring" }}
              >
                <div className={`min-w-80 max-w-96 p-4 rounded-lg shadow-lg border ${getSeverityStyles(alert.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-0.5">
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${getSeverityBadgeStyles(alert.severity)}`}>
                            {alert.severity}
                          </span>
                          <span className="text-xs opacity-75">
                            {formatTimestamp(alert.timestamp)}
                          </span>
                        </div>
                        <div className="text-sm font-medium">{alert.message}</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="flex-shrink-0 ml-2 p-1 rounded hover:bg-black hover:bg-opacity-20 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
        </AnimatePresence>

        {/* Clear All Button */}
        {alerts.length > 0 && (
          <motion.div
            className="pointer-events-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <button
              onClick={clearAllAlerts}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg shadow-lg border border-gray-600 hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              Clear All ({alerts.length})
            </button>
          </motion.div>
        )}
      </div>

      {/* Low Severity Badge Counter */}
      {getLowSeverityCount() > 0 && (
        <motion.div
          className="fixed bottom-4 right-4 pointer-events-auto"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button
            onClick={() => {
              // Promote LOW alerts to visible toasts temporarily
              setAlerts(prev => prev.map(alert => 
                alert.severity === 'LOW' 
                  ? { ...alert, severity: 'MEDIUM', promoted: true } 
                  : alert
              ));
            }}
            className="bg-gray-700 text-white px-4 py-2 rounded-full shadow-lg border border-gray-600 hover:bg-gray-600 transition-colors flex items-center space-x-2"
          >
            <Info className="w-4 h-4" />
            <span className="font-medium">View {getLowSeverityCount()} Warnings</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default AlertSystem;
