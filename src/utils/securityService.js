/**
 * Security and Compliance Utilities for TFL Monitoring Dashboard
 * Implements TFL Functional Document Section 17 requirements
 */

import { API_CONFIG } from '../config/apiConfig';

/**
 * Token Management Service
 */
export const tokenService = {
  /**
   * Store authentication token securely
   */
  setToken: (token) => {
    try {
      localStorage.setItem('authToken', token);
      localStorage.setItem('tokenTimestamp', Date.now().toString());
    } catch (error) {
      console.error('Failed to store auth token:', error);
    }
  },

  /**
   * Get stored authentication token
   */
  getToken: () => {
    try {
      return localStorage.getItem('authToken');
    } catch (error) {
      console.error('Failed to retrieve auth token:', error);
      return null;
    }
  },

  /**
   * Check if token is expired or needs refresh
   */
  isTokenExpired: () => {
    const timestamp = localStorage.getItem('tokenTimestamp');
    if (!timestamp) return true;
    
    const tokenAge = Date.now() - parseInt(timestamp);
    return tokenAge > API_CONFIG.security.tokenRefreshThreshold;
  },

  /**
   * Refresh authentication token
   */
  refreshToken: async () => {
    try {
      // Check if we're in development and backend is likely unavailable
      if (import.meta.env.MODE === 'development' && !tokenService.getToken()) {
        console.warn('Development mode: No token available, skipping refresh');
        return null;
      }

      const response = await fetch(`${API_CONFIG.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenService.getToken()}`
        }
      });

      if (response.ok) {
        const { token } = await response.json();
        tokenService.setToken(token);
        return token;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // In development, don't throw errors for connection issues
      if (import.meta.env.MODE === 'development' && error.message.includes('Failed to fetch')) {
        console.warn('Development mode: Backend unavailable, continuing without token refresh');
        return null;
      }
    }
    return null;
  },

  /**
   * Clear all authentication data
   */
  clearTokens: () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('tokenTimestamp');
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }
};

/**
 * Request Validation Service
 */
export const requestValidator = {
  /**
   * Validate request payload against security rules
   */
  validatePayload: (payload) => {
    const errors = [];
    
    // Check for potentially malicious content
    const maliciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];

    const validateObject = (obj, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'string') {
          maliciousPatterns.forEach(pattern => {
            if (pattern.test(value)) {
              errors.push(`Potentially malicious content detected in ${currentPath}`);
            }
          });
        } else if (typeof value === 'object' && value !== null) {
          validateObject(value, currentPath);
        }
      }
    };

    if (payload && typeof payload === 'object') {
      validateObject(payload);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Sanitize request parameters
   */
  sanitizeParams: (params) => {
    if (!params || typeof params !== 'object') return {};
    
    const sanitized = {};
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        // Remove potential XSS patterns
        sanitized[key] = value
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
};

/**
 * Audit Logging Service
 */
export const auditService = {
  /**
   * Log security events
   */
  logSecurityEvent: (event, details = {}) => {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userId: auditService.getCurrentUserId(),
      sessionId: auditService.getSessionId(),
      ipAddress: auditService.getClientIP(),
      userAgent: navigator.userAgent
    };

    // Store in local storage for development
    if (API_CONFIG.environment === 'development') {
      const existingLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
      existingLogs.push(auditEntry);
      
      // Keep only last 1000 entries
      if (existingLogs.length > 1000) {
        existingLogs.splice(0, existingLogs.length - 1000);
      }
      
      localStorage.setItem('auditLogs', JSON.stringify(existingLogs));
    }

    // In production, send to audit server
    if (API_CONFIG.environment === 'production') {
      auditService.sendAuditLog(auditEntry);
    }
  },

  /**
   * Get current user ID from token or session
   */
  getCurrentUserId: () => {
    const token = tokenService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId || payload.sub;
      } catch (error) {
        console.error('Failed to parse token:', error);
      }
    }
    return 'anonymous';
  },

  /**
   * Get session ID
   */
  getSessionId: () => {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  },

  /**
   * Get client IP (simplified - in production would use server-side detection)
   */
  getClientIP: () => {
    return localStorage.getItem('clientIP') || 'unknown';
  },

  /**
   * Send audit log to server
   */
  sendAuditLog: async (auditEntry) => {
    try {
      await fetch(`${API_CONFIG.baseURL}/compliance/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenService.getToken()}`
        },
        body: JSON.stringify(auditEntry)
      });
    } catch (error) {
      console.error('Failed to send audit log:', error);
    }
  }
};

/**
 * Compliance Checker Service
 */
export const complianceService = {
  /**
   * Check data retention compliance
   */
  checkDataRetention: () => {
    const retentionPeriod = 180; // days as per TFL requirements
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionPeriod);

    // Check local storage data
    const auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    const expiredLogs = auditLogs.filter(log => 
      new Date(log.timestamp) < cutoffDate
    );

    return {
      compliant: expiredLogs.length === 0,
      expiredCount: expiredLogs.length,
      cutoffDate: cutoffDate.toISOString()
    };
  },

  /**
   * Clean up expired data
   */
  cleanupExpiredData: () => {
    const retentionCheck = this.checkDataRetention();
    if (!retentionCheck.compliant) {
      const auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
      const validLogs = auditLogs.filter(log => 
        new Date(log.timestamp) >= new Date(retentionCheck.cutoffDate)
      );
      
      localStorage.setItem('auditLogs', JSON.stringify(validLogs));
      
      auditService.logSecurityEvent('DATA_CLEANUP', {
        removedCount: auditLogs.length - validLogs.length,
        cutoffDate: retentionCheck.cutoffDate
      });
    }
  },

  /**
   * Verify encryption requirements
   */
  verifyEncryption: () => {
    // Check if we're using HTTPS in production
    const isSecure = API_CONFIG.environment === 'production' 
      ? window.location.protocol === 'https:'
      : true; // Allow HTTP in development

    return {
      transportEncrypted: isSecure,
      dataAtRestEncrypted: true, // Assuming server-side encryption
      overallCompliant: isSecure
    };
  }
};

/**
 * Security Middleware for API calls
 */
export const securityMiddleware = {
  /**
   * Apply security checks before API call
   */
  beforeRequest: async (config) => {
    // Validate payload
    if (config.data) {
      const validation = requestValidator.validatePayload(config.data);
      if (!validation.isValid) {
        throw new Error(`Security validation failed: ${validation.errors.join(', ')}`);
      }
    }

    // Sanitize parameters
    if (config.params) {
      config.params = requestValidator.sanitizeParams(config.params);
    }

    // Check token refresh only if auth is required and we're not in development mode
    if (!config.skipSecurity && API_CONFIG.security.requireAuth) {
      // In development mode, skip token refresh if backend is unavailable
      if (import.meta.env.MODE !== 'development' || tokenService.getToken()) {
        try {
          const newToken = await tokenService.refreshToken();
          if (!newToken && tokenService.getToken()) {
            throw new Error('Authentication failed - unable to refresh token');
          }
        } catch (securityError) {
          // In development, log but don't fail if it's a connection issue
          if (import.meta.env.MODE === 'development' && securityError.message.includes('Failed to fetch')) {
            console.warn('Development mode: Backend unavailable, proceeding without auth');
            return config; // Continue without auth in development
          }
          throw securityError;
        }
      }
    }

    // Add security headers
    config.headers = {
      ...config.headers,
      'X-TFL-Security-Check': 'passed',
      'X-TFL-Request-Timestamp': new Date().toISOString()
    };

    return config;
  },

  /**
   * Log security events after API response
   */
  afterResponse: (response, config) => {
    if (response.status === 401 || response.status === 403) {
      auditService.logSecurityEvent('AUTHENTICATION_FAILURE', {
        status: response.status,
        url: config.url,
        method: config.method
      });
    }

    if (response.status >= 400) {
      auditService.logSecurityEvent('API_ERROR', {
        status: response.status,
        url: config.url,
        method: config.method
      });
    }

    return response;
  }
};

/**
 * Initialize security features
 */
export const initializeSecurity = () => {
  // Set up periodic cleanup
  setInterval(() => {
    complianceService.cleanupExpiredData();
  }, 24 * 60 * 60 * 1000); // Daily cleanup

  // Log initialization
  auditService.logSecurityEvent('SECURITY_INITIALIZED', {
    environment: API_CONFIG.environment,
    features: ['tokenManagement', 'requestValidation', 'auditLogging', 'compliance']
  });

  // Check compliance on startup
  const complianceCheck = complianceService.verifyEncryption();
  if (!complianceCheck.overallCompliant) {
    console.warn('Security compliance check failed:', complianceCheck);
  }
};

export default {
  tokenService,
  requestValidator,
  auditService,
  complianceService,
  securityMiddleware,
  initializeSecurity
};
