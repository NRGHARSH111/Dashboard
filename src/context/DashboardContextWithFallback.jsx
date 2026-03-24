import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { kpiServiceWithFallback, transactionServiceWithFallback, npciServiceWithFallback } from '../services/apiServiceWithFallback';

const DashboardContext = createContext();

const initialState = {
  kpis: {
    successRate: 99.7,
    pendingTxns: 0.15,
    totalTransactions: 1250000,
    avgResponseTime: 0.85,
    errorRate: 0.3,
    timeoutRate: 0.1,
    npciConnectivity: 'UP'
  },
  liveFeed: [],
  flowMatrix: {},
  heatmap: [],
  failureIntelligence: {
    errorCategories: [],
    topFailureCodes: []
  },
  npciConnectivity: {
    socket: { status: 'UP', lastUpdate: '2 sec ago' },
    tlsHandshake: { status: 'OK', lastUpdate: '1 min ago' },
    lastHeartbeat: { timestamp: new Date(), status: 'ACTIVE' },
    packetLoss: { value: 0.02, unit: '%', status: 'OK' },
    rtt: { value: 45, unit: 'ms', status: 'OK' }
  },
  bankTenantData: {
    selectedBank: 'all',
    banks: [],
    metrics: {}
  },
  complianceData: {
    controls: [],
    auditLogs: [],
    retentionStatus: { policy: '180 Days', currentStatus: 'COMPLIANT', daysRemaining: 165 }
  },
  alerts: {
    active: [],
    history: [],
    configuration: []
  },
  activeTab: 'overview',
  mfaVerified: true,
  lastUpdated: new Date(),
  loading: false,
  error: null,
  dataSource: 'mock' // 'mock' or 'live'
};

function dashboardReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_DATA_SOURCE':
      return { ...state, dataSource: action.payload };
    
    case 'UPDATE_KPIS':
      return {
        ...state,
        kpis: { ...state.kpis, ...action.payload },
        lastUpdated: new Date(),
        error: null
      };
    
    case 'UPDATE_LIVE_FEED':
      return {
        ...state,
        liveFeed: action.payload,
        lastUpdated: new Date(),
        error: null
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
        lastUpdated: new Date(),
        error: null
      };
    
    case 'UPDATE_HEATMAP':
      return {
        ...state,
        heatmap: action.payload,
        lastUpdated: new Date(),
        error: null
      };
    
    case 'UPDATE_FAILURE_INTELLIGENCE':
      return {
        ...state,
        failureIntelligence: { ...state.failureIntelligence, ...action.payload },
        lastUpdated: new Date(),
        error: null
      };
    
    case 'UPDATE_NPCI_CONNECTIVITY':
      return {
        ...state,
        npciConnectivity: { ...state.npciConnectivity, ...action.payload },
        lastUpdated: new Date(),
        error: null
      };
    
    case 'UPDATE_BANK_TENANT_DATA':
      return {
        ...state,
        bankTenantData: { ...state.bankTenantData, ...action.payload },
        lastUpdated: new Date(),
        error: null
      };
    
    case 'UPDATE_COMPLIANCE_DATA':
      return {
        ...state,
        complianceData: { ...state.complianceData, ...action.payload },
        lastUpdated: new Date(),
        error: null
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

  // Data fetching functions with error handling
  const fetchKPIs = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const kpis = await kpiServiceWithFallback.getKPIs();
      dispatch({ type: 'UPDATE_KPIS', payload: kpis });
    } catch (error) {
      console.error('Failed to fetch KPIs:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const fetchLiveFeed = async () => {
    try {
      const feed = await transactionServiceWithFallback.getLiveFeed(50);
      dispatch({ type: 'UPDATE_LIVE_FEED', payload: feed });
    } catch (error) {
      console.error('Failed to fetch live feed:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const fetchFlowMatrix = async () => {
    try {
      const matrix = await transactionServiceWithFallback.getFlowMatrix();
      dispatch({ type: 'UPDATE_FLOW_MATRIX', payload: matrix });
    } catch (error) {
      console.error('Failed to fetch flow matrix:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const fetchNPCIConnectivity = async () => {
    try {
      const connectivity = await npciServiceWithFallback.getStatus();
      dispatch({ type: 'UPDATE_NPCI_CONNECTIVITY', payload: connectivity });
    } catch (error) {
      console.error('Failed to fetch NPCI connectivity:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  // Auto-refresh effects
  useEffect(() => {
    // Initial data load
    fetchKPIs();
    fetchLiveFeed();
    fetchFlowMatrix();
    fetchNPCIConnectivity();

    // Set up refresh intervals
    const kpiInterval = setInterval(fetchKPIs, 5000); // 5 seconds
    const liveFeedInterval = setInterval(fetchLiveFeed, 1000); // 1 second
    const flowMatrixInterval = setInterval(fetchFlowMatrix, 10000); // 10 seconds
    const npciInterval = setInterval(fetchNPCIConnectivity, 3000); // 3 seconds

    return () => {
      clearInterval(kpiInterval);
      clearInterval(liveFeedInterval);
      clearInterval(flowMatrixInterval);
      clearInterval(npciInterval);
    };
  }, []);

  // Action creators
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

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const value = {
    ...state,
    updateKPIs,
    updateLiveFeed,
    addLiveFeedItem,
    updateFlowMatrix,
    updateFailureIntelligence,
    updateNPCIConnectivity,
    updateBankTenantData,
    updateComplianceData,
    addAlert,
    resolveAlert,
    setActiveTab,
    toggleMFA,
    clearError,
    // Refetch functions
    refetchKPIs: fetchKPIs,
    refetchLiveFeed: fetchLiveFeed,
    refetchFlowMatrix: fetchFlowMatrix,
    refetchNPCIConnectivity: fetchNPCIConnectivity
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
