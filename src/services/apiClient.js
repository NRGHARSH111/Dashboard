/**
 * Enhanced API Client for TFL Monitoring Dashboard
 * Provides unified interface for all API calls with comprehensive error handling
 * Supports TFL-specific endpoints, security compliance, and real API connectivity
 */

import { API_CONFIG, API_ENDPOINTS, buildCompleteURL, isDevelopment } from '../config/apiConfig';
// Mock data service removed - no longer available
import { checkBackendHealth, classifyError } from '../utils/backendHealthCheck';
import { 
  maskAccount, 
  maskRRN, 
  maskMobile, 
  maskEmail, 
  maskPAN 
} from '../utils/dataMasking';
import { 
  tokenService, 
  securityMiddleware, 
  auditService, 
  initializeSecurity 
} from '../utils/securityService';

// Initialize security features on module load
initializeSecurity();

// Cache for backend health status
let healthCache = {
  lastCheck: 0,
  isHealthy: false,
  checkInterval: 30000 // 30 seconds
};

// Request cache for reducing duplicate calls
const requestCache = new Map();
const CACHE_TTL = 5000; // 5 seconds

/**
 * Check if backend is available (with caching)
 */
const isBackendAvailable = async () => {
  const now = Date.now();
  
  // Use cached result if recent
  if (healthCache.lastCheck && (now - healthCache.lastCheck) < healthCache.checkInterval) {
    return healthCache.isHealthy;
  }
  
  try {
    const healthResults = await checkBackendHealth();
    const healthyServices = Object.values(healthResults).filter(r => r.status === 'HEALTHY').length;
    
    healthCache.isHealthy = healthyServices > 0;
    healthCache.lastCheck = now;
    
    return healthCache.isHealthy;
  } catch (error) {
    healthCache.isHealthy = false;
    healthCache.lastCheck = now;
    return false;
  }
};

/**
 * Generate cache key for requests
 */
const getCacheKey = (url, options) => {
  return `${url}:${JSON.stringify(options)}`;
};

/**
 * Get cached response or null
 */
const getCachedResponse = (cacheKey) => {
  const cached = requestCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }
  requestCache.delete(cacheKey);
  return null;
};

/**
 * Cache response
 */
const setCachedResponse = (cacheKey, data) => {
  requestCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
};

/**
 * Enhanced fetch with retry logic
 */
const fetchWithRetry = async (url, options, retryCount = 0) => {
  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(API_CONFIG.timeouts.default)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    if (retryCount < API_CONFIG.retry.maxAttempts && 
        (error.name === 'TypeError' || error.name === 'TimeoutError')) {
      
      const delay = API_CONFIG.retry.delay * Math.pow(API_CONFIG.retry.backoffFactor, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return fetchWithRetry(url, options, retryCount + 1);
    }
    
    throw error;
  }
};

/**
 * Apply data masking to sensitive fields as per TFL compliance
 */
const applyDataMasking = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  // ✅ FIX: Safe access to security config with default fallback
  const maskingFields = API_CONFIG?.security?.dataMasking?.fields || ['account', 'rrn', 'mobile', 'email', 'pan'];
  const maskedData = JSON.parse(JSON.stringify(data)); // Deep clone
  
  const maskValue = (key, value) => {
    if (!value || typeof value !== 'string') return value;
    
    switch (key.toLowerCase()) {
      case 'accountnumber':
      case 'account':
        return maskAccount(value);
      case 'rrn':
        return maskRRN(value);
      case 'mobilenumber':
      case 'mobile':
      case 'phone':
        return maskMobile(value);
      case 'email':
        return maskEmail(value);
      case 'pan':
        return maskPAN(value);
      default:
        return value;
    }
  };
  
  const maskObject = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(item => maskObject(item));
    }
    
    if (obj && typeof obj === 'object') {
      const masked = {};
      for (const [key, value] of Object.entries(obj)) {
        if (maskingFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          masked[key] = maskValue(key, value);
        } else if (typeof value === 'object') {
          masked[key] = maskObject(value);
        } else {
          masked[key] = value;
        }
      }
      return masked;
    }
    
    return obj;
  };
  
  return maskObject(maskedData);
};

/**
 * Get enhanced authentication headers with TFL compliance and security
 */
const getAuthHeaders = () => {
  const token = tokenService.getToken();
  const headers = {
    'Content-Type': 'application/json',
    'X-TFL-Client-Version': '1.0.0',
    'X-TFL-Request-ID': `REQ${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
    'X-TFL-Timestamp': new Date().toISOString(),
    'X-TFL-Security-Level': API_CONFIG?.security?.requireAuth ? 'HIGH' : 'MEDIUM'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-TFL-Auth-Token'] = token;
  }
  
  // Add environment-specific headers
  if (isDevelopment()) {
    headers['X-TFL-Environment'] = 'development';
  }
  
  // Add compliance headers with safe access
  const dataMaskingEnabled = API_CONFIG?.security?.dataMasking?.enabled === true;
  headers['X-TFL-Data-Masking'] = dataMaskingEnabled ? 'ENABLED' : 'DISABLED';
  headers['X-TFL-Audit-Required'] = 'TRUE';
  
  return headers;
};

/**
 * Main API request function with intelligent fallback and TFL compliance
 */
export const apiRequest = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    params = {},
    data = null,
    useCache = false,
    fallbackToMock = true,
    mockDataGenerator = null,
    applyMasking = false,
    timeout = API_CONFIG.timeouts.default,
    skipSecurity = false,
    ...otherOptions
  } = options;

  // Log API request attempt
  auditService.logSecurityEvent('API_REQUEST_INITIATED', {
    endpoint,
    method,
    hasData: !!data,
    applyMasking
  });

  const url = buildCompleteURL(endpoint, {}, params);
  const cacheKey = getCacheKey(url, { method, data });

  // Check cache first
  if (useCache && method === 'GET') {
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      const maskedData = applyMasking ? applyDataMasking(cached) : cached;
      auditService.logSecurityEvent('API_REQUEST_SERVED_FROM_CACHE', { endpoint });
      return { data: maskedData, cached: true, source: 'cache' };
    }
  }

  // Apply security middleware
  let requestConfig = { method, data, params, endpoint, url };
  
  // ✅ FIX: Safe check for API_CONFIG.security and requireAuth
  const securityConfig = API_CONFIG?.security;
  const requireAuth = securityConfig?.requireAuth === true;
  
  if (!skipSecurity && requireAuth) {
    try {
      requestConfig = await securityMiddleware.beforeRequest(requestConfig);
    } catch (securityError) {
      auditService.logSecurityEvent('SECURITY_VALIDATION_FAILED', {
        endpoint,
        error: securityError.message
      });
      throw securityError;
    }
  }


  try {
    const requestOptions = {
      method: requestConfig.method || method,
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(timeout),
      ...otherOptions
    };

    if (requestConfig.data && method !== 'GET') {
      requestOptions.body = JSON.stringify(requestConfig.data);
    }

    const response = await fetchWithRetry(requestConfig.url || url, requestOptions);
    
    // Check for IP whitelisting errors (403)
    if (response.status === 403) {
      const errorData = await response.json()
        .catch(() => ({}));
      if (
        errorData.code === 'IP_BLOCKED' || 
        errorData.message?.includes('whitelisted') ||
        errorData.message?.includes('not allowed')
      ) {
        throw {
          type: 'IP_BLOCKED',
          message: 'Access denied. Your IP address is not whitelisted. Contact your administrator.',
          severity: 'CRITICAL'
        };
      }
    }
    
    let responseData = await response.json();

    // Apply data masking if enabled
    const dataMaskingEnabled = API_CONFIG?.security?.dataMasking?.enabled === true;
    if (applyMasking && dataMaskingEnabled) {
      responseData = applyDataMasking(responseData);
    }

    // Apply security middleware after response
    await securityMiddleware.afterResponse(response, requestConfig);

    // Cache successful GET requests
    if (useCache && method === 'GET') {
      setCachedResponse(cacheKey, responseData);
    }

    auditService.logSecurityEvent('API_REQUEST_SUCCESS', {
      endpoint,
      status: response.status,
      source: 'api'
    });

    return {
      data: responseData,
      cached: false,
      source: 'api',
      status: response.status
    };

  } catch (error) {
    const errorInfo = classifyError(error, endpoint);
    
    console.error(`❌ API Error for ${endpoint}:`, errorInfo);
    
    // Log security event for API error
    auditService.logSecurityEvent('API_REQUEST_ERROR', {
      endpoint,
      error: error.message,
      errorType: errorInfo.type || 'unknown'
    });
    
    // No fallback to mock data - throw error instead
    
    throw {
      ...errorInfo,
      originalError: error,
      endpoint,
      source: 'api'
    };
  }
};

/**
 * Enhanced API Service Methods organized by TFL features
 */
export const apiService = {
  // Health Check
  health: {
    check: () => apiRequest(API_ENDPOINTS.HEALTH.base, { useCache: true }),
    prometheus: () => apiRequest(API_ENDPOINTS.HEALTH.PROMETHEUS, { useCache: true }),
    grafana: () => apiRequest(API_ENDPOINTS.HEALTH.GRAFANA, { useCache: true }),
    elk: () => apiRequest(API_ENDPOINTS.HEALTH.ELK, { useCache: true }),
    npciConnectivity: () => apiRequest(API_ENDPOINTS.HEALTH.NPCI_CONNECTIVITY, { 
      useCache: true,
      timeout: API_CONFIG.timeouts.liveStream
    })
  },

  // Authentication
  auth: {
    login: (credentials) => apiRequest(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      data: credentials,
      fallbackToMock: false,
      timeout: API_CONFIG.timeouts.default
    }),
    logout: () => apiRequest(API_ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
      fallbackToMock: false
    }),
    refresh: () => apiRequest(API_ENDPOINTS.AUTH.REFRESH, {
      method: 'POST',
      fallbackToMock: false
    }),
    verify: () => apiRequest(API_ENDPOINTS.AUTH.VERIFY, {
      useCache: true,
      fallbackToMock: false
    })
  },

  // Executive Summary KPIs
  kpi: {
    getExecutiveSummary: () => apiRequest(API_ENDPOINTS.KPI.METRICS, {
      useCache: true,
      timeout: API_CONFIG.timeouts.default
    }),
    getSuccessRate: () => apiRequest(API_ENDPOINTS.KPI.SUCCESS_RATE, {
      useCache: true
    }),
    getAverageTime: () => apiRequest(API_ENDPOINTS.KPI.AVG_TIME, {
      useCache: true
    }),
    getTotalTransactions: () => apiRequest(API_ENDPOINTS.KPI.TOTAL_TRANSACTIONS, {
      useCache: true
    }),
    getPendingTransactions: () => apiRequest(API_ENDPOINTS.KPI.PENDING_TRANSACTIONS, {
      useCache: true
    }),
    getErrorRate: () => apiRequest(API_ENDPOINTS.KPI.ERROR_RATE, {
      useCache: true
    }),
    getTimeoutRate: () => apiRequest(API_ENDPOINTS.KPI.TIMEOUT_RATE, {
      useCache: true
    }),
    getRealtime: () => apiRequest(API_ENDPOINTS.KPI.REALTIME, {
      useCache: false,
      timeout: API_CONFIG.timeouts.liveStream
    }),
    getHistorical: (params) => apiRequest(API_ENDPOINTS.KPI.HISTORICAL, {
      params,
      useCache: true
    }),
    getSLA: () => apiRequest(API_ENDPOINTS.KPI.SLA, {
      useCache: true
    })
  },

  // Transaction Flow Matrix (BANL, IMPS, UPI)
  transactions: {
    getList: (params = {}) => apiRequest(API_ENDPOINTS.TRANSACTIONS.LIST, {
      params,
      useCache: true,
      applyMasking: true
    }),
    getLive: () => apiRequest(API_ENDPOINTS.TRANSACTIONS.LIVE, {
      useCache: false,
      applyMasking: true,
      timeout: API_CONFIG.timeouts.liveStream
    }),
    getLiveStream: () => apiRequest(API_ENDPOINTS.TRANSACTIONS.LIVE, {
      useCache: false,
      applyMasking: true,
      timeout: API_CONFIG.timeouts.liveStream
    }),
    getById: (id) => apiRequest(API_ENDPOINTS.TRANSACTIONS.BY_ID(id), {
      useCache: true,
      applyMasking: true
    }),
    getByRRN: (rrn) => apiRequest(API_ENDPOINTS.TRANSACTIONS.BY_RRN(rrn), {
      useCache: true,
      applyMasking: true
    }),
    getTrace: (id) => apiRequest(API_ENDPOINTS.TRANSACTIONS.TRACE(id), {
      useCache: true
    }),
    getFlowMatrix: () => apiRequest(API_ENDPOINTS.TRANSACTIONS.FLOW_MATRIX, {
      useCache: true,
      timeout: API_CONFIG.timeouts.default
    }),
    getBANLMatrix: () => apiRequest(API_ENDPOINTS.FLOW.BANL, {
      useCache: true
    }),
    getIMPSMatrix: () => apiRequest(API_ENDPOINTS.FLOW.IMPS, {
      useCache: true
    }),
    getUPIMatrix: () => apiRequest(API_ENDPOINTS.FLOW.UPI, {
      useCache: true
    }),
    search: (query) => apiRequest(API_ENDPOINTS.TRANSACTIONS.SEARCH, {
      method: 'POST',
      data: query,
      applyMasking: true
    }),
    export: (params) => apiRequest(API_ENDPOINTS.TRANSACTIONS.EXPORT, {
      method: 'POST',
      data: params,
      fallbackToMock: false
    })
  },

  // Failure Intelligence & Error Codes
  failureIntelligence: {
    getErrorCategories: () => apiRequest(API_ENDPOINTS.FAILURE_INTELLIGENCE.ERROR_CATEGORIES, {
      useCache: true
    }),
    getTopErrorCodes: () => apiRequest(API_ENDPOINTS.FAILURE_INTELLIGENCE.TOP_ERROR_CODES, {
      useCache: true
    }),
    getErrorAnalysis: () => apiRequest(API_ENDPOINTS.FAILURE_INTELLIGENCE.ERROR_ANALYSIS, {
      useCache: true
    }),
    getErrorTrends: (params) => apiRequest(API_ENDPOINTS.FAILURE_INTELLIGENCE.ERROR_TRENDS, {
      params,
      useCache: true
    }),
    getErrorDetails: (code) => apiRequest(API_ENDPOINTS.FAILURE_INTELLIGENCE.ERROR_DETAILS(code), {
      useCache: true
    })
  },

  // Bank-wise Tenant View
  banks: {
    getList: () => apiRequest(API_ENDPOINTS.BANKS.LIST, {
      useCache: true
    }),
    getStatus: () => apiRequest(API_ENDPOINTS.BANKS.STATUS, {
      useCache: true
    }),
    getMetrics: (bankId) => apiRequest(API_ENDPOINTS.BANKS.METRICS(bankId), {
      useCache: true
    }),
    getTenantData: (bankId) => apiRequest(API_ENDPOINTS.BANKS.TENANT_DATA(bankId), {
      useCache: true
    }),
    getTenantView: () => apiRequest(API_ENDPOINTS.BANKS.TENANT_VIEW, {
      useCache: true
    }),
    getConnectivity: () => apiRequest(API_ENDPOINTS.BANKS.CONNECTIVITY, {
      useCache: true
    }),
    getBankSummary: (bankId) => apiRequest(API_ENDPOINTS.BANKS.BANK_SUMMARY(bankId), {
      useCache: true
    })
  },

  // NPCI Connectivity Health Checks
  npci: {
    getStatus: () => apiRequest(API_ENDPOINTS.NPCI.STATUS, {
      useCache: true,
      timeout: API_CONFIG.timeouts.healthChecks
    }),
    getHistory: (params) => apiRequest(API_ENDPOINTS.NPCI.HISTORY, {
      params,
      useCache: true
    }),
    getHealth: () => apiRequest(API_ENDPOINTS.NPCI.HEALTH, {
      useCache: true,
      timeout: API_CONFIG.timeouts.healthChecks
    }),
    getMetrics: () => apiRequest(API_ENDPOINTS.NPCI.METRICS, {
      useCache: true
    }),
    getAlerts: () => apiRequest(API_ENDPOINTS.NPCI.ALERTS, {
      useCache: false
    }),
    getConnectivityCheck: () => apiRequest(API_ENDPOINTS.NPCI.CONNECTIVITY_CHECK, {
      useCache: false,
      timeout: API_CONFIG.timeouts.healthChecks
    }),
    getHeartbeat: () => apiRequest(API_ENDPOINTS.NPCI.HEARTBEAT, {
      useCache: false,
      timeout: API_CONFIG.timeouts.healthChecks
    }),
    getSocketStatus: () => apiRequest(API_ENDPOINTS.NPCI.SOCKET_STATUS, {
      useCache: false,
      timeout: API_CONFIG.timeouts.liveStream
    }),
    getTLSHandshake: () => apiRequest(API_ENDPOINTS.NPCI.TLS_HANDSHAKE, {
      useCache: false,
      timeout: API_CONFIG.timeouts.healthChecks
    }),
    getPacketLoss: () => apiRequest(API_ENDPOINTS.NPCI.PACKET_LOSS, {
      useCache: false,
      timeout: API_CONFIG.timeouts.healthChecks
    }),
    getRTTMetrics: () => apiRequest(API_ENDPOINTS.NPCI.RTT_METRICS, {
      useCache: false,
      timeout: API_CONFIG.timeouts.healthChecks
    })
  },

  // Alerts
  alerts: {
    getList: (params = {}) => apiRequest(API_ENDPOINTS.ALERTS.LIST, {
      params,
      useCache: true
    }),
    getActive: () => apiRequest(API_ENDPOINTS.ALERTS.ACTIVE, {
      useCache: false,
      timeout: API_CONFIG.timeouts.alerts
    }),
    getHistory: (params) => apiRequest(API_ENDPOINTS.ALERTS.HISTORY, {
      params,
      useCache: true
    }),
    acknowledge: (id) => apiRequest(API_ENDPOINTS.ALERTS.ACKNOWLEDGE(id), {
      method: 'POST',
      fallbackToMock: false
    }),
    resolve: (id) => apiRequest(API_ENDPOINTS.ALERTS.RESOLVE(id), {
      method: 'POST',
      fallbackToMock: false
    })
  },

  // Logs
  logs: {
    getList: (params = {}) => apiRequest(API_ENDPOINTS.LOGS.LIST, {
      params,
      useCache: true
    }),
    search: (query) => apiRequest(API_ENDPOINTS.LOGS.SEARCH, {
      method: 'POST',
      data: query
    }),
    getByCorrelation: (key) => apiRequest(API_ENDPOINTS.LOGS.BY_CORRELATION(key), {
      useCache: true
    })
  }
};

// Export the main apiRequest function for custom calls
export default apiRequest;
