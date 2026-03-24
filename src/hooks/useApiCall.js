/**
 * Custom hook for API calls with loading states and error handling
 * Provides consistent interface for all API operations
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for managing API calls with loading, error, and data states
 */
export const useApiCall = (apiFunction, options = {}) => {
  const {
    immediate = false,
    dependencies = [],
    onSuccess,
    onError,
    initialData = null,
    retryCount = 0,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [source, setSource] = useState(null); // 'api', 'mock', 'cache', 'fallback'
  
  const abortControllerRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  const execute = useCallback(async (...args) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction(...args);
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setData(result.data);
      setSource(result.source || 'api');
      setLastFetched(new Date());
      
      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const errorObj = {
        message: err.message || 'An error occurred',
        type: err.type || 'UNKNOWN_ERROR',
        severity: err.severity || 'MEDIUM',
        endpoint: err.endpoint,
        suggestion: err.suggestion,
        originalError: err.originalError || err
      };

      setError(errorObj);
      
      if (onError) {
        onError(errorObj);
      }

      // Auto-retry logic
      if (retryCount > 0 && err.type === 'NETWORK_ERROR') {
        retryTimeoutRef.current = setTimeout(() => {
          execute(...args);
        }, retryDelay);
      }

      throw errorObj;
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [apiFunction, onSuccess, onError, retryCount, retryDelay]);

  // Immediate execution
  useEffect(() => {
    if (immediate && apiFunction) {
      execute();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, dependencies);

  // Reset function
  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
    setLastFetched(null);
    setSource(null);
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  }, [initialData]);

  // Refetch function
  const refetch = useCallback(() => {
    return execute();
  }, [execute]);

  return {
    data,
    loading,
    error,
    source,
    lastFetched,
    execute,
    refetch,
    reset,
    isInitialLoad: loading && !data && !error,
    hasData: !!data,
    hasError: !!error
  };
};

/**
 * Hook for paginated API calls
 */
export const usePaginatedApi = (apiFunction, options = {}) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(options.pageSize || 20);
  const [total, setTotal] = useState(0);

  const apiCall = useApiCall(apiFunction, {
    ...options,
    dependencies: [page, pageSize, ...(options.dependencies || [])]
  });

  const loadPage = useCallback((newPage = page, newPageSize = pageSize) => {
    return apiCall.execute({ page: newPage, limit: newPageSize });
  }, [apiCall, page, pageSize]);

  const nextPage = useCallback(() => {
    if (page < Math.ceil(total / pageSize)) {
      setPage(p => p + 1);
    }
  }, [page, total, pageSize]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(p => p - 1);
    }
  }, [page]);

  const goToPage = useCallback((targetPage) => {
    setPage(targetPage);
  }, []);

  useEffect(() => {
    if (apiCall.data?.pagination) {
      setTotal(apiCall.data.pagination.total);
    }
  }, [apiCall.data]);

  return {
    ...apiCall,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    hasNextPage: page < Math.ceil(total / pageSize),
    hasPrevPage: page > 1,
    nextPage,
    prevPage,
    goToPage,
    setPageSize,
    loadPage
  };
};

/**
 * Hook for real-time data with polling
 */
export const useRealTimeApi = (apiFunction, options = {}) => {
  const {
    interval = 5000, // 5 seconds
    enabled = true,
    ...otherOptions
  } = options;

  const [isPolling, setIsPolling] = useState(enabled);
  const intervalRef = useRef(null);

  const apiCall = useApiCall(apiFunction, otherOptions);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsPolling(true);
    
    intervalRef.current = setInterval(() => {
      apiCall.execute();
    }, interval);
  }, [apiCall, interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (enabled && !intervalRef.current) {
      startPolling();
    } else if (!enabled && intervalRef.current) {
      stopPolling();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, startPolling, stopPolling]);

  return {
    ...apiCall,
    isPolling,
    startPolling,
    stopPolling
  };
};

/**
 * Hook for cached API calls
 */
export const useCachedApi = (apiFunction, cacheKey, options = {}) => {
  const {
    ttl = 300000, // 5 minutes
    ...otherOptions
  } = options;

  const getCachedData = useCallback(() => {
    const cached = sessionStorage.getItem(`api_cache_${cacheKey}`);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < ttl) {
        return data;
      }
      sessionStorage.removeItem(`api_cache_${cacheKey}`);
    }
    return null;
  }, [key, ttl]);

  const setCachedData = useCallback((data) => {
    sessionStorage.setItem(`api_cache_${cacheKey}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  }, [cacheKey]);

  const apiCall = useApiCall(apiFunction, {
    ...otherOptions,
    onSuccess: (result) => {
      if (result.source === 'api') {
        setCachedData(result.data);
      }
      if (options.onSuccess) {
        options.onSuccess(result);
      }
    }
  });

  // Load cached data on mount
  useEffect(() => {
    const cachedData = getCachedData();
    if (cachedData && !apiCall.data) {
      apiCall.setData(cachedData);
      apiCall.setSource('cache');
      apiCall.setLastFetched(new Date());
    }
  }, [getCachedData]);

  return {
    ...apiCall,
    invalidateCache: () => {
      sessionStorage.removeItem(`api_cache_${cacheKey}`);
    }
  };
};

export default useApiCall;
