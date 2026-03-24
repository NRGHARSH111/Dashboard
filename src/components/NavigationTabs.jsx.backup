import React from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';

const NavigationTabs = ({ activeTab, setActiveTab }) => {
  const { addAuditLog } = useAuth();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'banl', label: 'BANL', icon: '🔄' },
    { id: 'imps', label: 'IMPS', icon: '💸' },
    { id: 'upi', label: 'UPI', icon: '📱' },
    { id: 'npci-link', label: 'NPCI Link', icon: '🛰' },
    { id: 'errors', label: 'Failure Intel', icon: '⚠' },
    { id: 'banks', label: 'Bank View', icon: '🏦' },
    { id: 'trace', label: 'Transaction Trace', icon: '🔍' },
    { id: 'logs', label: 'Logs', icon: '📋' },
    { id: 'audit', label: 'Audit', icon: '🛡' }
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    addAuditLog('TAB_SWITCH', tabId);
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default NavigationTabs;
