import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { apiService } from '../services/apiClient';
import { API_CONFIG } from '../config/apiConfig';
import { refreshManager, TFL_REFRESH_CONFIGS } from '../utils/refreshManager';

const DashboardContext = createContext();

const initialState = {
  kpis: {
    successRate: null,
    pendingTxns: null,
    totalTransactions: null,
    avgResponseTime: null,
    errorRate: null,
    timeoutRate: null,
    npciConnectivity: null
  },
  liveFeed: [],
  flowMatrix: {
    banl: { host: null, tfl: null, npci: null, return: null },
    imps: { host: null, tfl: null, npci: null, return: null },
    upi: { host: null, tfl: null, npci: null, return: null }
  },
  heatmap: [],
  failureIntelligence: {
    errorCategories: [],
    topFailureCodes: []
  },
  npciConnectivity: {
    socket: null,
    tlsHandshake: null,
    lastHeartbeat: null,
    packetLoss: null,
    rtt: null
  },
  bankTenantData: {
    selectedBank: 'all',
    banks: [],
    metrics: {}
  },
  complianceData: {
    controls: [],
    auditLogs: [],
    retentionStatus: null
  },
  alerts: {
    active: [],
    history: [],
    configuration: []
  },
  activeTab: 'overview',
  mfaVerified: true,
  lastUpdated: null,
  loading: {
    kpis: false,
    liveFeed: false,
    flowMatrix: false,
    failureIntelligence: false,
    npciConnectivity: false,
    bankTenantData: false,
    complianceData: false,
    alerts: false
  },
  error: null
};

function dashboardReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.payload.key]: action.payload.value }
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        lastUpdated: new Date()
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    case 'UPDATE_KPIS':
      return {
        ...state,
        kpis: { ...state.kpis, ...action.payload },
        lastUpdated: new Date()
      };
    case 'UPDATE_LIVE_FEED':
      return {
        ...state,
        liveFeed: action.payload,
        lastUpdated: new Date()
      };
    case 'ADD_LIVE_FEED_ITEM':
      return {
        ...state,
        liveFeed: [action.payload, ...state.liveFeed.slice(0, 49)],
        lastUpdated: new Date()
      };
    case 'UPDATE_FLOW_MATRIX':
      return {
        ...state,
        flowMatrix: { ...state.flowMatrix, ...action.payload },
        lastUpdated: new Date()
      };
    case 'UPDATE_HEATMAP':
      return {
        ...state,
        heatmap: action.payload,
        lastUpdated: new Date()
      };
    case 'UPDATE_FAILURE_INTELLIGENCE':
      return {
        ...state,
        failureIntelligence: { ...state.failureIntelligence, ...action.payload },
        lastUpdated: new Date()
      };
    case 'UPDATE_NPCI_CONNECTIVITY':
      return {
        ...state,
        npciConnectivity: { ...state.npciConnectivity, ...action.payload },
        lastUpdated: new Date()
      };
    case 'UPDATE_BANK_TENANT_DATA':
      return {
        ...state,
        bankTenantData: { ...state.bankTenantData, ...action.payload },
        lastUpdated: new Date()
      };
    case 'UPDATE_COMPLIANCE_DATA':
      return {
        ...state,
        complianceData: { ...state.complianceData, ...action.payload },
        lastUpdated: new Date()
      };
    case 'ADD_ALERT':
      return {
        ...state,
        alerts: {
          ...state.alerts,
          active: [...state.alerts.active, action.payload],
          history: [action.payload, ...state.alerts.history.slice(0, 99)]
        },
        lastUpdated: new Date()
      };
    case 'RESOLVE_ALERT':
      return {
        ...state,
        alerts: {
          ...state.alerts,
          active: state.alerts.active.filter(alert => alert.id !== action.payload),
          history: state.alerts.history.map(alert => 
            alert.id === action.payload ? { ...alert, resolved: true, resolvedAt: new Date() } : alert
          )
        },
        lastUpdated: new Date()
      };
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.payload
      };
    case 'TOGGLE_MFA':
      return {
        ...state,
        mfaVerified: !state.mfaVerified
      };
    default:
      return state;
  }
}

export function DashboardProvider({ children }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  // Helper function to set loading state
  const setLoading = (key, value) => {
    dispatch({ type: 'SET_LOADING', payload: { key, value } });
  };

  // Helper function to handle API errors
  const handleApiError = (error, operation) => {
    console.error(`API Error in ${operation}:`, error);
    dispatch({ type: 'SET_ERROR', payload: { message: error.message, operation } });
  };

  // Fetch Executive Summary KPIs
  const fetchKPIs = async () => {
    try {
      setLoading('kpis', true);
      dispatch({ type: 'CLEAR_ERROR' });
      
      const response = await apiService.kpi.getExecutiveSummary();
      dispatch({ type: 'UPDATE_KPIS', payload: response.data });
    } catch (error) {
      handleApiError(error, 'fetchKPIs');
      throw error; // Re-throw for refresh manager retry logic
    } finally {
      setLoading('kpis', false);
    }
  };

  // Fetch Live Transaction Stream
  const fetchLiveFeed = async () => {
    try {
      setLoading('liveFeed', true);
      const response = await apiService.transactions.getLiveStream();
      dispatch({ type: 'UPDATE_LIVE_FEED', payload: response.data });
    } catch (error) {
      handleApiError(error, 'fetchLiveFeed');
      throw error;
    } finally {
      setLoading('liveFeed', false);
    }
  };

  // Fetch Transaction Flow Matrix
  const fetchFlowMatrix = async () => {
    try {
      setLoading('flowMatrix', true);
      const [banlResponse, impsResponse, upiResponse] = await Promise.all([
        apiService.transactions.getBANLMatrix(),
        apiService.transactions.getIMPSMatrix(),
        apiService.transactions.getUPIMatrix()
      ]);
      
      dispatch({ type: 'UPDATE_FLOW_MATRIX', payload: {
        banl: banlResponse.data,
        imps: impsResponse.data,
        upi: upiResponse.data
      }});
    } catch (error) {
      handleApiError(error, 'fetchFlowMatrix');
      throw error;
    } finally {
      setLoading('flowMatrix', false);
    }
  };

  // Fetch Failure Intelligence
  const fetchFailureIntelligence = async () => {
    try {
      setLoading('failureIntelligence', true);
      const [categoriesResponse, codesResponse] = await Promise.all([
        apiService.failureIntelligence.getErrorCategories(),
        apiService.failureIntelligence.getTopErrorCodes()
      ]);
      
      dispatch({ type: 'UPDATE_FAILURE_INTELLIGENCE', payload: {
        errorCategories: categoriesResponse.data,
        topFailureCodes: codesResponse.data
      }});
    } catch (error) {
      handleApiError(error, 'fetchFailureIntelligence');
      throw error;
    } finally {
      setLoading('failureIntelligence', false);
    }
  };

  // Fetch NPCI Connectivity Health
  const fetchNPCIConnectivity = async () => {
    try {
      setLoading('npciConnectivity', true);
      const [
        statusResponse,
        socketResponse,
        tlsResponse,
        heartbeatResponse,
        packetLossResponse,
        rttResponse
      ] = await Promise.all([
        apiService.npci.getStatus(),
        apiService.npci.getSocketStatus(),
        apiService.npci.getTLSHandshake(),
        apiService.npci.getHeartbeat(),
        apiService.npci.getPacketLoss(),
        apiService.npci.getRTTMetrics()
      ]);
      
      dispatch({ type: 'UPDATE_NPCI_CONNECTIVITY', payload: {
        status: statusResponse.data,
        socket: socketResponse.data,
        tlsHandshake: tlsResponse.data,
        lastHeartbeat: heartbeatResponse.data,
        packetLoss: packetLossResponse.data,
        rtt: rttResponse.data
      }});
    } catch (error) {
      handleApiError(error, 'fetchNPCIConnectivity');
      throw error;
    } finally {
      setLoading('npciConnectivity', false);
    }
  };

  // Fetch Bank-wise Tenant View
  const fetchBankTenantData = async () => {
    try {
      setLoading('bankTenantData', true);
      const [banksResponse, tenantViewResponse] = await Promise.all([
        apiService.banks.getList(),
        apiService.banks.getTenantView()
      ]);
      
      dispatch({ type: 'UPDATE_BANK_TENANT_DATA', payload: {
        banks: banksResponse.data,
        tenantView: tenantViewResponse.data
      }});
    } catch (error) {
      handleApiError(error, 'fetchBankTenantData');
      throw error;
    } finally {
      setLoading('bankTenantData', false);
    }
  };

  // Fetch Alerts
  const fetchAlerts = async () => {
    try {
      setLoading('alerts', true);
      const [activeResponse, historyResponse] = await Promise.all([
        apiService.alerts.getActive(),
        apiService.alerts.getHistory({ days: 7 })
      ]);
      
      dispatch({ type: 'UPDATE_ALERTS', payload: {
        active: activeResponse.data,
        history: historyResponse.data
      }});
    } catch (error) {
      handleApiError(error, 'fetchAlerts');
      throw error;
    } finally {
      setLoading('alerts', false);
    }
  };

  // Initialize refresh manager on mount with TFL Section 16 compliant intervals
  useEffect(() => {
    console.log('🚀 Starting TFL Section 16 compliant polling...');
    
    // TFL Section 16 Intervals:
    // - Live Feed: 1 second (1000ms)
    // - KPIs: 5 seconds (5000ms) 
    // - SLA Heatmap: 10 seconds (10000ms)
    
    const intervals = [];
    
    // Load initial data
    const loadInitialData = async () => {
      try {
        console.log('📊 Loading initial data...');
        await Promise.all([
          fetchKPIs(),
          fetchLiveFeed(),
          fetchFlowMatrix(),
          fetchFailureIntelligence(),
          fetchNPCIConnectivity(),
          fetchBankTenantData(),
          fetchAlerts()
        ]);
        console.log('✅ Initial data loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load initial data:', error);
      }
    };
    
    // Set up polling intervals
    const setupPolling = () => {
      // Live Feed - Every 1 second (TFL Section 16)
      const liveFeedInterval = setInterval(async () => {
        try {
          await fetchLiveFeed();
        } catch (error) {
          console.error('Live Feed polling error:', error);
        }
      }, 1000);
      intervals.push(liveFeedInterval);
      
      // KPIs - Every 5 seconds (TFL Section 16)
      const kpiInterval = setInterval(async () => {
        try {
          await fetchKPIs();
        } catch (error) {
          console.error('KPI polling error:', error);
        }
      }, 5000);
      intervals.push(kpiInterval);
      
      // SLA Heatmap - Every 10 seconds (TFL Section 16)
      const heatmapInterval = setInterval(async () => {
        try {
          // Note: fetchHeatmap would be implemented when heatmap API is available
          // For now, we'll update other relevant data
          await fetchFlowMatrix();
        } catch (error) {
          console.error('Heatmap polling error:', error);
        }
      }, 10000);
      intervals.push(heatmapInterval);
      
      // Other data - Less frequent updates
      const otherDataInterval = setInterval(async () => {
        try {
          await Promise.all([
            fetchFailureIntelligence(),
            fetchNPCIConnectivity(),
            fetchBankTenantData(),
            fetchAlerts()
          ]);
        } catch (error) {
          console.error('Other data polling error:', error);
        }
      }, 30000); // Every 30 seconds
      intervals.push(otherDataInterval);
    };
    
    // Initialize
    loadInitialData();
    setupPolling();
    
    // Cleanup on unmount - Prevent memory leaks
    return () => {
      console.log('🧹 Cleaning up polling intervals...');
      intervals.forEach(interval => clearInterval(interval));
      intervals.length = 0; // Clear the array
    };
  }, []);

  // Existing state update functions
  const updateKPIs = (kpis) => {
    dispatch({ type: 'UPDATE_KPIS', payload: kpis });
  };

  const updateLiveFeed = (feed) => {
    dispatch({ type: 'UPDATE_LIVE_FEED', payload: feed });
  };

  const addLiveFeedItem = (item) => {
    dispatch({ type: 'ADD_LIVE_FEED_ITEM', payload: item });
  };

  const updateFlowMatrix = (matrix) => {
    dispatch({ type: 'UPDATE_FLOW_MATRIX', payload: matrix });
  };

  const updateHeatmap = (heatmap) => {
    dispatch({ type: 'UPDATE_HEATMAP', payload: heatmap });
  };

  const setActiveTab = (tab) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  };

  const toggleMFA = () => {
    dispatch({ type: 'TOGGLE_MFA' });
  };

  const updateFailureIntelligence = (data) => {
    dispatch({ type: 'UPDATE_FAILURE_INTELLIGENCE', payload: data });
  };

  const updateNPCIConnectivity = (data) => {
    dispatch({ type: 'UPDATE_NPCI_CONNECTIVITY', payload: data });
  };

  const updateBankTenantData = (data) => {
    dispatch({ type: 'UPDATE_BANK_TENANT_DATA', payload: data });
  };

  const updateComplianceData = (data) => {
    dispatch({ type: 'UPDATE_COMPLIANCE_DATA', payload: data });
  };

  const addAlert = (alert) => {
    dispatch({ type: 'ADD_ALERT', payload: { ...alert, id: Date.now(), timestamp: new Date() } });
  };

  const resolveAlert = (alertId) => {
    dispatch({ type: 'RESOLVE_ALERT', payload: alertId });
  };

  // Refresh control functions
  const pauseRefreshes = () => {
    refreshManager.pauseAll();
  };

  const resumeRefreshes = () => {
    refreshManager.resumeAll();
  };

  const forceRefresh = (key) => {
    return refreshManager.forceRefresh(key);
  };

  const getRefreshStatus = () => {
    return refreshManager.getStatus();
  };

  const value = {
    ...state,
    // Data fetching functions
    fetchKPIs,
    fetchLiveFeed,
    fetchFlowMatrix,
    fetchFailureIntelligence,
    fetchNPCIConnectivity,
    fetchBankTenantData,
    fetchAlerts,
    // Refresh control functions
    pauseRefreshes,
    resumeRefreshes,
    forceRefresh,
    getRefreshStatus,
    // Existing update functions
    updateKPIs,
    updateLiveFeed,
    addLiveFeedItem,
    updateFlowMatrix,
    updateHeatmap,
    updateFailureIntelligence,
    updateNPCIConnectivity,
    updateBankTenantData,
    updateComplianceData,
    addAlert,
    resolveAlert,
    setActiveTab,
    toggleMFA
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
