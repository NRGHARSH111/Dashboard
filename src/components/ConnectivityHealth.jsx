import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, AlertTriangle, CheckCircle, Clock, Activity, Shield, Server, Heart, TrendingUp, TrendingDown } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

/**
 * Connectivity Health Widget - TFL Monitoring Dashboard
 * 
 * Features:
 * 1. Socket Status (UP/DOWN)
 * 2. TLS Handshake Status (OK/FAIL)
 * 3. Last Heartbeat (Timestamp)
 * 4. Packet Loss (%)
 * 5. Round Trip Time (RTT in ms)
 * 6. Visual alert if Link Down > 10 seconds
 * 7. Real-time updates every 2 seconds
 */
const ConnectivityHealth = () => {
  const [connectivityData, setConnectivityData] = useState({
    socket: { status: 'UP', lastChange: new Date() },
    tlsHandshake: { status: 'OK', lastChange: new Date() },
    lastHeartbeat: new Date(),
    packetLoss: 0.5,
    rtt: 45,
    linkDownSince: null,
    historicalData: []
  });
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  console.log('🔗 ConnectivityHealth: Monitoring NPCI link with real-time health metrics');

  // TFL Section 15: Official Status Colors
  const TFL_STATUS_COLORS = {
    SUCCESS: '#22c55e',      // Green for healthy links
    LINK_DOWN: '#991b1b',    // Dark red for link down  
    WARNING: '#f97316',      // Orange for degraded
    PENDING: '#3b82f6'       // Blue for connecting
  };

  // Generate realistic connectivity data
  const generateConnectivityData = useMemo(() => {
    const now = new Date();
    const socketUp = Math.random() > 0.05; // 95% uptime
    const tlsOk = socketUp && Math.random() > 0.02; // 98% success when socket is up
    const packetLoss = socketUp ? Math.random() * 2 : Math.random() * 15 + 10;
    const rtt = socketUp ? Math.random() * 100 + 20 : 9999;

    return {
      socket: {
        status: socketUp ? 'UP' : 'DOWN',
        lastChange: connectivityData.socket.status !== (socketUp ? 'UP' : 'DOWN') ? now : connectivityData.socket.lastChange
      },
      tlsHandshake: {
        status: tlsOk ? 'OK' : 'FAIL',
        lastChange: connectivityData.tlsHandshake.status !== (tlsOk ? 'OK' : 'FAIL') ? now : connectivityData.tlsHandshake.lastChange
      },
      lastHeartbeat: socketUp ? now : connectivityData.lastHeartbeat,
      packetLoss: Math.round(packetLoss * 10) / 10,
      rtt: Math.round(rtt),
      linkDownSince: socketUp ? null : (connectivityData.linkDownSince || now),
      historicalData: [...connectivityData.historicalData.slice(-19), {
        timestamp: now,
        packetLoss: Math.round(packetLoss * 10) / 10,
        rtt: Math.round(rtt),
        status: socketUp ? 'UP' : 'DOWN'
      }]
    };
  }, [connectivityData]);

  // Update data every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const newData = generateConnectivityData;
      setConnectivityData(newData);
      setLastUpdate(new Date());
      
      // Check if link has been down for more than 10 seconds
      if (newData.linkDownSince) {
        const downDuration = (new Date() - newData.linkDownSince) / 1000;
        setIsAlertActive(downDuration > 10);
      } else {
        setIsAlertActive(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [generateConnectivityData]);

  // Get status color based on TFL compliance
  const getStatusColor = (status, type = 'default') => {
    switch (status) {
      case 'UP':
      case 'OK':
        return TFL_STATUS_COLORS.SUCCESS;
      case 'DOWN':
      case 'FAIL':
        return TFL_STATUS_COLORS.LINK_DOWN;
      case 'WARNING':
      case 'DEGRADED':
        return TFL_STATUS_COLORS.WARNING;
      default:
        return TFL_STATUS_COLORS.PENDING;
    }
  };

  // Get packet loss color
  const getPacketLossColor = (loss) => {
    if (loss < 1) return TFL_STATUS_COLORS.SUCCESS;
    if (loss < 5) return TFL_STATUS_COLORS.WARNING;
    return TFL_STATUS_COLORS.LINK_DOWN;
  };

  // Get RTT color
  const getRTTColor = (rtt) => {
    if (rtt < 50) return TFL_STATUS_COLORS.SUCCESS;
    if (rtt < 100) return TFL_STATUS_COLORS.WARNING;
    return TFL_STATUS_COLORS.LINK_DOWN;
  };

  // Format duration
  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // Calculate link down duration
  const linkDownDuration = connectivityData.linkDownSince 
    ? formatDuration(new Date() - connectivityData.linkDownSince)
    : null;

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const alertVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    },
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const metricVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="glass rounded-lg shadow-lg p-6 relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Alert Overlay */}
      <AnimatePresence>
        {isAlertActive && (
          <motion.div
            className="absolute inset-0 bg-red-500/10 border-2 border-red-500 rounded-lg flex items-center justify-center z-10"
            variants={alertVariants}
            initial="hidden"
            animate={['visible', 'pulse']}
            exit="hidden"
          >
            <div className="text-center">
              <motion.div
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <AlertTriangle className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-red-400 mb-2">Link Down Alert</h3>
              <p className="text-red-300">NPCI Link has been down for {linkDownDuration}</p>
              <p className="text-red-200 text-sm mt-2">Immediate attention required</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <motion.div 
            className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30"
            whileHover={{ scale: 1.05 }}
          >
            <Wifi className="w-6 h-6 text-blue-400" />
          </motion.div>
          <div>
            <h2 className="text-xl font-semibold text-gray-100">Connectivity Health</h2>
            <p className="text-sm text-gray-400">NPCI Link Real-time Monitoring</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <motion.div 
              className={`w-2 h-2 rounded-full ${
                connectivityData.socket.status === 'UP' ? 'bg-green-500' : 'bg-red-500'
              }`}
              animate={connectivityData.socket.status === 'UP' ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span>{connectivityData.socket.status === 'UP' ? 'Connected' : 'Disconnected'}</span>
          </div>
          <div className="text-xs text-gray-500">
            Last: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Socket Status */}
        <motion.div
          variants={metricVariants}
          className={`glass-dark rounded-lg p-4 border ${
            connectivityData.socket.status === 'UP' ? 'border-green-500/30' : 'border-red-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">Socket Status</span>
            </div>
            {connectivityData.socket.status === 'UP' ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
          </div>
          <div className={`text-2xl font-bold ${
            connectivityData.socket.status === 'UP' ? 'text-green-400' : 'text-red-400'
          }`}>
            {connectivityData.socket.status}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Since {connectivityData.socket.lastChange.toLocaleTimeString()}
          </div>
        </motion.div>

        {/* TLS Handshake Status */}
        <motion.div
          variants={metricVariants}
          className={`glass-dark rounded-lg p-4 border ${
            connectivityData.tlsHandshake.status === 'OK' ? 'border-green-500/30' : 'border-red-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">TLS Handshake</span>
            </div>
            {connectivityData.tlsHandshake.status === 'OK' ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            )}
          </div>
          <div className={`text-2xl font-bold ${
            connectivityData.tlsHandshake.status === 'OK' ? 'text-green-400' : 'text-red-400'
          }`}>
            {connectivityData.tlsHandshake.status}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Since {connectivityData.tlsHandshake.lastChange.toLocaleTimeString()}
          </div>
        </motion.div>

        {/* Packet Loss */}
        <motion.div
          variants={metricVariants}
          className="glass-dark rounded-lg p-4 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">Packet Loss</span>
            </div>
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getPacketLossColor(connectivityData.packetLoss) }}
            />
          </div>
          <div 
            className="text-2xl font-bold"
            style={{ color: getPacketLossColor(connectivityData.packetLoss) }}
          >
            {connectivityData.packetLoss}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {connectivityData.packetLoss < 1 ? 'Excellent' : connectivityData.packetLoss < 5 ? 'Acceptable' : 'Critical'}
          </div>
        </motion.div>

        {/* Round Trip Time */}
        <motion.div
          variants={metricVariants}
          className="glass-dark rounded-lg p-4 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">RTT</span>
            </div>
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getRTTColor(connectivityData.rtt) }}
            />
          </div>
          <div 
            className="text-2xl font-bold"
            style={{ color: getRTTColor(connectivityData.rtt) }}
          >
            {connectivityData.rtt}ms
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {connectivityData.rtt < 50 ? 'Excellent' : connectivityData.rtt < 100 ? 'Good' : 'Poor'}
          </div>
        </motion.div>
      </div>

      {/* Last Heartbeat and Status Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heartbeat Information */}
        <motion.div 
          className="glass-dark rounded-lg p-4 border border-gray-700"
          variants={metricVariants}
        >
          <div className="flex items-center space-x-2 mb-3">
            <Heart className="w-5 h-5 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-300">Last Heartbeat</h3>
          </div>
          <div className="space-y-2">
            <div className="text-lg font-mono text-gray-100">
              {connectivityData.lastHeartbeat.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">
              {Math.floor((new Date() - connectivityData.lastHeartbeat) / 1000)} seconds ago
            </div>
            {connectivityData.socket.status === 'DOWN' && connectivityData.linkDownSince && (
              <div className="mt-3 p-2 bg-red-500/20 rounded border border-red-500/30">
                <div className="text-sm text-red-400 font-medium">
                  Link Down Duration: {linkDownDuration}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Connection Summary */}
        <motion.div 
          className="glass-dark rounded-lg p-4 border border-gray-700"
          variants={metricVariants}
        >
          <div className="flex items-center space-x-2 mb-3">
            <Activity className="w-5 h-5 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-300">Connection Summary</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Overall Status</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                connectivityData.socket.status === 'UP' && connectivityData.tlsHandshake.status === 'OK'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                {connectivityData.socket.status === 'UP' && connectivityData.tlsHandshake.status === 'OK' ? 'HEALTHY' : 'DEGRADED'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Link Quality</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                connectivityData.packetLoss < 1 && connectivityData.rtt < 50
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
              }`}>
                {connectivityData.packetLoss < 1 && connectivityData.rtt < 50 ? 'EXCELLENT' : 'FAIR'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Update Frequency</span>
              <span className="text-xs text-gray-300">2 seconds</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mini Chart */}
      {connectivityData.historicalData.length > 1 && (
        <motion.div 
          className="mt-6 glass-dark rounded-lg p-4 border border-gray-700"
          variants={metricVariants}
        >
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-300">Recent Performance (20 data points)</h3>
          </div>
          <div className="flex items-end space-x-1 h-16">
            {connectivityData.historicalData.map((data, index) => (
              <motion.div
                key={index}
                className="flex-1 bg-blue-500/30 rounded-t"
                style={{ 
                  height: `${Math.min(100, (data.rtt / 200) * 100)}%`,
                  backgroundColor: data.status === 'UP' ? '#3b82f6' : '#ef4444'
                }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>40s ago</span>
            <span>RTT (ms)</span>
            <span>Now</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ConnectivityHealth;
