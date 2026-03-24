/**
 * Centralized API Configuration
 * Manages all backend endpoints and environment-based configuration
 */

// Environment-based base URLs
const API_BASE_URLS = {
  development: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  production: import.meta.env.VITE_API_BASE_URL || 'https://api.tflmonitoring.com/api',
  test: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'
};

// WebSocket URLs
const WS_URLS = {
  development: import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws',
  production: import.meta.env.VITE_WS_URL || 'wss://api.tflmonitoring.com/ws',
  test: import.meta.env.VITE_WS_URL || 'ws://localhost:8081/ws'
};

// Get current environment
const getCurrentEnvironment = () => {
  return import.meta.env.MODE || 'development';
};

// Get base URL for current environment
const getBaseURL = () => {
  const env = getCurrentEnvironment();
  return API_BASE_URLS[env];
};

// Get WebSocket URL for current environment
const getWSURL = () => {
  const env = getCurrentEnvironment();
  return WS_URLS[env];
};

// API Endpoints Configuration
export const API_ENDPOINTS = {
  // Health Check
  HEALTH: {
    base: '/health',
    methods: ['GET'],
    PROMETHEUS: '/health/prometheus',
    GRAFANA: '/health/grafana',
    ELK: '/health/elk',
    NPCI_CONNECTIVITY: '/health/npci-connectivity'
  },

  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    MFA_VERIFY: '/auth/mfa/verify',
    MFA_SEND: '/auth/mfa/send'
  },

  // KPI Data
  KPI: {
    BASE: '/kpi',
    METRICS: '/kpi/metrics',
    REALTIME: '/kpi/realtime',
    HISTORICAL: '/kpi/historical',
    SLA: '/kpi/sla',
    PERFORMANCE: '/kpi/performance',
    SUCCESS_RATE: '/kpi/success-rate',
    AVG_TIME: '/kpi/avg-time',
    TOTAL_TRANSACTIONS: '/kpi/total-transactions',
    PENDING_TRANSACTIONS: '/kpi/pending-transactions',
    ERROR_RATE: '/kpi/error-rate',
    TIMEOUT_RATE: '/kpi/timeout-rate'
  },

  // Transactions
  TRANSACTIONS: {
    BASE: '/transactions',
    LIST: '/transactions/list',
    LIVE: '/transactions/live',
    BY_ID: (id) => `/transactions/${id}`,
    BY_RRN: (rrn) => `/transactions/rrn/${rrn}`,
    TRACE: (id) => `/transactions/${id}/trace`,
    FLOW_MATRIX: '/transactions/flow-matrix',
    SEARCH: '/transactions/search',
    EXPORT: '/transactions/export'
  },

  // Flow Metrics
  FLOW: {
    BANL: '/metrics/flow?switch=BANL',
    IMPS: '/metrics/flow?switch=IMPS',
    UPI:  '/metrics/flow?switch=UPI',
  },

  // Heatmap Data
  HEATMAP: {
    DATA: '/metrics/heatmap',
  },

  // Failure Intelligence
  FAILURE_INTELLIGENCE: {
    ERROR_CATEGORIES: '/failure-intelligence/categories',
    TOP_ERROR_CODES: '/failure-intelligence/top-codes',
    ERROR_ANALYSIS: '/failure-intelligence/analysis',
    ERROR_TRENDS: '/failure-intelligence/trends',
    ERROR_DETAILS: (code) => `/failure-intelligence/details/${code}`
  },

  // Alerts
  ALERTS: {
    BASE: '/alerts',
    LIST: '/alerts/list',
    ACTIVE: '/alerts/active',
    HISTORY: '/alerts/history',
    CREATE_RULE: '/alerts/rules',
    UPDATE_RULE: (id) => `/alerts/rules/${id}`,
    DELETE_RULE: (id) => `/alerts/rules/${id}`,
    RULES: '/alerts/rules',
    ACKNOWLEDGE: (id) => `/alerts/${id}/acknowledge`,
    RESOLVE: (id) => `/alerts/${id}/resolve`,
    NOTIFY: '/alerts/notify',
    WEBHOOK: '/webhook/alerts'
  },

  // Logs
  LOGS: {
    BASE: '/logs',
    LIST: '/logs/list',
    SEARCH: '/logs/search',
    BY_CORRELATION: (key) => `/logs/correlation/${key}`,
    BY_RRN: (rrn) => `/logs/rrn/${rrn}`,
    BY_UTR: (utr) => `/logs/utr/${utr}`,
    BY_TXN_ID: (txnId) => `/logs/txn/${txnId}`,
    AGGREGATION: '/logs/aggregation',
    EXPORT: '/logs/export'
  },

  // NPCI Connectivity
  NPCI: {
    BASE: '/npci/status',
    HISTORY: '/npci/history',
    HEALTH: '/npci/health',
    METRICS: '/npci/metrics',
    ALERTS: '/npci/alerts',
    // TFL Section 11: NPCI TCP/IP Links
    LINKS: {
      PRIMARY: '/npci/links/primary',
      SECONDARY: '/npci/links/secondary', 
      BACKUP: '/npci/links/backup',
      STATUS: '/npci/links/status',
      WEBSOCKET: '/npci/links/stream'
    },
    CONNECTIVITY_CHECK: '/npci/connectivity-check',
    HEARTBEAT: '/npci/heartbeat',
    SOCKET_STATUS: '/npci/socket-status',
    TLS_HANDSHAKE: '/npci/tls-handshake',
    PACKET_LOSS: '/npci/packet-loss',
    RTT_METRICS: '/npci/rtt-metrics'
  },

  // Banks
  BANKS: {
    LIST: '/banks/list',
    STATUS: '/banks/status',
    METRICS: (bankId) => `/banks/${bankId}/metrics`,
    TENANT_DATA: (bankId) => `/banks/${bankId}/tenant`,
    TENANT_VIEW: '/banks/tenant-view',
    CONNECTIVITY: '/banks/connectivity',
    BANK_SUMMARY: (bankId) => `/banks/${bankId}/summary`
  },

  // SLA Configuration
  SLA: {
    CONFIG: '/sla/config',
    RULES: '/sla/rules',
    UPDATE_RULE: (id) => `/sla/rules/${id}`,
    BREACHES: '/sla/breaches',
    REPORT: '/sla/report',
    THRESHOLDS: '/sla/thresholds'
  },

  // Compliance & Audit
  COMPLIANCE: {
    CONTROLS: '/compliance/controls',
    AUDIT_LOGS: '/compliance/audit',
    REPORTS: '/compliance/reports',
    STATUS: '/compliance/status'
  },

  // Export
  EXPORT: {
    CSV: '/export/csv',
    EXCEL: '/export/excel',
    PDF: '/export/pdf',
    JSON: '/export/json'
  },

  // Configuration
  CONFIG: {
    GLOBAL: '/config/global',
    USER: '/config/user',
    DASHBOARD: '/config/dashboard',
    REFRESH_RATES: '/config/refresh-rates'
  }
};

// WebSocket Endpoints
export const WS_ENDPOINTS = {
  LIVE_FEED: '/live-feed',
  ALERTS:    '/alerts',
  NPCI_LOGS: '/npci-logs',
};

// HTTP Methods Configuration
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH'
};

// Content Types
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded'
};

// API Configuration Object
export const API_CONFIG = {
  // Base configuration
  baseURL: getBaseURL(),
  wsURL: getWSURL(),
  environment: getCurrentEnvironment(),
  
  // Timeouts (in milliseconds)
  timeouts: {
    default: 30000,      // 30 seconds
    upload: 300000,      // 5 minutes
    download: 600000,    // 10 minutes
    websocket: 10000,     // 10 seconds
    liveStream: 5000,     // 5 seconds for live data
    healthChecks: 10000    // 10 seconds for health checks
  },
  
  // Retry configuration
  retry: {
    maxAttempts: 3,
    delay: 1000,        // 1 second
    backoffFactor: 2
  },
  
  // Cache configuration
  cache: {
    enabled: true,
    ttl: 300000         // 5 minutes
  },
  
  // Security configuration
  security: {
    requireAuth: true,
    dataMasking: {
      enabled: true,
      fields: ['account', 'rrn', 'mobile', 'email', 'pan', 'accountnumber', 'mobilenumber']
    }
  }
};

// Refresh Intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  LIVE_FEED: 1000,
  KPI:       5000,
  FLOW:      5000,
  NPCI:      3000,
  HEATMAP:   10000,
  ALERTS:    3000,
  REPORTS:   60000,
};

// SLA Thresholds
export const SLA_THRESHOLDS = {
  SUCCESS_RATE_MIN:   99.5,
  AVG_LATENCY_MAX:    200,
  PENDING_TXN_MAX:    0.2,
  TIMEOUT_RATE_MAX:   0.1,
  RTT_MAX:            200,
  PACKET_LOSS_MAX:    1,
  LINK_DOWN_CRITICAL: 10,
  LINK_DOWN_HIGH:     15,
  LINK_DOWN_MEDIUM:   30,
  HEARTBEAT_MISS_MAX: 3,
};

// Dynamic URL Builder
export const buildURL = (endpoint, params = {}) => {
  let url = `${API_CONFIG.baseURL}${endpoint}`;
  
  // Replace path parameters (e.g., /transactions/{id})
  Object.keys(params).forEach(key => {
    url = url.replace(`{${key}}`, params[key]);
  });
  
  return url;
};

// Query Parameter Builder
export const buildQueryParams = (params = {}) => {
  const searchParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, item));
      } else {
        searchParams.append(key, value);
      }
    }
  });
  
  return searchParams.toString();
};

// Complete URL Builder with Query Parameters
export const buildCompleteURL = (endpoint, pathParams = {}, queryParams = {}) => {
  const url = buildURL(endpoint, pathParams);
  const queryString = buildQueryParams(queryParams);
  return queryString ? `${url}?${queryString}` : url;
};

// Environment Detection Helpers
export const isDevelopment = () => getCurrentEnvironment() === 'development';
export const isProduction = () => getCurrentEnvironment() === 'production';
export const isTest = () => getCurrentEnvironment() === 'test';

// Export default configuration
export default {
  API_ENDPOINTS,
  WS_ENDPOINTS,
  REFRESH_INTERVALS,
  SLA_THRESHOLDS,
  API_CONFIG,
  HTTP_METHODS,
  CONTENT_TYPES,
  buildURL,
  buildQueryParams,
  buildCompleteURL,
  isDevelopment,
  isProduction,
  isTest,
  getBaseURL,
  getWSURL
};
