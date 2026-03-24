import React, { memo } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';

const Sidebar = memo(({ activeTab, setActiveTab }) => {
  const { addAuditLog } = useAuth();

  const navItems = [
    { 
      id: 'overview', 
      label: 'Overview', 
      emoji: '📊',
      description: 'Executive Summary'
    },
    { 
      id: 'banl', 
      label: 'BANL', 
      emoji: '🏦',
      description: 'BANL Switch'
    },
    { 
      id: 'imps', 
      label: 'IMPS', 
      emoji: '💸',
      description: 'IMPS Switch'
    },
    { 
      id: 'upi', 
      label: 'UPI', 
      emoji: '📱',
      description: 'UPI Switch'
    },
    { 
      id: 'npci-link', 
      label: 'NPCI Link', 
      emoji: '🛰️',
      description: 'Connectivity'
    },
    { 
      id: 'errors', 
      label: 'Errors', 
      emoji: '⚠️',
      description: 'Failure Analysis'
    },
    { 
      id: 'banks', 
      label: 'Banks', 
      emoji: '🏛️',
      description: 'Bank Tenant View'
    },
    { 
      id: 'trace', 
      label: 'Trace', 
      emoji: '🔍',
      description: 'Transaction Trace'
    },
    { 
      id: 'logs', 
      label: 'Logs', 
      emoji: '📋',
      description: 'Live Log Feed'
    },
    { 
      id: 'audit', 
      label: 'Audit', 
      emoji: '🛡️',
      description: 'Compliance & Audit'
    },
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    addAuditLog('TAB_SWITCH', tabId);
  };

  return (
    <nav className="flex-1 overflow-y-auto">
      <ul className="space-y-1 p-2">
        {navItems.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center justify-start p-3 rounded-lg transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-l-4 hover:border-gray-300'
              }`}
            >
              <span className="text-xl w-8 text-center 
                flex-shrink-0">
                {item.emoji}
              </span>
              <span className="text-sm font-medium">
                {item.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
});

export default Sidebar;
