import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Download, ChevronLeft, ChevronRight, Shield, Lock, Eye, ShieldCheck, Filter } from 'lucide-react';

/**
 * Audit & Compliance Panel Component - TFL Section 12
 * 
 * Sections:
 * A - Compliance Status Grid (5 cards)
 * B - Audit Access Log Table (paginated)
 * C - Export functionality
 */

const AuditCompliancePanel = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Section A - Compliance Status Data
  const complianceControls = useMemo(() => [
    {
      id: 1,
      name: 'Log Retention',
      value: '180 days',
      status: 'active',
      icon: Shield,
      lastVerified: new Date(Date.now() - Math.random() * 3600000) // Random time within last hour
    },
    {
      id: 2,
      name: 'Encryption',
      value: 'AES-256',
      status: 'enabled',
      icon: Lock,
      lastVerified: new Date(Date.now() - Math.random() * 3600000)
    },
    {
      id: 3,
      name: 'Data Masking',
      value: 'PII Fields',
      status: 'enabled',
      icon: Eye,
      lastVerified: new Date(Date.now() - Math.random() * 3600000)
    },
    {
      id: 4,
      name: 'Replay Protection',
      value: 'Token-based',
      status: 'enabled',
      icon: ShieldCheck,
      lastVerified: new Date(Date.now() - Math.random() * 3600000)
    },
    {
      id: 5,
      name: 'Duplicate Check',
      value: 'TxnID+RRN',
      status: 'active',
      icon: Filter,
      lastVerified: new Date(Date.now() - Math.random() * 3600000)
    }
  ], []); // empty deps = compute once on mount

  // Section B - Mock Audit Log Data
  const generateMockAuditLog = () => {
    const actions = ['Dashboard Login', 'Export Report', 'View Trace', 'Filter Applied', 'Alert Dismissed'];
    const roles = ['Admin', 'Operator', 'Viewer'];
    const users = ['john.doe', 'jane.smith', 'mike.wilson', 'sarah.jones', 'alex.brown', 'emma.davis', 'chris.miller', 'lisa.anderson'];
    const ipPrefixes = ['192.168.1.', '10.0.0.', '172.16.0.', '203.0.113.'];
    
    const log = [];
    for (let i = 0; i < 20; i++) {
      const timestamp = new Date(Date.now() - (i * 3600000) - Math.random() * 3600000); // Random time within last hour
      const success = Math.random() > 0.15; // 85% success rate
      
      log.push({
        id: i + 1,
        timestamp,
        user: users[Math.floor(Math.random() * users.length)],
        role: roles[Math.floor(Math.random() * roles.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        ipAddress: ipPrefixes[Math.floor(Math.random() * ipPrefixes.length)] + Math.floor(Math.random() * 255),
        result: success ? 'success' : 'failed'
      });
    }
    
    return log.sort((a, b) => b.timestamp - a.timestamp); // Most recent first
  };

  const auditLog = useMemo(() => generateMockAuditLog(), []);

  // Pagination logic
  const totalPages = Math.ceil(auditLog.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentRows = auditLog.slice(startIndex, endIndex);

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatLastVerified = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
      case 'enabled':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'disabled':
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getResultBadge = (result) => {
    return result === 'success' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'IP Address', 'Result'];
    const csvContent = [
      headers.join(','),
      ...auditLog.map(row => [
        `"${formatTimestamp(row.timestamp)}"`,
        `"${row.user}"`,
        `"${row.role}"`,
        `"${row.action}"`,
        `"${row.ipAddress}"`,
        `"${row.result.toUpperCase()}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_log_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6">
      {/* Section A - Compliance Status Grid */}
      <motion.div
        className="glass rounded-lg p-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Compliance Status</h2>
          <div className="text-sm text-gray-500">TFL Section 12 - Security Controls</div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {complianceControls.map((control, index) => {
            const Icon = control.icon;
            const isActive = control.status === 'active' || control.status === 'enabled';
            
            return (
              <motion.div
                key={control.id}
                variants={cardVariants}
                className="tfl-card p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(control.status)}`}>
                      {control.status}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{control.name}</h3>
                    <div className="text-sm text-gray-600 mb-2">{control.value}</div>
                  </div>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div className="flex items-center space-x-1">
                      {isActive ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-xs text-gray-500">
                        {formatLastVerified(control.lastVerified)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Section B - Audit Access Log Table */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <div className="glass rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Audit Access Log</h2>
              <p className="text-sm text-gray-600 mt-1">Recent system access and actions</p>
            </div>
            
            {/* Export Button */}
            <motion.button
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </motion.button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Timestamp</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Action</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">IP Address</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Result</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {currentRows.map((row, index) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {formatTimestamp(row.timestamp)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">{row.user}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{row.role}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{row.action}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{row.ipAddress}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getResultBadge(row.result)}`}>
                          {row.result}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, auditLog.length)} of {auditLog.length} entries
            </div>
            
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg border transition-colors ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                }`}
                whileHover={currentPage > 1 ? { scale: 1.02 } : {}}
                whileTap={currentPage > 1 ? { scale: 0.98 } : {}}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </motion.button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <motion.button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {page}
                  </motion.button>
                ))}
              </div>
              
              <motion.button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg border transition-colors ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                }`}
                whileHover={currentPage < totalPages ? { scale: 1.02 } : {}}
                whileTap={currentPage < totalPages ? { scale: 0.98 } : {}}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuditCompliancePanel;
