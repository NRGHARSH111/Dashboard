/**
 * Refresh Rate Manager for TFL Monitoring Dashboard
 * Implements TFL Functional Document refresh rate standards
 */

import { API_CONFIG } from '../config/apiConfig';

/**
 * Refresh Rate Configuration
 */
export const REFRESH_CONFIG = {
  // TFL-defined refresh rates (in milliseconds)
  RATES: {
    LIVE_FEED: 1000,        // 1 second - Real-time Transaction Stream
    KPIS: 5000,            // 5 seconds - Executive Summary KPIs
    FLOW_MATRIX: 10000,    // 10 seconds - Transaction Flow Matrix
    FAILURE_INTELLIGENCE: 15000, // 15 seconds - Failure Intelligence
    BANK_TENANT: 20000,    // 20 seconds - Bank-wise Tenant View
    HEALTH_CHECKS: 5000,   // 5 seconds - NPCI Connectivity Health Checks
    ALERTS: 3000,          // 3 seconds - Alerts
    LOGS: 30000,           // 30 seconds - Logs
    COMPLIANCE: 60000,     // 1 minute - Compliance Data
    SLA: 60000             // 1 minute - SLA Data
  },

  // Color status standards for refresh indicators
  STATUS_COLORS: {
    ACTIVE: '#10B981',      // Green - Refreshing normally
    DELAYED: '#F59E0B',      // Amber - Refresh delayed
    FAILED: '#EF4444',        // Red - Refresh failed
    STOPPED: '#6B7280'       // Gray - Refresh stopped
  },

  // Maximum retry attempts before stopping
  MAX_RETRIES: 3,
  
  // Backoff multiplier for failed refreshes
  RETRY_BACKOFF: 2
};

/**
 * Refresh Manager Class
 */
export class RefreshManager {
  constructor() {
    this.intervals = new Map();
    this.statuses = new Map();
    this.retryCounts = new Map();
    this.lastUpdates = new Map();
    this.callbacks = new Map();
    this.isPaused = false;
  }

  /**
   * Register a data source for automatic refresh
   */
  register(key, callback, options = {}) {
    const {
      rate = REFRESH_CONFIG.RATES.KPIS,
      immediate = true,
      maxRetries = REFRESH_CONFIG.MAX_RETRIES,
      enabled = true
    } = options;

    // Store callback and configuration
    this.callbacks.set(key, {
      callback,
      rate,
      maxRetries,
      enabled
    });

    // Initialize status
    this.statuses.set(key, REFRESH_CONFIG.STATUS_COLORS.ACTIVE);
    this.retryCounts.set(key, 0);
    this.lastUpdates.set(key, null);

    if (enabled && !this.isPaused) {
      this.startRefresh(key, immediate);
    }

    return this;
  }

  /**
   * Start refreshing a data source
   */
  startRefresh(key, immediate = false) {
    const config = this.callbacks.get(key);
    if (!config || !config.enabled) return;

    // Clear existing interval
    this.stopRefresh(key);

    // Execute immediately if requested
    if (immediate) {
      this.executeRefresh(key);
    }

    // Set up interval
    const interval = setInterval(() => {
      if (!this.isPaused) {
        this.executeRefresh(key);
      }
    }, config.rate);

    this.intervals.set(key, interval);
    this.statuses.set(key, REFRESH_CONFIG.STATUS_COLORS.ACTIVE);
  }

  /**
   * Stop refreshing a data source
   */
  stopRefresh(key) {
    const interval = this.intervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(key);
    }
    this.statuses.set(key, REFRESH_CONFIG.STATUS_COLORS.STOPPED);
  }

  /**
   * Execute a refresh with error handling and retry logic
   */
  async executeRefresh(key) {
    const config = this.callbacks.get(key);
    if (!config || !config.enabled || this.isPaused) return;

    try {
      this.statuses.set(key, REFRESH_CONFIG.STATUS_COLORS.ACTIVE);
      
      // Execute the callback
      const result = await config.callback();
      
      // Reset retry count on success
      this.retryCounts.set(key, 0);
      this.lastUpdates.set(key, new Date());
      
      return result;
    } catch (error) {
      console.error(`Refresh failed for ${key}:`, error);
      
      const retryCount = this.retryCounts.get(key) || 0;
      this.retryCounts.set(key, retryCount + 1);

      if (retryCount >= config.maxRetries) {
        // Max retries reached, stop refreshing
        this.statuses.set(key, REFRESH_CONFIG.STATUS_COLORS.FAILED);
        this.stopRefresh(key);
        
        // Schedule retry with exponential backoff
        const backoffDelay = config.rate * Math.pow(REFRESH_CONFIG.RETRY_BACKOFF, retryCount);
        setTimeout(() => {
          if (config.enabled) {
            this.retryCounts.set(key, 0);
            this.startRefresh(key);
          }
        }, backoffDelay);
      } else {
        // Still have retries, show delayed status
        this.statuses.set(key, REFRESH_CONFIG.STATUS_COLORS.DELAYED);
      }
      
      throw error;
    }
  }

  /**
   * Pause all refreshes
   */
  pauseAll() {
    this.isPaused = true;
    this.intervals.forEach((interval, key) => {
      clearInterval(interval);
    });
    this.intervals.clear();
    
    // Update all statuses to stopped
    this.statuses.forEach((_, key) => {
      this.statuses.set(key, REFRESH_CONFIG.STATUS_COLORS.STOPPED);
    });
  }

  /**
   * Resume all refreshes
   */
  resumeAll() {
    this.isPaused = false;
    this.callbacks.forEach((config, key) => {
      if (config.enabled) {
        this.startRefresh(key, true);
      }
    });
  }

  /**
   * Update refresh rate for a data source
   */
  updateRate(key, newRate) {
    const config = this.callbacks.get(key);
    if (config) {
      config.rate = newRate;
      if (this.intervals.has(key)) {
        this.startRefresh(key);
      }
    }
  }

  /**
   * Enable/disable a data source
   */
  setEnabled(key, enabled) {
    const config = this.callbacks.get(key);
    if (config) {
      config.enabled = enabled;
      if (enabled && !this.isPaused) {
        this.startRefresh(key, true);
      } else {
        this.stopRefresh(key);
      }
    }
  }

  /**
   * Get refresh status for all data sources
   */
  getStatus() {
    const status = {};
    this.callbacks.forEach((config, key) => {
      status[key] = {
        enabled: config.enabled,
        rate: config.rate,
        status: this.statuses.get(key),
        retryCount: this.retryCounts.get(key),
        lastUpdate: this.lastUpdates.get(key),
        isRefreshing: this.intervals.has(key)
      };
    });
    return status;
  }

  /**
   * Get status for a specific data source
   */
  getKeyStatus(key) {
    const config = this.callbacks.get(key);
    if (!config) return null;

    return {
      enabled: config.enabled,
      rate: config.rate,
      status: this.statuses.get(key),
      retryCount: this.retryCounts.get(key),
      lastUpdate: this.lastUpdates.get(key),
      isRefreshing: this.intervals.has(key)
    };
  }

  /**
   * Force refresh a data source
   */
  async forceRefresh(key) {
    return this.executeRefresh(key);
  }

  /**
   * Clear all refreshes
   */
  clearAll() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    this.statuses.clear();
    this.retryCounts.clear();
    this.lastUpdates.clear();
    this.callbacks.clear();
  }
}

/**
 * Global refresh manager instance
 */
export const refreshManager = new RefreshManager();

/**
 * Hook for using refresh manager in React components
 */
export const useRefreshManager = () => {
  const [status, setStatus] = React.useState({});

  // Update status every second
  React.useEffect(() => {
    const interval = setInterval(() => {
      setStatus(refreshManager.getStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    status,
    register: refreshManager.register.bind(refreshManager),
    startRefresh: refreshManager.startRefresh.bind(refreshManager),
    stopRefresh: refreshManager.stopRefresh.bind(refreshManager),
    pauseAll: refreshManager.pauseAll.bind(refreshManager),
    resumeAll: refreshManager.resumeAll.bind(refreshManager),
    forceRefresh: refreshManager.forceRefresh.bind(refreshManager),
    setEnabled: refreshManager.setEnabled.bind(refreshManager),
    updateRate: refreshManager.updateRate.bind(refreshManager)
  };
};

/**
 * Predefined refresh configurations for TFL dashboard
 */
export const TFL_REFRESH_CONFIGS = {
  // Executive Summary KPIs
  kpis: {
    rate: REFRESH_CONFIG.RATES.KPIS,
    immediate: true,
    maxRetries: 3
  },

  // Live Transaction Stream
  liveFeed: {
    rate: REFRESH_CONFIG.RATES.LIVE_FEED,
    immediate: true,
    maxRetries: 5
  },

  // Transaction Flow Matrix
  flowMatrix: {
    rate: REFRESH_CONFIG.RATES.FLOW_MATRIX,
    immediate: true,
    maxRetries: 3
  },

  // Failure Intelligence
  failureIntelligence: {
    rate: REFRESH_CONFIG.RATES.FAILURE_INTELLIGENCE,
    immediate: true,
    maxRetries: 2
  },

  // NPCI Connectivity Health
  npciConnectivity: {
    rate: REFRESH_CONFIG.RATES.HEALTH_CHECKS,
    immediate: true,
    maxRetries: 5
  },

  // Bank-wise Tenant View
  bankTenant: {
    rate: REFRESH_CONFIG.RATES.BANK_TENANT,
    immediate: true,
    maxRetries: 2
  },

  // Alerts
  alerts: {
    rate: REFRESH_CONFIG.RATES.ALERTS,
    immediate: true,
    maxRetries: 3
  },

  // Compliance Data
  compliance: {
    rate: REFRESH_CONFIG.RATES.COMPLIANCE,
    immediate: false,
    maxRetries: 1
  }
};

export default {
  RefreshManager,
  refreshManager,
  useRefreshManager,
  REFRESH_CONFIG,
  TFL_REFRESH_CONFIGS
};
