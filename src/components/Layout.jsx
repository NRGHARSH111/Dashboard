import React from 'react';
import { Shield, Clock } from 'lucide-react';

const Layout = ({ children, activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'banl', label: 'BANL' },
    { id: 'imps', label: 'IMPS' },
    { id: 'upi', label: 'UPI' },
    { id: 'npci-link', label: 'NPCI Link' },
    { id: 'errors', label: 'Errors' },
    { id: 'banks', label: 'Banks' },
    { id: 'logs', label: 'Logs' },
    { id: 'audit', label: 'Audit' }
  ];scroll

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand-blue text-white shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-brand-blue font-bold text-lg">TFL</span>
                </div>
                <h1 className="text-2xl font-bold">TFL Switch Monitoring</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* MFA Verified Badge */}
              <div className="flex items-center space-x-2 bg-green-600 px-3 py-1 rounded-full">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">MFA: Verified</span>
              </div>
              
              {/* System Status */}
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">System Operational</span>
              </div>
              
              {/* Current Time */}
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4" />
                <span>{new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="bg-blue-900 px-6">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                  activeTab === tab.id
                    ? 'text-white border-white bg-blue-800'
                    : 'text-blue-200 border-transparent hover:text-white hover:bg-blue-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
