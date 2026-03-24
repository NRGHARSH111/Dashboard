import React, { useState, useEffect, useCallback, memo, Suspense, lazy } from 'react';
import { DashboardProvider } from './context/DashboardContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import KPICards from './components/KPICards';
import FlowMatrix from './components/FlowMatrix';
import LiveFeed from './components/LiveFeed';
import LiveScrollingFeed from './components/LiveScrollingFeed';
import ConnectivityHealth from './components/ConnectivityHealth';
import ExportControls from './components/ExportControls';
import SLALatencyHeatmap from './components/SLALatencyHeatmap';
import FailureIntelligencePanel from './components/FailureIntelligencePanel';
import BankTenantView from './components/BankTenantView';
import AuditCompliancePanel from './components/AuditCompliancePanel';
import TransactionTracePanel from './components/TransactionTracePanel';
import Login from './components/Login';
import AlertSystem from './components/AlertSystem';
import SecurityWrapper from './components/SecurityWrapper';
import IPBlockedScreen from './components/IPBlockedScreen';

const NPCIConnectivityMonitor = lazy(() => import('./components/NPCIConnectivityMonitor'));

const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

const DashboardContent = memo(({ activeTab }) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <ErrorBoundary fallbackMessage="Failed to load overview dashboard">
            <div className="flex flex-col gap-4">
              <SecurityWrapper featureName="Overview Dashboard" showWarning={true}>
                <div className="glass rounded-lg p-4 mb-4">
                  <KPICards />
                </div>
                <div className="glass rounded-lg p-4 mb-4">
                  <FlowMatrix />
                </div>
                <div className="glass rounded-lg p-4 mb-4">
                  <SLALatencyHeatmap />
                </div>
                <div className="glass rounded-lg p-4 mb-4">
                  <LiveFeed />
                </div>
                <div className="glass rounded-lg p-4">
                  <ExportControls />
                </div>
              </SecurityWrapper>
            </div>
          </ErrorBoundary>
        );
      case 'banl':
      case 'imps':
      case 'upi':
        return (
          <ErrorBoundary fallbackMessage="Failed to load transaction dashboard">
            <div className="flex flex-col gap-4">
              <KPICards />
              <FlowMatrix />
              <SLALatencyHeatmap />
              <LiveFeed />
            </div>
          </ErrorBoundary>
        );
      case 'npci-link':
        return (
          <ErrorBoundary fallbackMessage="Failed to load NPCI connectivity">
            <div className="flex flex-col gap-4">
              <SecurityWrapper featureName="NPCI Link Monitoring" showWarning={true}>
                <div className="glass rounded-lg p-4 mb-4">
                  <Suspense fallback={
                    <div className="flex items-center justify-center h-64 glass rounded-lg border border-gray-200">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-600">Loading NPCI Monitor...</span>
                      </div>
                    </div>
                  }>
                    <NPCIConnectivityMonitor />
                  </Suspense>
                </div>
                <div className="glass rounded-lg p-4 mb-4">
                  <ConnectivityHealth />
                </div>
              </SecurityWrapper>
            </div>
          </ErrorBoundary>
        );
      case 'errors':
        return (
          <ErrorBoundary fallbackMessage="Failed to load error analysis">
            <div className="flex flex-col gap-4">
              <FailureIntelligencePanel />
              <KPICards />
              <LiveFeed />
            </div>
          </ErrorBoundary>
        );
      case 'banks':
        return (
          <ErrorBoundary fallbackMessage="Failed to load bank dashboard">
            <div className="flex flex-col gap-4">
              <BankTenantView />
              <KPICards />
              <FlowMatrix />
            </div>
          </ErrorBoundary>
        );
      case 'trace':
        return (
          <ErrorBoundary fallbackMessage="Failed to load transaction trace">
            <div className="flex flex-col gap-4">
              <SecurityWrapper featureName="Transaction Trace" showWarning={true}>
                <TransactionTracePanel />
                <LiveScrollingFeed />
              </SecurityWrapper>
            </div>
          </ErrorBoundary>
        );
      case 'logs':
        return (
          <ErrorBoundary fallbackMessage="Failed to load logs">
            <div className="flex flex-col gap-4">
              <LiveScrollingFeed />
            </div>
          </ErrorBoundary>
        );
      case 'audit':
        return (
          <ErrorBoundary fallbackMessage="Failed to load audit panel">
            <div className="flex flex-col gap-4">
              <SecurityWrapper featureName="Audit & Compliance" showWarning={true}>
                <AuditCompliancePanel />
                <LiveFeed />
              </SecurityWrapper>
            </div>
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary fallbackMessage="Failed to load dashboard">
            <div className="flex flex-col gap-4">
              <KPICards />
              <FlowMatrix />
              <LiveFeed />
            </div>
          </ErrorBoundary>
        );
    }
  };

  return <div className="w-full">{renderTabContent()}</div>;
});

const AuthenticatedApp = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isIPBlocked, setIsIPBlocked] = useState(false);
  const { updateActivity, isAuthenticated } = useAuth();

  const throttledUpdateActivity = useCallback(
    throttle(() => updateActivity(), 2000),
    [updateActivity]
  );

  useEffect(() => {
    window.addEventListener('mousemove', throttledUpdateActivity);
    window.addEventListener('keypress', throttledUpdateActivity);
    window.addEventListener('click', throttledUpdateActivity);
    window.addEventListener('scroll', throttledUpdateActivity);

    const handleUnhandledRejection = (event) => {
      if (event.reason?.type === 'IP_BLOCKED') {
        setIsIPBlocked(true);
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('mousemove', throttledUpdateActivity);
      window.removeEventListener('keypress', throttledUpdateActivity);
      window.removeEventListener('click', throttledUpdateActivity);
      window.removeEventListener('scroll', throttledUpdateActivity);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [throttledUpdateActivity]);

  if (!isAuthenticated) {
    return <Login />;
  }

  if (isIPBlocked) {
    return <IPBlockedScreen />;
  }

  return (
    <DashboardProvider>
      <div className="flex h-screen w-screen overflow-hidden">
        <aside className="w-56 h-full glass border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="p-4 bg-[#001f3f] border-b border-gray-700">
            <h1 className="text-xl font-bold text-white">TFL Switch</h1>
          </div>
          <nav className="flex-1 overflow-y-auto">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          </nav>
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center gap-2 text-status-success text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-status-success"></span>
              System Active
            </div>
          </div>
        </aside>
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <DashboardContent activeTab={activeTab} />
          </main>
          <AlertSystem />
        </div>
      </div>
    </DashboardProvider>
  );
};

function App() {
  return (
    <ErrorBoundary fallbackMessage="Application failed to load">
      <AuthProvider>
        <ErrorBoundary fallbackMessage="Authentication failed">
          <AuthenticatedApp />
        </ErrorBoundary>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
