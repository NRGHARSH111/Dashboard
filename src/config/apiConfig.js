/**
 * TFL Switch Ecosystem — Centralized API Configuration
 * ALL backend endpoints are defined here.
 * To change any URL, update ONLY this file.
 */

const ENV = import.meta.env;

export const BASE_URL    = ENV.VITE_API_BASE_URL || 'http://localhost:8080';
export const WS_BASE_URL = ENV.VITE_WS_BASE_URL  || 'ws://localhost:8080';

export const buildURL         = (path) => `${BASE_URL}${path}`;
export const buildWSURL       = (path) => `${WS_BASE_URL}${path}`;
export const buildCompleteURL = (path) => {
  if (!path) return '';
  if (path.startsWith('ws://') || path.startsWith('wss://')) return path;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
};

export const API_ENDPOINTS = {
  KPI: {
    METRICS:  '/api/metrics/kpis',
    REALTIME: '/api/metrics/kpis/realtime',
  },
  FLOW: {
    BANL: '/api/metrics/flow?switch=BANL',
    IMPS: '/api/metrics/flow?switch=IMPS',
    UPI:  '/api/metrics/flow?switch=UPI',
  },
  HEATMAP: {
    DATA: '/api/metrics/heatmap',
  },
  TRANSACTIONS: {
    LIVE:  '/api/transactions/live',
    LIST:  '/api/transactions/list',
    TRACE: '/api/trace',
  },
  LOGS: {
    SEARCH: '/api/logs/search',
    AUDIT:  '/api/logs/audit',
    LIVE:   '/api/logs/live',
  },
  NPCI: {
    STATUS: '/api/npci/status',
    LINKS: {
      PRIMARY:   '/npci/primary',
      SECONDARY: '/npci/secondary',
      BACKUP:    '/npci/backup',
      WEBSOCKET: '/npci/ws',
    },
  },
  ALERTS: {
    ACTIVE:  '/api/alerts/active',
    NOTIFY:  '/api/alerts/notify',
    WEBHOOK: '/webhook/alerts',
  },
  BANKS: {
    LIST:    '/api/banks',
    METRICS: '/api/banks',
  },
  AUTH: {
    LOGIN:      '/api/auth/login',
    OTP_SEND:   '/api/auth/otp/send',
    OTP_VERIFY: '/api/auth/otp/verify',
  },
  EXPORT: {
    CSV:   '/api/export/csv',
    EXCEL: '/api/export/excel',
    PDF:   '/api/export/pdf',
    JSON:  '/api/export/json',
  },
  ERRORS: {
    SUMMARY:   '/api/errors/summary',
    TOP_CODES: '/api/errors/top-codes',
  },
  HEALTH: {
    CHECK: '/api/health',
  },
};

export const WS_ENDPOINTS = {
  LIVE_FEED: '/ws/live-feed',
  ALERTS:    '/ws/alerts',
  NPCI_LOGS: '/ws/npci-logs',
};

export const REFRESH_INTERVALS = {
  LIVE_FEED: 1000,
  KPI:       5000,
  FLOW:      5000,
  NPCI:      3000,
  HEATMAP:   10000,
  ALERTS:    3000,
  REPORTS:   60000,
};

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

export const STATUS_COLORS = {
  SUCCESS:   '#22c55e',
  PENDING:   '#3b82f6',
  TIMEOUT:   '#f97316',
  FAILURE:   '#ef4444',
  LINK_DOWN: '#991b1b',
};

export const API = {
  kpiMetrics:       () => buildURL(API_ENDPOINTS.KPI.METRICS),
  kpiRealtime:      () => buildURL(API_ENDPOINTS.KPI.REALTIME),
  flowBanl:         () => buildURL(API_ENDPOINTS.FLOW.BANL),
  flowImps:         () => buildURL(API_ENDPOINTS.FLOW.IMPS),
  flowUpi:          () => buildURL(API_ENDPOINTS.FLOW.UPI),
  heatmap:          () => buildURL(API_ENDPOINTS.HEATMAP.DATA),
  transactionsLive: () => buildURL(API_ENDPOINTS.TRANSACTIONS.LIVE),
  transactionsList: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return buildURL(`${API_ENDPOINTS.TRANSACTIONS.LIST}${q ? `?${q}` : ''}`);
  },
  trace:            (txnId) => buildURL(`${API_ENDPOINTS.TRANSACTIONS.TRACE}/${txnId}`),
  logsSearch:       (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return buildURL(`${API_ENDPOINTS.LOGS.SEARCH}${q ? `?${q}` : ''}`);
  },
  logsAudit:        (page = 1, limit = 10) =>
    buildURL(`${API_ENDPOINTS.LOGS.AUDIT}?page=${page}&limit=${limit}`),
  logsLive:         (from) => buildURL(`${API_ENDPOINTS.LOGS.LIVE}?from=${from}`),
  npciStatus:       () => buildURL(API_ENDPOINTS.NPCI.STATUS),
  alertsActive:     () => buildURL(API_ENDPOINTS.ALERTS.ACTIVE),
  alertsNotify:     () => buildURL(API_ENDPOINTS.ALERTS.NOTIFY),
  alertsWebhook:    () => buildURL(API_ENDPOINTS.ALERTS.WEBHOOK),
  banksList:        () => buildURL(API_ENDPOINTS.BANKS.LIST),
  bankMetrics:      (bankId) => buildURL(`${API_ENDPOINTS.BANKS.METRICS}/${bankId}/metrics`),
  authLogin:        () => buildURL(API_ENDPOINTS.AUTH.LOGIN),
  authOtpSend:      () => buildURL(API_ENDPOINTS.AUTH.OTP_SEND),
  authOtpVerify:    () => buildURL(API_ENDPOINTS.AUTH.OTP_VERIFY),
  exportCsv:        (type, from, to) =>
    buildURL(`${API_ENDPOINTS.EXPORT.CSV}?type=${type}${from?`&from=${from}`:''}${to?`&to=${to}`:''}`),
  exportExcel:      (type) => buildURL(`${API_ENDPOINTS.EXPORT.EXCEL}?type=${type}`),
  exportPdf:        (type) => buildURL(`${API_ENDPOINTS.EXPORT.PDF}?type=${type}`),
  exportJson:       (type) => buildURL(`${API_ENDPOINTS.EXPORT.JSON}?type=${type}`),
  errorsSummary:    () => buildURL(API_ENDPOINTS.ERRORS.SUMMARY),
  errorsTopCodes:   () => buildURL(API_ENDPOINTS.ERRORS.TOP_CODES),
  health:           () => buildURL(API_ENDPOINTS.HEALTH.CHECK),
  wsLiveFeed:       () => buildWSURL(WS_ENDPOINTS.LIVE_FEED),
  wsAlerts:         () => buildWSURL(WS_ENDPOINTS.ALERTS),
  wsNpciLogs:       () => buildWSURL(WS_ENDPOINTS.NPCI_LOGS),
};

export default API;
