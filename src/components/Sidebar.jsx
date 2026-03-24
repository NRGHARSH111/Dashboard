import React, { memo } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';

const Sidebar = memo(({ activeTab, setActiveTab }) => {
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
    <nav className="flex-1 overflow-y-auto">
      <ul className="space-y-1 p-2">
        {tabs.map((tab) => (
          <li key={tab.id}>
            <button
              onClick={() => handleTabChange(tab.id)}
              className={`w-full flex items-center justify-start p-3 rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-l-4 hover:border-gray-300'
              }`}
            >
              <span className="text-lg flex-shrink-0">{tab.icon}</span>
              <span className="ml-3 text-sm font-medium">{tab.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
});

export default Sidebar;
