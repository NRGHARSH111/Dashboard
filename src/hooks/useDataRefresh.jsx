import { useEffect, useRef, useCallback } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { mockDataService } from '../services/mockDataService';
import { REFRESH_INTERVALS } from '../config/apiConfig';

/**
 * Custom hook for managing data refresh intervals
 * Handles live feed, KPIs, and heatmap updates at different intervals
 */
export const useDataRefresh = () => {
  const { 
    updateKPIs, 
    updateLiveFeed, 
    addLiveFeedItem,
    updateFlowMatrix,
    updateHeatmap,
    updateReportSummary
  } = useDashboard();

  const intervalsRef = useRef({});

  /**
   * Refresh KPIs every 5 seconds
   */
  const refreshKPIs = useCallback(() => {
    try {
      const kpis = mockDataService.getKPIMetrics();
      updateKPIs(kpis);
    } catch (error) {
      console.error('Error refreshing KPIs:', error);
    }
  }, [updateKPIs]);

  /**
   * Refresh Live Feed every 1 second
   */
  const refreshLiveFeed = useCallback(() => {
    try {
      // Add new transaction to existing feed
      const newTransaction = mockDataService.getTransactions({ limit: 1 }).data[0];
      addLiveFeedItem(newTransaction);
    } catch (error) {
      console.error('Error refreshing live feed:', error);
    }
  }, [addLiveFeedItem]);

  /**
   * Refresh Heatmap every 10 seconds
   */
  const refreshHeatmap = useCallback(() => {
    try {
      const heatmap = mockDataService.getFlowMatrix();
      updateHeatmap(heatmap);
    } catch (error) {
      console.error('Error refreshing heatmap:', error);
    }
  }, [updateHeatmap]);

  /**
   * Refresh Flow Matrix every 5 seconds
   */
  const refreshFlowMatrix = useCallback(() => {
    try {
      const flowMatrix = mockDataService.getFlowMatrix();
      updateFlowMatrix(flowMatrix);
    } catch (error) {
      console.error('Error refreshing flow matrix:', error);
    }
  }, [updateFlowMatrix]);

  /**
   * Refresh Reports every 60 seconds
   */
  const refreshReports = useCallback(() => {
    try {
      const summary = mockDataService.generateMockReportSummary();
      updateReportSummary(summary);
    } catch (error) {
      console.error('Error refreshing reports:', error);
    }
  }, [updateReportSummary]);

  /**
   * Initialize all data refresh intervals
   */
  const initializeDataRefresh = useCallback(() => {
    // Clear any existing intervals
    Object.values(intervalsRef.current).forEach(clearInterval);

    // Set up new intervals
    intervalsRef.current.kpis = setInterval(refreshKPIs, REFRESH_INTERVALS.KPI); // 5 seconds
    intervalsRef.current.liveFeed = setInterval(refreshLiveFeed, REFRESH_INTERVALS.LIVE_FEED); // 1 second
    intervalsRef.current.heatmap = setInterval(refreshHeatmap, REFRESH_INTERVALS.HEATMAP); // 10 seconds
    intervalsRef.current.flowMatrix = setInterval(refreshFlowMatrix, REFRESH_INTERVALS.FLOW); // 5 seconds
    intervalsRef.current.reports = setInterval(refreshReports, REFRESH_INTERVALS.REPORTS); // 60 seconds

    // Initial data load
    refreshKPIs();
    refreshLiveFeed();
    refreshHeatmap();
    refreshFlowMatrix();
    refreshReports();

    // Initialize live feed with some data
    const initialFeed = mockDataService.getTransactions({ limit: 20 });
    updateLiveFeed(initialFeed.data);
  }, [
    refreshKPIs, 
    refreshLiveFeed, 
    refreshHeatmap, 
    refreshFlowMatrix,
    refreshReports,
    updateLiveFeed
  ]);

  /**
   * Clear all intervals
   */
  const clearAllIntervals = useCallback(() => {
    Object.values(intervalsRef.current).forEach(clearInterval);
    intervalsRef.current = {};
  }, []);

  /**
   * Pause specific refresh intervals
   */
  const pauseRefresh = useCallback((type) => {
    if (intervalsRef.current[type]) {
      clearInterval(intervalsRef.current[type]);
      delete intervalsRef.current[type];
    }
  }, []);

  /**
   * Resume specific refresh intervals
   */
  const resumeRefresh = useCallback((type) => {
    switch (type) {
      case 'kpis':
        intervalsRef.current.kpis = setInterval(refreshKPIs, REFRESH_INTERVALS.KPI);
        break;
      case 'liveFeed':
        intervalsRef.current.liveFeed = setInterval(refreshLiveFeed, REFRESH_INTERVALS.LIVE_FEED);
        break;
      case 'heatmap':
        intervalsRef.current.heatmap = setInterval(refreshHeatmap, REFRESH_INTERVALS.HEATMAP);
        break;
      case 'flowMatrix':
        intervalsRef.current.flowMatrix = setInterval(refreshFlowMatrix, REFRESH_INTERVALS.FLOW);
        break;
      case 'reports':
        intervalsRef.current.reports = setInterval(refreshReports, REFRESH_INTERVALS.REPORTS);
        break;
      default:
        break;
    }
  }, [refreshKPIs, refreshLiveFeed, refreshHeatmap, refreshFlowMatrix, refreshReports]);

  /**
   * Get current refresh status
   */
  const getRefreshStatus = useCallback(() => {
    return {
      kpis: !!intervalsRef.current.kpis,
      liveFeed: !!intervalsRef.current.liveFeed,
      heatmap: !!intervalsRef.current.heatmap,
      flowMatrix: !!intervalsRef.current.flowMatrix,
      reports: !!intervalsRef.current.reports
    };
  }, []);

  // Initialize on mount and cleanup on unmount
  useEffect(() => {
    initializeDataRefresh();

    return () => {
      clearAllIntervals();
    };
  }, [initializeDataRefresh, clearAllIntervals]);

  // Handle page visibility changes to pause/resume refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause all refresh when page is hidden
        Object.keys(intervalsRef.current).forEach(type => {
          pauseRefresh(type);
        });
      } else {
        // Resume all refresh when page is visible
        resumeRefresh('kpis');
        resumeRefresh('liveFeed');
        resumeRefresh('heatmap');
        resumeRefresh('flowMatrix');
        resumeRefresh('reports');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseRefresh, resumeRefresh]);

  return {
    initializeDataRefresh,
    clearAllIntervals,
    pauseRefresh,
    resumeRefresh,
    getRefreshStatus,
    refreshKPIs,
    refreshLiveFeed,
    refreshHeatmap,
    refreshFlowMatrix,
    refreshReports
  };
};

/**
 * Hook for managing tab-specific data refresh
 */
export const useTabDataRefresh = (activeTab, { pauseRefresh, resumeRefresh }) => {
  useEffect(() => {
    // Pause all refresh when switching tabs
    pauseRefresh('kpis');
    pauseRefresh('liveFeed');
    pauseRefresh('heatmap');
    pauseRefresh('flowMatrix');

    // Resume based on active tab
    switch (activeTab) {
      case 'overview':
        resumeRefresh('kpis');
        resumeRefresh('liveFeed');
        resumeRefresh('heatmap');
        resumeRefresh('flowMatrix');
        break;
      case 'banl':
      case 'imps':
      case 'upi':
        resumeRefresh('flowMatrix');
        resumeRefresh('liveFeed');
        break;
      case 'npci-link':
        resumeRefresh('heatmap');
        resumeRefresh('flowMatrix');
        break;
      case 'errors':
        resumeRefresh('liveFeed');
        break;
      case 'logs':
      case 'audit':
        // Logs and audit tabs might have different refresh logic
        resumeRefresh('liveFeed');
        break;
      default:
        // Resume basic refresh for unknown tabs
        resumeRefresh('kpis');
        resumeRefresh('liveFeed');
        break;
    }
  }, [activeTab, pauseRefresh, resumeRefresh]);
};

/**
 * Hook for managing real-time updates with WebSocket simulation
 */
export const useRealTimeUpdates = () => {
  const { addLiveFeedItem } = useDashboard();

  useEffect(() => {
    // Simulate WebSocket connection for real-time updates
    const simulateWebSocket = () => {
      // This would normally be a real WebSocket connection
      // For demo purposes, we'll just add random transactions
      const interval = setInterval(() => {
        const newTransaction = mockDataService.getTransactions({ limit: 1 }).data[0];
        addLiveFeedItem(newTransaction);
      }, Math.random() * 3000 + 1000); // Random interval between 1-4 seconds

      return interval;
    };

    const wsInterval = simulateWebSocket();

    return () => {
      clearInterval(wsInterval);
    };
  }, [addLiveFeedItem]);
};
