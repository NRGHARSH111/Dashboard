import { useState, useEffect, useCallback } from 'react';
import { prometheusService, elkService, wsService } from '../services/apiService';

const useDashboardData = () => {
  const [kpiData, setKpiData] = useState({
    totalTxnToday: { value: 2847392, change: 12.5, trend: 'up' },
    successRate: { value: 99.87, change: 0.03, trend: 'up' },
    avgLatency: { value: 127, change: -8, trend: 'down' },
    pendingTxns: { value: 0.08, change: -0.02, trend: 'down' },
    npciStatus: { value: 'Connected', change: 'Stable', trend: 'stable' }
  });

  const [flowMatrixData, setFlowMatrixData] = useState({
    banl: {
      host: { count: 947821, avgTime: 0.045, failPercent: 0.08 },
      tfl: { count: 947798, avgTime: 0.023, failPercent: 0.05 },
      npci: { count: 947795, avgTime: 0.156, failPercent: 0.12 },
      return: { count: 947792, avgTime: 0.034, failPercent: 0.03 }
    },
    imps: {
      host: { count: 1256341, avgTime: 0.067, failPercent: 0.11 },
      tfl: { count: 1256328, avgTime: 0.029, failPercent: 0.07 },
      npci: { count: 1256325, avgTime: 0.189, failPercent: 0.15 },
      return: { count: 1256320, avgTime: 0.041, failPercent: 0.04 }
    },
    upi: {
      host: { count: 643230, avgTime: 0.052, failPercent: 0.09 },
      tfl: { count: 643224, avgTime: 0.025, failPercent: 0.06 },
      npci: { count: 643221, avgTime: 0.134, failPercent: 0.13 },
      return: { count: 643218, avgTime: 0.037, failPercent: 0.05 }
    }
  });

  const [transactions, setTransactions] = useState([]);
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch KPI data from Prometheus
  const fetchKPIData = useCallback(async () => {
    try {
      setLoading(true);
      const metrics = await prometheusService.getKPIs();
      
      setKpiData({
        totalTxnToday: { 
          value: Math.round(metrics.totalTxns || 0).toLocaleString(), 
          change: 12.5, 
          trend: 'up' 
        },
        successRate: { 
          value: parseFloat(metrics.successRate || 0).toFixed(2), 
          change: 0.03, 
          trend: 'up' 
        },
        avgLatency: { 
          value: Math.round(metrics.avgLatency || 0), 
          change: -8, 
          trend: 'down' 
        },
        pendingTxns: { 
          value: parseFloat(metrics.pendingTxns || 0).toFixed(2), 
          change: -0.02, 
          trend: 'down' 
        },
        npciStatus: { 
          value: metrics.npciConnectivity === 1 ? 'Connected' : 'Disconnected', 
          change: 'Stable', 
          trend: 'stable' 
        }
      });
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch KPI data:', err);
      setError('Failed to fetch metrics from Prometheus');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch transaction logs from ELK
  const fetchTransactions = useCallback(async (searchQuery = '') => {
    try {
      const endTime = new Date().toISOString();
      const startTime = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // Last 1 hour
      
      const logs = await elkService.searchLogs(searchQuery, startTime, endTime, 50);
      
      const formattedTransactions = logs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        type: log.switch || 'UNKNOWN',
        rrn: log.rrn || 'N/A',
        fromBank: log.source?.from_bank || 'Unknown',
        toBank: log.source?.to_bank || 'Unknown',
        fromAccount: log.source?.from_account || 'XXXXXX',
        toAccount: log.source?.to_account || 'XXXXXX',
        amount: log.source?.amount || Math.random() * 100000,
        latency: log.source?.duration || Math.floor(Math.random() * 500) + 50,
        status: log.level === 'ERROR' ? 'FAILURE' : 
                log.level === 'WARN' ? 'TIMEOUT' : 
                log.level === 'INFO' ? 'SUCCESS' : 'PENDING'
      }));
      
      setTransactions(formattedTransactions);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      // Fallback to mock data if ELK is not available
      generateMockTransactions();
    }
  }, []);

  // Generate mock transactions as fallback
  const generateMockTransactions = useCallback(() => {
    const types = ['BANL', 'IMPS', 'UPI'];
    const statuses = ['SUCCESS', 'PENDING', 'TIMEOUT', 'FAILURE'];
    const banks = ['HDFC', 'ICICI', 'SBI', 'PNB', 'BOI', 'CITI', 'AXIS', 'KOTAK'];
    
    const mockTxns = Array.from({ length: 20 }, (_, index) => {
      const amount = Math.random() * 100000;
      const latency = Math.floor(Math.random() * 500) + 50;
      
      return {
        id: `txn-${Date.now()}-${index}`,
        timestamp: new Date(Date.now() - index * 30000).toISOString(),
        type: types[Math.floor(Math.random() * types.length)],
        rrn: Math.random().toString(36).substr(2, 12).toUpperCase(),
        fromBank: banks[Math.floor(Math.random() * banks.length)],
        toBank: banks[Math.floor(Math.random() * banks.length)],
        fromAccount: Math.random().toString(36).substr(2, 10).toUpperCase(),
        toAccount: Math.random().toString(36).substr(2, 10).toUpperCase(),
        amount: amount,
        latency: latency,
        status: statuses[Math.floor(Math.random() * statuses.length)]
      };
    });
    
    setTransactions(mockTxns);
  }, []);

  // WebSocket message handlers
  const handleRealTimeUpdate = useCallback((data) => {
    switch (data.type) {
      case 'kpi_update':
        setKpiData(prev => ({
          ...prev,
          ...data.metrics
        }));
        break;
        
      case 'new_transaction':
        setTransactions(prev => [data.transaction, ...prev.slice(0, 49)]);
        break;
        
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    wsService.connect();
    wsService.subscribe('kpi_update', handleRealTimeUpdate);
    wsService.subscribe('new_transaction', handleRealTimeUpdate);

    return () => {
      wsService.unsubscribe('kpi_update', handleRealTimeUpdate);
      wsService.unsubscribe('new_transaction', handleRealTimeUpdate);
      wsService.disconnect();
    };
  }, [handleRealTimeUpdate]);

  // Initial data fetch
  useEffect(() => {
    fetchKPIData();
    fetchTransactions();
  }, [fetchKPIData, fetchTransactions]);

  // Set up periodic updates
  useEffect(() => {
    if (!isLive) return;

    const kpiInterval = setInterval(fetchKPIData, 5000); // Every 5 seconds
    const txnInterval = setInterval(() => fetchTransactions(), 1000); // Every 1 second

    return () => {
      clearInterval(kpiInterval);
      clearInterval(txnInterval);
    };
  }, [isLive, fetchKPIData, fetchTransactions]);

  // Search functionality
  const searchTransactions = useCallback(async (query) => {
    await fetchTransactions(query);
  }, [fetchTransactions]);

  // Export functionality
  const exportData = useCallback(async (format, data) => {
    try {
      switch (format) {
        case 'csv':
          // CSV export logic
          console.log('Exporting to CSV...');
          break;
        case 'json':
          // JSON export logic
          console.log('Exporting to JSON...');
          break;
        default:
          console.log('Unsupported format:', format);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, []);

  return {
    kpiData,
    flowMatrixData,
    transactions,
    isLive,
    setIsLive,
    loading,
    error,
    refetchKPIs: fetchKPIData,
    refetchTransactions: fetchTransactions,
    searchTransactions,
    exportData
  };
};

export default useDashboardData;
