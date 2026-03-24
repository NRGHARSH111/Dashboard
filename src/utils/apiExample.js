/**
 * Example Usage of Centralized API Configuration
 * This file demonstrates how to use the new API system
 */

import api from '../services/apiService';
import { useKPIs, useTransactions, useApiMutation } from '../hooks/useApi';
import { API_ENDPOINTS, HTTP_METHODS } from '../config/apiConfig';

// ========================================
// EXAMPLE 1: Direct API Service Usage
// ========================================

/**
 * Example: Get KPI metrics
 */
export const fetchKPIs = async () => {
  try {
    const kpis = await api.kpi.getMetrics({
      timeRange: '1h',
      granularity: '5m'
    });
    console.log('KPIs:', kpis);
    return kpis;
  } catch (error) {
    console.error('Failed to fetch KPIs:', error);
    throw error;
  }
};

/**
 * Example: Get transaction by RRN
 */
export const getTransactionByRRN = async (rrn) => {
  try {
    const transaction = await api.transactions.getByRRN(rrn);
    console.log('Transaction:', transaction);
    return transaction;
  } catch (error) {
    console.error('Failed to get transaction:', error);
    throw error;
  }
};

/**
 * Example: Create alert rule
 */
export const createAlertRule = async (ruleData) => {
  try {
    const rule = await api.alerts.createRule(ruleData);
    console.log('Alert rule created:', rule);
    return rule;
  } catch (error) {
    console.error('Failed to create alert rule:', error);
    throw error;
  }
};

/**
 * Example: Search logs with filters
 */
export const searchLogs = async (filters) => {
  try {
    const logs = await api.logs.search({
      startTime: filters.startTime,
      endTime: filters.endTime,
      level: filters.level,
      search: filters.searchText,
      limit: 100
    });
    console.log('Logs:', logs);
    return logs;
  } catch (error) {
    console.error('Failed to search logs:', error);
    throw error;
  }
};

/**
 * Example: Update SLA configuration
 */
export const updateSLAConfig = async (slaId, config) => {
  try {
    const updated = await api.sla.updateRule(slaId, config);
    console.log('SLA config updated:', updated);
    return updated;
  } catch (error) {
    console.error('Failed to update SLA config:', error);
    throw error;
  }
};

// ========================================
// EXAMPLE 2: React Hook Usage
// ========================================

/**
 * Example Component using KPI hook
 */
export const KPIDashboardComponent = () => {
  const { kpis, loading, error, refetch } = useKPIs({
    timeRange: '24h',
    granularity: '1h'
  });

  if (loading) return <div>Loading KPIs...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>KPI Dashboard</h2>
      <button onClick={refetch}>Refresh</button>
      <pre>{JSON.stringify(kpis, null, 2)}</pre>
    </div>
  );
};

/**
 * Example Component using transactions hook
 */
export const TransactionsListComponent = () => {
  const { transactions, loading, error, refetch } = useTransactions({
    page: 1,
    limit: 50,
    status: 'success'
  });

  if (loading) return <div>Loading transactions...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Transactions</h2>
      <button onClick={refetch}>Refresh</button>
      <ul>
        {transactions?.map(tx => (
          <li key={tx.id}>{tx.rrn} - {tx.status}</li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Example Component using mutation hook
 */
export const AlertRuleCreator = () => {
  const { mutate, loading, error } = useApiMutation(api.alerts.createRule, {
    onSuccess: (data) => {
      console.log('Alert rule created successfully:', data);
      alert('Alert rule created!');
    },
    onError: (error) => {
      console.error('Failed to create alert rule:', error);
      alert('Failed to create alert rule');
    }
  });

  const handleSubmit = (ruleData) => {
    mutate(ruleData);
  };

  return (
    <div>
      <h2>Create Alert Rule</h2>
      <button 
        onClick={() => handleSubmit({
          name: 'High Latency Alert',
          condition: 'latency > 3000',
          severity: 'high',
          action: 'email'
        })}
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Rule'}
      </button>
      {error && <div>Error: {error.message}</div>}
    </div>
  );
};

// ========================================
// EXAMPLE 3: Advanced Usage Patterns
// ========================================

/**
 * Example: Batch operations
 */
export const batchOperations = async () => {
  try {
    // Execute multiple API calls in parallel
    const [kpis, transactions, alerts] = await Promise.all([
      api.kpi.getMetrics(),
      api.transactions.getList({ limit: 10 }),
      api.alerts.getActive()
    ]);

    return { kpis, transactions, alerts };
  } catch (error) {
    console.error('Batch operation failed:', error);
    throw error;
  }
};

/**
 * Example: Pagination with infinite scroll
 */
export const usePaginatedTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newTransactions = await api.transactions.getList({
        page,
        limit: 20
      });

      setTransactions(prev => [...prev, ...newTransactions]);
      setPage(prev => prev + 1);
      setHasMore(newTransactions.length === 20);
    } catch (error) {
      console.error('Failed to load more transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore]);

  return { transactions, loading, loadMore, hasMore };
};

/**
 * Example: Real-time data with WebSocket
 */
export const useRealTimeData = () => {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const wsService = require('../services/websocketService').wsService;

    // Subscribe to real-time updates
    wsService.subscribe('kpi_update', (payload) => {
      setData(prev => ({ ...prev, ...payload }));
    });

    wsService.subscribe('transaction_alert', (payload) => {
      console.log('New transaction alert:', payload);
    });

    wsService.subscribe('connected', () => {
      setConnected(true);
    });

    wsService.subscribe('disconnected', () => {
      setConnected(false);
    });

    return () => {
      wsService.unsubscribe('kpi_update');
      wsService.unsubscribe('transaction_alert');
      wsService.unsubscribe('connected');
      wsService.unsubscribe('disconnected');
    };
  }, []);

  return { data, connected };
};

// ========================================
// EXAMPLE 4: Error Handling Patterns
// ========================================

/**
 * Example: Global error handler
 */
export const handleApiError = (error) => {
  if (error.message.includes('401')) {
    // Redirect to login
    window.location.href = '/login';
  } else if (error.message.includes('403')) {
    // Show permission denied message
    alert('Permission denied');
  } else if (error.message.includes('500')) {
    // Show server error message
    alert('Server error. Please try again later.');
  } else {
    // Show generic error message
    alert('An error occurred. Please try again.');
  }
};

/**
 * Example: Retry mechanism
 */
export const fetchWithRetry = async (apiMethod, maxRetries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiMethod();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

// ========================================
// EXAMPLE 5: Configuration Usage
// ========================================

/**
 * Example: Using configuration directly
 */
export const configExample = () => {
  // Import configuration
  const { API_CONFIG, API_ENDPOINTS } = require('../config/apiConfig');

  console.log('Current environment:', API_CONFIG.environment);
  console.log('Base URL:', API_CONFIG.baseURL);
  console.log('WebSocket URL:', API_CONFIG.wsURL);
  console.log('Timeouts:', API_CONFIG.timeouts);

  // Use endpoints directly
  console.log('KPI endpoint:', API_ENDPOINTS.KPI.METRICS);
  console.log('Transaction by ID endpoint:', API_ENDPOINTS.TRANSACTIONS.BY_ID('123'));
};
