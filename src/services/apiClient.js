/**
 * Enhanced API Client for TFL Monitoring Dashboard
 * Provides unified interface for all API calls with intelligent fallback to mock data
 * Supports TFL-specific endpoints, security compliance, and error handling
 */

import API, { API_ENDPOINTS, WS_ENDPOINTS, REFRESH_INTERVALS, SLA_THRESHOLDS, buildCompleteURL } from '../config/apiConfig';
import { mockDataService } from './mockDataService';
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
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    if (retryCount < 3 && 
        (error.name === 'TypeError' || error.name === 'TimeoutError')) {
      
      const delay = 1000 * Math.pow(2, retryCount);
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
  
  const maskingFields = ['accountnumber', 'account', 'rrn', 'mobilenumber', 'mobile', 'phone', 'email', 'pan'];
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
    'X-TFL-Security-Level': 'HIGH'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-TFL-Auth-Token'] = token;
  }
  
  // Add environment-specific headers
  headers['X-TFL-Environment'] = 'development';
  
  // Add compliance headers
  headers['X-TFL-Data-Masking'] = 'ENABLED';
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
    timeout = 30000,
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
  if (!skipSecurity) {
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

  // Check if backend is available
  const backendAvailable = await isBackendAvailable();
  
  if (!backendAvailable && fallbackToMock) {
    console.warn(`🔄 Using mock data for ${endpoint} (backend unavailable)`);
    auditService.logSecurityEvent('API_FALLBACK_TO_MOCK', { endpoint, reason: 'backend_unavailable' });
    const mockData = mockDataGenerator ? mockDataGenerator() : mockDataService.getFallbackData(endpoint);
    const maskedData = applyMasking ? applyDataMasking(mockData) : mockData;
    return { data: maskedData, cached: false, source: 'mock' };
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
    let responseData = await response.json();

    // Apply data masking if enabled
    if (applyMasking) {
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
    
    // Fallback to mock data if enabled and available
    if (fallbackToMock && mockDataGenerator) {
      console.warn(`🔄 Falling back to mock data for ${endpoint}`);
      auditService.logSecurityEvent('API_FALLBACK_TO_MOCK', { endpoint, reason: 'api_error' });
      const mockData = mockDataGenerator();
      const maskedData = applyMasking ? applyDataMasking(mockData) : mockData;
      return { data: maskedData, cached: false, source: 'fallback', error: errorInfo };
    }
    
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
    check: () => apiRequest(API_ENDPOINTS.HEALTH.CHECK, { useCache: true }),
  },

  // Authentication
  auth: {
    login: (credentials) => apiRequest(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      data: credentials,
      fallbackToMock: false,
      timeout: 30000
    }),
    otpSend: (mobile) => apiRequest(API_ENDPOINTS.AUTH.OTP_SEND, {
      method: 'POST',
      data: { mobile },
      fallbackToMock: false
    }),
    otpVerify: (mobile, otp) => apiRequest(API_ENDPOINTS.AUTH.OTP_VERIFY, {
      method: 'POST',
      data: { mobile, otp },
      fallbackToMock: false
    })
  },

  // Executive Summary KPIs
  kpi: {
    getMetrics: () => apiRequest(API_ENDPOINTS.KPI.METRICS, {
      useCache: true,
      mockDataGenerator: mockDataService.getKPIMetrics,
      timeout: 30000
    }),
    getRealtime: () => apiRequest(API_ENDPOINTS.KPI.REALTIME, {
      useCache: false,
      mockDataGenerator: mockDataService.getRealTimeKPI,
      timeout: 5000
    })
  },

  // Transaction Flow Matrix (BANL, IMPS, UPI)
  transactions: {
    getList: (params = {}) => apiRequest(API_ENDPOINTS.TRANSACTIONS.LIST, {
      params,
      useCache: true,
      applyMasking: true,
      mockDataGenerator: () => mockDataService.getTransactions(params)
    }),
    getLive: () => apiRequest(API_ENDPOINTS.TRANSACTIONS.LIVE, {
      useCache: false,
      applyMasking: true,
      mockDataGenerator: mockDataService.getLiveTransactions,
      timeout: 5000
    }),
    getTrace: (id) => apiRequest(API_ENDPOINTS.TRANSACTIONS.TRACE + '/' + id, {
      useCache: true,
      mockDataGenerator: () => mockDataService.getTransactionTrace(id)
    })
  },

  // Bank-wise Tenant View
  banks: {
    getList: () => apiRequest(API_ENDPOINTS.BANKS.LIST, {
      useCache: true,
      mockDataGenerator: mockDataService.getBanks
    }),
    getMetrics: (bankId) => apiRequest(API_ENDPOINTS.BANKS.METRICS + '/' + bankId + '/metrics', {
      useCache: true,
      mockDataGenerator: () => mockDataService.getBankMetrics(bankId)
    })
  },

  // NPCI Connectivity Health Checks
  npci: {
    getStatus: () => apiRequest(API_ENDPOINTS.NPCI.STATUS, {
      useCache: true,
      mockDataGenerator: mockDataService.getNPCISTatus,
      timeout: 10000
    })
  },

  // Alerts
  alerts: {
    getActive: () => apiRequest(API_ENDPOINTS.ALERTS.ACTIVE, {
      useCache: false,
      mockDataGenerator: mockDataService.getActiveAlerts,
      timeout: 5000
    }),
    notify: (alertData) => apiRequest(API_ENDPOINTS.ALERTS.NOTIFY, {
      method: 'POST',
      data: alertData,
      fallbackToMock: false
    })
  },

  // Logs
  logs: {
    search: (params) => apiRequest(API_ENDPOINTS.LOGS.SEARCH, {
      params,
      useCache: true,
      mockDataGenerator: () => mockDataService.searchLogs(params)
    }),
    audit: (page = 1, limit = 10) => apiRequest(API_ENDPOINTS.LOGS.AUDIT + '?page=' + page + '&limit=' + limit, {
      useCache: true,
      mockDataGenerator: () => mockDataService.getAuditLogs(page, limit)
    }),
    live: (from) => apiRequest(API_ENDPOINTS.LOGS.LIVE + '?from=' + from, {
      useCache: false,
      mockDataGenerator: () => mockDataService.getLiveLogs(from),
      timeout: 5000
    })
  }
};

// Export the main apiRequest function for custom calls
export default apiRequest;
