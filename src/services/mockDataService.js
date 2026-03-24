/**
 * Centralized Mock Data Service
 * Provides realistic mock data for all API endpoints when backend is unavailable
 */

import { API_ENDPOINTS } from '../config/apiConfig';

// Helper to generate random data within ranges
const random = (min, max, decimals = 0) => {
  const value = Math.random() * (max - min) + min;
  return decimals > 0 ? parseFloat(value.toFixed(decimals)) : Math.floor(value);
};

// Helper to generate random timestamps
const randomTimestamp = (hoursBack = 24) => {
  const now = new Date();
  const hours = random(0, hoursBack);
  return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
};

// Helper to generate random status
const randomStatus = () => {
  const statuses = ['SUCCESS', 'FAILED', 'TIMEOUT', 'PENDING'];
  const weights = [0.85, 0.08, 0.04, 0.03]; // 85% success rate
  const rand = Math.random();
  let cumulative = 0;
  
  for (let i = 0; i < statuses.length; i++) {
    cumulative += weights[i];
    if (rand <= cumulative) return statuses[i];
  }
  return statuses[0];
};

// Mock Banks Data
const BANKS = [
  { id: 'HDFC', name: 'HDFC Bank', code: 'HDFC0000001' },
  { id: 'ICICI', name: 'ICICI Bank', code: 'ICIC0000001' },
  { id: 'SBI', name: 'State Bank of India', code: 'SBIN0000001' },
  { id: 'KOTAK', name: 'Kotak Mahindra Bank', code: 'KKBK0000001' },
  { id: 'AXIS', name: 'Axis Bank', code: 'UTIB0000001' },
  { id: 'PNB', name: 'Punjab National Bank', code: 'PUNB0000001' }
];

// Mock Transaction Types
const TRANSACTION_TYPES = ['BANL', 'IMPS', 'UPI'];

/**
 * Mock Data Service
 */
export const mockDataService = {
  
  /**
   * Get fallback data based on endpoint
   */
  getFallbackData(endpoint) {
    const endpointMap = {
      [API_ENDPOINTS.KPI.METRICS]: this.getKPIMetrics(),
      [API_ENDPOINTS.TRANSACTIONS.LIST]: this.getTransactions(),
      [API_ENDPOINTS.TRANSACTIONS.FLOW_MATRIX]: this.getFlowMatrix(),
      [API_ENDPOINTS.NPCI.STATUS]: this.getNPCISTatus(),
      [API_ENDPOINTS.ALERTS.LIST]: this.getAlerts(),
      [API_ENDPOINTS.BANKS.LIST]: this.getBanks()
    };
    
    return endpointMap[endpoint] || { message: 'Mock data not available for this endpoint' };
  },

  /**
   * KPI and Metrics
   */
  getKPIMetrics: () => ({
    totalTxnToday: {
      value: random(2500000, 3500000),
      change: random(-15, 15, 1),
      trend: random(0, 1) > 0.5 ? 'up' : 'down'
    },
    successRate: {
      value: random(99.5, 99.95, 2),
      change: random(-0.5, 0.5, 2),
      trend: random(0, 1) > 0.5 ? 'up' : 'down'
    },
    avgLatency: {
      value: random(80, 200),
      change: random(-20, 20),
      trend: random(0, 1) > 0.5 ? 'down' : 'up'
    },
    pendingTxns: {
      value: random(0.01, 0.15, 2),
      change: random(-0.05, 0.05, 2),
      trend: random(0, 1) > 0.5 ? 'down' : 'up'
    },
    npciStatus: {
      value: random(0, 1) > 0.1 ? 'Connected' : 'Disconnected',
      change: 'Stable',
      trend: 'stable'
    }
  }),

  getRealTimeKPI: () => ({
    timestamp: new Date().toISOString(),
    metrics: {
      currentTPS: random(800, 1200),
      peakTPS: random(1400, 1800),
      activeConnections: random(450, 550),
      queueDepth: random(0, 50)
    }
  }),

  getHistoricalKPI: (params) => {
    const hours = params.hours || 24;
    const data = [];
    
    for (let i = hours; i >= 0; i--) {
      data.push({
        timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        transactions: random(80000, 120000),
        successRate: random(99.0, 99.9, 1),
        avgLatency: random(80, 150)
      });
    }
    
    return { data };
  },

  getSLAData: () => ({
    overall: random(99.5, 99.9, 2),
    components: {
      'Transaction Processing': random(99.8, 99.95, 2),
      'NPCI Connectivity': random(99.9, 99.99, 2),
      'Bank Settlement': random(99.7, 99.9, 2),
      'Alert System': random(99.95, 99.99, 2)
    },
    breaches: [
      {
        component: 'Transaction Processing',
        count: random(0, 5),
        avgResolutionTime: random(5, 30)
      }
    ]
  }),

  /**
   * Transactions
   */
  getTransactions: (params = {}) => {
    const limit = params.limit || 50;
    const transactions = [];
    
    for (let i = 0; i < limit; i++) {
      const bank = BANKS[random(0, BANKS.length - 1)];
      const type = TRANSACTION_TYPES[random(0, TRANSACTION_TYPES.length - 1)];
      
      transactions.push({
        id: `TXN${Date.now()}${i}`,
        rrn: `${Date.now()}${random(100000, 999999)}`,
        utr: `${random(100000000000, 999999999999)}`,
        timestamp: randomTimestamp(),
        type,
        amount: random(100, 100000),
        status: randomStatus(),
        bank: bank.name,
        bankCode: bank.code,
        latency: random(20, 500),
        errorCode: randomStatus() === 'FAILED' ? `ERR${random(1000, 9999)}` : null,
        errorMessage: randomStatus() === 'FAILED' ? 'Transaction failed due to timeout' : null
      });
    }
    
    return {
      data: transactions,
      pagination: {
        page: params.page || 1,
        limit,
        total: random(1000, 5000),
        hasMore: true
      }
    };
  },

  getLiveTransactions: () => {
    const transactions = [];
    for (let i = 0; i < 10; i++) {
      transactions.push(this.getTransactions({ limit: 1 }).data[0]);
    }
    return { data: transactions };
  },

  getTransactionById: (id) => ({
    id,
    rrn: `${Date.now()}${random(100000, 999999)}`,
    utr: `${random(100000000000, 999999999999)}`,
    timestamp: randomTimestamp(),
    type: TRANSACTION_TYPES[random(0, TRANSACTION_TYPES.length - 1)],
    amount: random(100, 100000),
    status: randomStatus(),
    bank: BANKS[random(0, BANKS.length - 1)].name,
    latency: random(20, 500),
    initiator: 'CUSTOMER',
    beneficiary: 'MERCHANT',
    channel: 'MOBILE_APP'
  }),

  getTransactionByRRN: (rrn) => this.getTransactionById(`TXN${rrn}`),

  getTransactionTrace: (id) => ({
    transactionId: id,
    steps: [
      {
        step: 1,
        component: 'API Gateway',
        status: 'SUCCESS',
        timestamp: randomTimestamp(0.1),
        duration: random(10, 50),
        details: 'Request received and validated'
      },
      {
        step: 2,
        component: 'Authorization Service',
        status: 'SUCCESS',
        timestamp: randomTimestamp(0.2),
        duration: random(20, 80),
        details: 'User authenticated successfully'
      },
      {
        step: 3,
        component: 'Transaction Engine',
        status: 'SUCCESS',
        timestamp: randomTimestamp(0.3),
        duration: random(50, 150),
        details: 'Transaction processed'
      },
      {
        step: 4,
        component: 'NPCI Interface',
        status: randomStatus(),
        timestamp: randomTimestamp(0.4),
        duration: random(100, 300),
        details: randomStatus() === 'SUCCESS' ? 'Sent to NPCI successfully' : 'NPCI timeout occurred'
      }
    ]
  }),

  getFlowMatrix: () => {
    const types = ['banl', 'imps', 'upi'];
    const stages = ['host', 'tfl', 'npci', 'return'];
    const matrix = {};
    
    types.forEach(type => {
      matrix[type] = {};
      stages.forEach(stage => {
        matrix[type][stage] = {
          count: random(800000, 1200000),
          avgTime: random(20, 200, 1),
          failPercent: random(0.01, 0.2, 2)
        };
      });
    });
    
    return matrix;
  },

  searchTransactions: (query) => {
    const results = this.getTransactions({ limit: 20 });
    results.data = results.data.filter(txn => 
      txn.rrn.includes(query.rrn || '') ||
      txn.utr.includes(query.utr || '') ||
      txn.bank.toLowerCase().includes(query.bank?.toLowerCase() || '')
    );
    return results;
  },

  /**
   * Alerts
   */
  getAlerts: (params = {}) => {
    const limit = params.limit || 20;
    const alerts = [];
    
    for (let i = 0; i < limit; i++) {
      alerts.push({
        id: `ALERT${Date.now()}${i}`,
        type: ['PERFORMANCE', 'AVAILABILITY', 'ERROR_RATE', 'SECURITY'][random(0, 3)],
        severity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][random(0, 3)],
        title: [
          'High latency detected in UPI transactions',
          'NPCI connection unstable',
          'Error rate exceeding threshold',
          'Unusual transaction pattern detected'
        ][random(0, 3)],
        description: 'Automated alert triggered by monitoring system',
        timestamp: randomTimestamp(),
        status: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'][random(0, 2)],
        source: ['SYSTEM', 'MANUAL', 'SCHEDULED'][random(0, 2)],
        metadata: {
          component: ['API Gateway', 'Transaction Engine', 'NPCI Interface'][random(0, 2)],
          threshold: random(80, 95),
          currentValue: random(95, 99)
        }
      });
    }
    
    return { data: alerts };
  },

  getActiveAlerts: () => {
    const alerts = this.getAlerts({ limit: 10 });
    alerts.data = alerts.data.filter(alert => alert.status === 'ACTIVE');
    return alerts;
  },

  getAlertHistory: (params) => {
    const days = params.days || 7;
    const alerts = [];
    
    for (let i = 0; i < days * 5; i++) {
      alerts.push(this.getAlerts({ limit: 1 }).data[0]);
    }
    
    return { data: alerts };
  },

  /**
   * Logs
   */
  getLogs: (params = {}) => {
    const limit = params.limit || 100;
    const logs = [];
    
    for (let i = 0; i < limit; i++) {
      logs.push({
        id: `LOG${Date.now()}${i}`,
        timestamp: randomTimestamp(),
        level: ['INFO', 'WARN', 'ERROR', 'DEBUG'][random(0, 3)],
        component: ['API Gateway', 'Auth Service', 'Transaction Engine', 'NPCI Interface'][random(0, 3)],
        message: [
          'Transaction processed successfully',
          'Authentication token validated',
          'Database connection established',
          'Cache miss for key',
          'Rate limit threshold reached'
        ][random(0, 4)],
        correlationId: `CORR${random(100000, 999999)}`,
        userId: `USER${random(1000, 9999)}`,
        metadata: {
          ip: '192.168.1.' + random(1, 254),
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          requestId: `REQ${random(10000, 99999)}`
        }
      });
    }
    
    return { data: logs };
  },

  searchLogs: (query) => {
    const results = this.getLogs({ limit: 50 });
    results.data = results.data.filter(log => 
      log.message.toLowerCase().includes(query.message?.toLowerCase() || '') ||
      log.component.toLowerCase().includes(query.component?.toLowerCase() || '') ||
      log.level === query.level
    );
    return results;
  },

  getLogsByCorrelation: (key) => {
    const logs = this.getLogs({ limit: 20 });
    logs.data = logs.data.map(log => ({ ...log, correlationId: key }));
    return logs;
  },

  /**
   * NPCI
   */
  getNPCISTatus: () => ({
    status: random(0, 1) > 0.1 ? 'CONNECTED' : 'DISCONNECTED',
    uptime: random(99.5, 99.9, 2),
    lastPing: new Date().toISOString(),
    connectionDetails: {
      host: 'npci.example.com',
      port: 443,
      protocol: 'HTTPS',
      version: '2.1.0'
    },
    metrics: {
      avgResponseTime: random(100, 300),
      successRate: random(99.8, 99.99, 2),
      activeConnections: random(10, 50),
      queuedRequests: random(0, 100)
    }
  }),

  getNPCIHistory: (params) => {
    const hours = params.hours || 24;
    const data = [];
    
    for (let i = hours; i >= 0; i--) {
      data.push({
        timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        status: random(0, 1) > 0.05 ? 'CONNECTED' : 'DISCONNECTED',
        responseTime: random(100, 300),
        successRate: random(99.5, 99.99, 2)
      });
    }
    
    return { data };
  },

  getNPCIHealth: () => ({
    overall: 'HEALTHY',
    components: {
      connectivity: { status: 'HEALTHY', responseTime: random(100, 200) },
      authentication: { status: 'HEALTHY', responseTime: random(50, 100) },
      transactionProcessing: { status: 'HEALTHY', responseTime: random(200, 400) }
    },
    lastCheck: new Date().toISOString()
  }),

  /**
   * Banks
   */
  getBanks: () => ({
    data: BANKS.map(bank => ({
      ...bank,
      status: random(0, 1) > 0.1 ? 'ACTIVE' : 'INACTIVE',
      lastTransaction: randomTimestamp(1),
      todayVolume: random(10000, 100000),
      successRate: random(99.0, 99.9, 1)
    }))
  }),

  getBankStatus: () => ({
    totalBanks: BANKS.length,
    activeBanks: BANKS.length - 1,
    inactiveBanks: 1,
    lastUpdated: new Date().toISOString()
  }),

  getBankMetrics: (bankId) => {
    const bank = BANKS.find(b => b.id === bankId);
    return {
      bankId,
      bankName: bank?.name || 'Unknown Bank',
      metrics: {
        totalTransactions: random(50000, 200000),
        successRate: random(99.0, 99.9, 1),
        avgLatency: random(100, 300),
        errorRate: random(0.01, 0.1, 2),
        volume: {
          banl: random(20000, 80000),
          imps: random(15000, 60000),
          upi: random(10000, 50000)
        }
      },
      lastUpdated: new Date().toISOString()
    };
  },

  getTenantData: (bankId) => {
    const bank = BANKS.find(b => b.id === bankId);
    return {
      bankId,
      bankName: bank?.name || 'Unknown Bank',
      tenants: [
        {
          id: 'TENANT1',
          name: 'Production',
          status: 'ACTIVE',
          endpoints: [
            { url: 'https://api.bank1.com/txn', status: 'HEALTHY' },
            { url: 'https://api.bank1.com/status', status: 'HEALTHY' }
          ]
        },
        {
          id: 'TENANT2',
          name: 'Staging',
          status: 'ACTIVE',
          endpoints: [
            { url: 'https://staging.bank1.com/txn', status: 'HEALTHY' }
          ]
        }
      ]
    };
  }
};

export default mockDataService;
