/**
 * Mock Data Service for TFL Monitoring Dashboard
 * Provides mock data for development and testing purposes
 */

export const mockDataService = {
  /**
   * Generate mock report summary data
   * @returns {Object} Mock report summary
   */
  generateMockReportSummary: () => ({
    lastGenerated: new Date().toISOString(),
    totalExports: Math.floor(Math.random() * 50) + 10,
    pendingReports: Math.floor(Math.random() * 3),
    lastExportType: ['CSV','Excel','PDF','JSON'][
      Math.floor(Math.random() * 4)],
    hourlyReady: true,
    dailyReady: true,
    bankWiseReady: Math.random() > 0.3,
    failureAnalysisReady: Math.random() > 0.2,
    npciSlaReady: Math.random() > 0.4,
    status: 'ready'
  }),

  /**
   * Get mock KPI metrics
   * @returns {Object} Mock KPI data
   */
  getKPIMetrics: () => ({
    successRate: (Math.random() * 2 + 98).toFixed(2),
    pendingTxns: Math.floor(Math.random() * 100),
    totalTransactions: Math.floor(Math.random() * 10000) + 5000,
    avgResponseTime: Math.floor(Math.random() * 100) + 50,
    errorRate: (Math.random() * 0.5).toFixed(2),
    timeoutRate: (Math.random() * 0.2).toFixed(2),
    npciConnectivity: Math.random() > 0.1
  }),

  /**
   * Get mock transactions
   * @param {Object} options - Query options
   * @returns {Object} Mock transaction data
   */
  getTransactions: (options = {}) => {
    const limit = options.limit || 20;
    const transactions = [];
    
    for (let i = 0; i < limit; i++) {
      transactions.push({
        id: `TXN${Date.now()}${i}`,
        rrn: `RRN${Math.random().toString().substr(2, 12)}`,
        amount: (Math.random() * 10000).toFixed(2),
        status: Math.random() > 0.1 ? 'SUCCESS' : 'FAILED',
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        bank: `BANK${Math.floor(Math.random() * 10) + 1}`,
        type: ['IMPS', 'NEFT', 'RTGS', 'UPI'][Math.floor(Math.random() * 4)]
      });
    }
    
    return { data: transactions };
  },

  /**
   * Get mock flow matrix data
   * @returns {Object} Mock flow matrix
   */
  getFlowMatrix: () => ({
    banl: { 
      host: Math.floor(Math.random() * 1000), 
      tfl: Math.floor(Math.random() * 1000), 
      npci: Math.floor(Math.random() * 1000), 
      return: Math.floor(Math.random() * 1000) 
    },
    imps: { 
      host: Math.floor(Math.random() * 1000), 
      tfl: Math.floor(Math.random() * 1000), 
      npci: Math.floor(Math.random() * 1000), 
      return: Math.floor(Math.random() * 1000) 
    },
    upi: { 
      host: Math.floor(Math.random() * 1000), 
      tfl: Math.floor(Math.random() * 1000), 
      npci: Math.floor(Math.random() * 1000), 
      return: Math.floor(Math.random() * 1000) 
    }
  })
};
