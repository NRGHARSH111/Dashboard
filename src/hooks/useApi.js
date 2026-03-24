/**
 * Custom Hooks for API Operations
 * Provides easy-to-use API methods with loading states and error handling
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/apiService';

/**
 * Generic API hook
 */
export const useApi = (apiMethod, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiMethod(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, dependencies);

  return { data, loading, error, execute };
};

/**
 * Hook for KPI data
 */
export const useKPIs = (params = {}) => {
  const { data, loading, error, execute } = useApi(api.kpi.getMetrics, [params]);
  
  useEffect(() => {
    execute(params);
  }, [execute, params]);

  return { kpis: data, loading, error, refetch: () => execute(params) };
};

/**
 * Hook for real-time KPI data
 */
export const useRealTimeKPIs = () => {
  const { data, loading, error, execute } = useApi(api.kpi.getRealtime);
  
  useEffect(() => {
    execute(); // ← add this line
    const interval = setInterval(execute, 5000);
    return () => clearInterval(interval);
  }, [execute]);

  return { kpis: data, loading, error };
};

/**
 * Hook for transactions
 */
export const useTransactions = (params = {}) => {
  const { data, loading, error, execute } = useApi(api.transactions.getList, [params]);
  
  useEffect(() => {
    execute(params);
  }, [execute, params]);

  return { transactions: data, loading, error, refetch: () => execute(params) };
};

/**
 * Hook for live transaction feed
 */
export const useLiveTransactions = (params = {}) => {
  const { data, loading, error, execute } = useApi(api.transactions.getLive, [params]);
  
  useEffect(() => {
    const interval = setInterval(execute, 1000);
    return () => clearInterval(interval);
  }, [execute]);

  return { liveTransactions: data, loading, error };
};

/**
 * Hook for transaction by ID
 */
export const useTransaction = (id) => {
  const { data, loading, error, execute } = useApi(api.transactions.getById, [id]);
  
  useEffect(() => {
    if (id) {
      execute(id);
    }
  }, [execute, id]);

  return { transaction: data, loading, error, refetch: () => execute(id) };
};

/**
 * Hook for transaction trace
 */
export const useTransactionTrace = (id) => {
  const { data, loading, error, execute } = useApi(api.transactions.getTrace, [id]);
  
  useEffect(() => {
    if (id) {
      execute(id);
    }
  }, [execute, id]);

  return { trace: data, loading, error, refetch: () => execute(id) };
};

/**
 * Hook for alerts
 */
export const useAlerts = (params = {}) => {
  const { data, loading, error, execute } = useApi(api.alerts.getList, [params]);
  
  useEffect(() => {
    execute(params);
  }, [execute, params]);

  return { alerts: data, loading, error, refetch: () => execute(params) };
};

/**
 * Hook for active alerts
 */
export const useActiveAlerts = () => {
  const { data, loading, error, execute } = useApi(api.alerts.getActive);
  
  useEffect(() => {
    execute();
    const interval = setInterval(execute, 3000);
    return () => clearInterval(interval);
  }, [execute]);

  return { alerts: data, loading, error };
};

/**
 * Hook for logs
 */
export const useLogs = (params = {}) => {
  const { data, loading, error, execute } = useApi(api.logs.getList, [params]);
  
  useEffect(() => {
    execute(params);
  }, [execute, params]);

  return { logs: data, loading, error, refetch: () => execute(params) };
};

/**
 * Hook for logs by correlation key
 */
export const useCorrelationLogs = (correlationKey) => {
  const { data, loading, error, execute } = useApi(api.logs.getByCorrelation, [correlationKey]);
  
  useEffect(() => {
    if (correlationKey) {
      execute(correlationKey);
    }
  }, [execute, correlationKey]);

  return { logs: data, loading, error, refetch: () => execute(correlationKey) };
};

/**
 * Hook for NPCI status
 */
export const useNPCIStatus = () => {
  const { data, loading, error, execute } = useApi(api.npci.getStatus);
  
  useEffect(() => {
    execute();
    const interval = setInterval(execute, 3000);
    return () => clearInterval(interval);
  }, [execute]);

  return { status: data, loading, error };
};

/**
 * Hook for banks
 */
export const useBanks = () => {
  const { data, loading, error, execute } = useApi(api.banks.getList);
  
  useEffect(() => {
    execute();
  }, [execute]);

  return { banks: data, loading, error, refetch: execute };
};

/**
 * Hook for SLA configuration
 */
export const useSLAConfig = () => {
  const { data, loading, error, execute } = useApi(api.sla.getConfig);
  
  useEffect(() => {
    execute();
  }, [execute]);

  return { config: data, loading, error, refetch: execute };
};

/**
 * Hook for health check
 */
export const useHealthCheck = () => {
  const { data, loading, error, execute } = useApi(api.health.check);
  
  useEffect(() => {
    execute(); // ← add this line
    const interval = setInterval(execute, 10000);
    return () => clearInterval(interval);
  }, [execute]);

  return { health: data, loading, error };
};

/**
 * Hook for API mutations (POST, PUT, DELETE)
 */
export const useApiMutation = (apiMethod, options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const mutate = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiMethod(...args);
      setData(result);
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (err) {
      setError(err);
      
      if (options.onError) {
        options.onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiMethod, options]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, mutate, reset };
};
