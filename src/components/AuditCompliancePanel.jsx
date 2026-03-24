import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, Clock, CheckCircle, AlertTriangle, Lock, Database, Eye, Search, Filter } from 'lucide-react';

const ComplianceCard = ({ control, status, description, lastVerified, icon: Icon }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
      case 'ENABLED':
      case 'COMPLIANT':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'WARNING':
      case 'PARTIAL':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DISABLED':
      case 'NON_COMPLIANT':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIconColor = (status) => {
    switch (status) {
      case 'ACTIVE':
      case 'ENABLED':
      case 'COMPLIANT':
        return 'text-green-600';
      case 'WARNING':
      case 'PARTIAL':
        return 'text-yellow-600';
      case 'DISABLED':
      case 'NON_COMPLIANT':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <motion.div 
      className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-all ${getStatusColor(status)}`}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-gray-600`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800">{control}</h4>
            <p className="text-xs text-gray-600 mt-1">{description}</p>
          </div>
        </div>
        <div className={`flex items-center space-x-1 ${getIconColor(status)}`}>
          {status === 'ACTIVE' || status === 'ENABLED' || status === 'COMPLIANT' ? (
            <CheckCircle className="w-4 h-4" />
          ) : status === 'WARNING' || status === 'PARTIAL' ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span className="text-xs font-medium">{status}</span>
        </div>
      </div>
      
      <div className="text-xs text-gray-500">
        Last verified: {lastVerified}
      </div>
    </motion.div>
  );
};

const AuditLogTable = ({ logs }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-gray-700 font-medium">Timestamp</th>
            <th className="px-4 py-3 text-left text-gray-700 font-medium">User</th>
            <th className="px-4 py-3 text-left text-gray-700 font-medium">Action</th>
            <th className="px-4 py-3 text-left text-gray-700 font-medium">Resource</th>
            <th className="px-4 py-3 text-left text-gray-700 font-medium">IP Address</th>
            <th className="px-4 py-3 text-left text-gray-700 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {logs.map((log, index) => (
            <motion.tr 
              key={log.id}
              className="hover:bg-gray-50 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <td className="px-4 py-3 text-gray-600">
                {new Date(log.timestamp).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-800">
                      {log.user.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{log.user}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-700">{log.action}</td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                  {log.resource}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-gray-600">{log.ipAddress}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  log.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                  log.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {log.status}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const RetentionStatus = ({ policy, currentStatus, daysRemaining }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4">
    <div className="flex items-center justify-between mb-3">
      <h4 className="text-sm font-semibold text-gray-800">Log Retention Policy</h4>
      <div className="text-xs text-gray-500">180 days required</div>
    </div>
    
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Policy Status</span>
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
          {currentStatus}
        </span>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Days Remaining</span>
        <span className="text-sm font-medium text-gray-900">{daysRemaining} days</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-green-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(daysRemaining / 180) * 100}%` }}
        ></div>
      </div>
    </div>
  </div>
);

const AuditCompliancePanel = () => {
  const [activeTab, setActiveTab] = useState('controls');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [filteredLogs, setFilteredLogs] = useState([]);

  // Search options for audit logs
  const searchOptions = [
    { value: 'all', label: 'All Fields', placeholder: 'Search all audit data...' },
    { value: 'rrn', label: 'RRN', placeholder: 'Search by RRN...' },
    { value: 'utr', label: 'UTR', placeholder: 'Search by UTR...' },
    { value: 'stan', label: 'STAN', placeholder: 'Search by STAN...' },
    { value: 'user', label: 'User', placeholder: 'Search by user email...' },
    { value: 'action', label: 'Action', placeholder: 'Search by action...' },
    { value: 'resource', label: 'Resource', placeholder: 'Search by resource...' }
  ];

  // Mock compliance data
  const complianceControls = [
    {
      control: 'Log Retention',
      status: 'ACTIVE',
      description: '180 days log retention policy enforced',
      lastVerified: '2 hours ago',
      icon: Database
    },
    {
      control: 'Encryption',
      status: 'ENABLED',
      description: 'AES-256 encryption for data at rest and in transit',
      lastVerified: '1 hour ago',
      icon: Lock
    },
    {
      control: 'Data Masking',
      status: 'ENABLED',
      description: 'Sensitive data masking in logs and displays',
      lastVerified: '30 mins ago',
      icon: Eye
    },
    {
      control: 'Replay Protection',
      status: 'ACTIVE',
      description: 'Transaction replay attack prevention enabled',
      lastVerified: '15 mins ago',
      icon: Shield
    },
    {
      control: 'Duplicate Check',
      status: 'ACTIVE',
      description: 'Real-time duplicate transaction detection',
      lastVerified: '5 mins ago',
      icon: CheckCircle
    }
  ];

  // Enhanced mock audit logs with RRN, UTR, and STAN
  const auditLogs = [
    {
      id: 1,
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      user: 'ganesh@tfl.com',
      action: 'Transaction Query',
      resource: 'Transactions',
      rrn: '012345678901',
      utr: '123456789012',
      stan: '000001',
      ipAddress: '192.168.1.100',
      status: 'SUCCESS'
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      user: 'operator@tfl.com',
      action: 'Export Data',
      resource: 'Transactions',
      rrn: '012345678902',
      utr: '123456789013',
      stan: '000002',
      ipAddress: '192.168.1.101',
      status: 'SUCCESS'
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      user: 'auditor@tfl.com',
      action: 'View Logs',
      resource: 'Audit Trail',
      rrn: null,
      utr: null,
      stan: null,
      ipAddress: '192.168.1.102',
      status: 'SUCCESS'
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      user: 'unknown@external.com',
      action: 'Login Attempt',
      resource: 'System',
      rrn: null,
      utr: null,
      stan: null,
      ipAddress: '10.0.0.50',
      status: 'FAILED'
    },
    {
      id: 5,
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      user: 'ganesh@tfl.com',
      action: 'Configuration Change',
      resource: 'Alert Rules',
      rrn: null,
      utr: null,
      stan: null,
      ipAddress: '192.168.1.100',
      status: 'SUCCESS'
    },
    {
      id: 6,
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      user: 'operator@tfl.com',
      action: 'Transaction Trace',
      resource: 'Transaction Details',
      rrn: '012345678903',
      utr: '123456789014',
      stan: '000003',
      ipAddress: '192.168.1.101',
      status: 'SUCCESS'
    }
  ];

  // Filter logs based on search
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLogs(auditLogs);
    } else {
      const filtered = auditLogs.filter(log => {
        const query = searchQuery.toLowerCase();
        
        switch (searchType) {
          case 'rrn':
            return log.rrn && log.rrn.toLowerCase().includes(query);
          case 'utr':
            return log.utr && log.utr.toLowerCase().includes(query);
          case 'stan':
            return log.stan && log.stan.toLowerCase().includes(query);
          case 'user':
            return log.user.toLowerCase().includes(query);
          case 'action':
            return log.action.toLowerCase().includes(query);
          case 'resource':
            return log.resource.toLowerCase().includes(query);
          case 'all':
          default:
            return (
              log.user.toLowerCase().includes(query) ||
              log.action.toLowerCase().includes(query) ||
              log.resource.toLowerCase().includes(query) ||
              (log.rrn && log.rrn.toLowerCase().includes(query)) ||
              (log.utr && log.utr.toLowerCase().includes(query)) ||
              (log.stan && log.stan.toLowerCase().includes(query))
            );
        }
      });
      setFilteredLogs(filtered);
    }
  }, [searchQuery, searchType, auditLogs]);

  // Enhanced Audit Log Table with RRN, UTR, STAN columns
  const EnhancedAuditLogTable = ({ logs }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-gray-700 font-medium">Timestamp</th>
              <th className="px-4 py-3 text-left text-gray-700 font-medium">User</th>
              <th className="px-4 py-3 text-left text-gray-700 font-medium">Action</th>
              <th className="px-4 py-3 text-left text-gray-700 font-medium">RRN</th>
              <th className="px-4 py-3 text-left text-gray-700 font-medium">UTR</th>
              <th className="px-4 py-3 text-left text-gray-700 font-medium">STAN</th>
              <th className="px-4 py-3 text-left text-gray-700 font-medium">IP Address</th>
              <th className="px-4 py-3 text-left text-gray-700 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.map((log, index) => (
              <motion.tr 
                key={log.id}
                className="hover:bg-gray-50 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <td className="px-4 py-3 text-gray-600">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-800">
                        {log.user.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{log.user}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">{log.action}</td>
                <td className="px-4 py-3">
                  {log.rrn ? (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono font-medium">
                      {log.rrn}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {log.utr ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-mono font-medium">
                      {log.utr}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {log.stan ? (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-mono font-medium">
                      {log.stan}
                    </span>                    
                  ) : (     
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{log.ipAddress}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    log.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                    log.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {log.status}
                  </span>
                </td>
              </motion.tr>
           ))}
          </tbody>
        </table>
      </div>
    </div>
   );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Compliance & Audit Panel</h2>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Regulatory Monitoring</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {['controls', 'logs', 'retention'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'controls' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800">Compliance Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {complianceControls.map((control, index) => (
              <motion.div
                key={control.control}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <ComplianceCard {...control} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-800">Audit Trail</h3>
            <div className="text-sm text-gray-500">
              {filteredLogs.length} of {auditLogs.length} records
            </div>
          </div>
          
          {/* Search Controls */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Type Selector */}
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {searchOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Search Input */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchOptions.find(opt => opt.value === searchType)?.placeholder || 'Search...'}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              {/* Clear Button */}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Clear
                </button>
              )}
            </div>
            
            {/* Search Info */}
            {searchQuery && (
              <div className="mt-2 text-xs text-gray-500">
                Searching in <span className="font-medium">{searchOptions.find(opt => opt.value === searchType)?.label}</span> for "<span className="font-medium">{searchQuery}</span>"
              </div>
            )}
          </div>
          
          <EnhancedAuditLogTable logs={filteredLogs} />
        </div>
      )}

      {activeTab === 'retention' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800">Data Retention Status</h3>
          <RetentionStatus 
            policy="180 Days"
            currentStatus="COMPLIANT"
            daysRemaining={165}
          />
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Retention Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span className="text-gray-600">All logs retained for 180 days</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span className="text-gray-600">Automated cleanup scheduled</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Database className="w-3 h-3 text-blue-600" />
                  <span className="text-gray-600">Storage usage: 2.3TB / 5TB</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3 text-yellow-600" />
                  <span className="text-gray-600">Next cleanup: 15 days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Status Footer */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            System is fully compliant with regulatory requirements
          </span>
        </div>
      </div>
    </div>
  );
};

export default AuditCompliancePanel;
