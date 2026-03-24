import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, User, LogOut, Bell, Settings, AlertTriangle, Database, FileText, Download, ChevronDown, FileSpreadsheet, FileJson, FileImage, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ToastNotification from './ToastNotification';

const Header = () => {
  const { user, logout, mfaVerified } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showReportDropdown, setShowReportDropdown] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('Hourly');
  const [exportingFormat, setExportingFormat] = useState(null);
  const [toast, setToast] = useState({ isVisible: false, type: 'success', message: '' });
  const reportDropdownRef = useRef(null);
  const userMenuRef = useRef(null);

  console.log('⚠️ Header: Data Source warning badge displayed - "Replica DB Only" (TFL Safety Guidelines)');
  console.log('🎨 Header: Solid bg-[#001f3f] background for seamless integration with Sidebar brand area');
  console.log('📊 Header: Enhanced export functionality with toast notifications implemented');

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (reportDropdownRef.current && !reportDropdownRef.current.contains(event.target)) {
        setShowReportDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const showToast = (type, message) => {
    setToast({ isVisible: true, type, message });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const handleExport = async (format) => {
    setExportingFormat(format);
    showToast('loading', `Preparing ${selectedReportType} report as ${format.toUpperCase()}...`);
    
    // Simulate export preparation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // Mock export logic
      console.log(`📊 Exporting ${selectedReportType} report as ${format}`);
      
      // Show success message
      showToast('success', `${selectedReportType} report exported successfully as ${format.toUpperCase()}!`);
      
      // In a real implementation, you would trigger the actual download here
      // For example: window.open(downloadUrl) or create a download link
      
    } catch (error) {
      showToast('error', `Failed to export ${selectedReportType} report as ${format.toUpperCase()}`);
    } finally {
      setExportingFormat(null);
    }
  };

  const reportTypes = [
    { value: 'Hourly', label: 'Hourly Report', description: 'Last 24 hours by hour' },
    { value: 'Daily', label: 'Daily Report', description: 'Last 30 days by day' },
    { value: 'Bank-wise', label: 'Bank-wise Report', description: 'Transactions by bank' },
    { value: 'Failure Analysis', label: 'Failure Analysis', description: 'Detailed failure metrics' },
    { value: 'NPCI SLA Report', label: 'NPCI SLA Report', description: 'NPCI service level analysis' }
  ];

  const exportFormats = [
    { value: 'csv', label: 'CSV', icon: FileSpreadsheet, color: 'text-green-400', shadowColor: 'shadow-green-500/25' },
    { value: 'excel', label: 'Excel', icon: FileSpreadsheet, color: 'text-green-500', shadowColor: 'shadow-green-600/25' },
    { value: 'pdf', label: 'PDF', icon: FileImage, color: 'text-red-400', shadowColor: 'shadow-red-500/25' },
    { value: 'json', label: 'JSON', icon: FileJson, color: 'text-blue-400', shadowColor: 'shadow-blue-500/25' }
  ];

  return (
    <header className="w-full bg-[#001f3f] text-white px-6 py-4 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Left Side - Dashboard Title */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-[#001f3f] font-bold text-lg">TFL</span>
            </div>
            <h1 className="text-2xl font-bold text-white">TFL Switch Monitoring Dashboard</h1>
          </div>
        </div>
        
        {/* Right Side - User Info and Status */}
        <div className="flex items-center space-x-6">
          {/* Reporting & Export Section */}
          <div className="flex items-center space-x-3">
            {/* Report Type Dropdown */}
            <div className="relative" ref={reportDropdownRef}>
              <button
                onClick={() => setShowReportDropdown(!showReportDropdown)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">{selectedReportType}</span>
                <ChevronDown className="w-4 h-4 text-white" />
              </button>
              
              {showReportDropdown && (
                <div className="absolute top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-3 py-2 border-b border-gray-200">
                    <p className="text-xs font-medium text-gray-500">Select Report Type</p>
                  </div>
                  {reportTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        setSelectedReportType(type.value);
                        setShowReportDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 ${
                        selectedReportType === type.value ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{type.label}</span>
                        <span className="text-xs text-gray-500">{type.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Export Buttons with 3D Shadow Effects */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">Export:</span>
              {exportFormats.map((format) => (
                <motion.button
                  key={format.value}
                  onClick={() => handleExport(format.value)}
                  disabled={exportingFormat === format.value}
                  className={`relative p-2 rounded-lg transition-all duration-200 ${
                    exportingFormat === format.value
                      ? 'bg-gray-700 cursor-not-allowed'
                      : 'hover:bg-gray-700 hover:scale-105 cursor-pointer'
                  }`}
                  whileHover={!exportingFormat ? { y: -2, boxShadow: `0 8px 16px ${format.shadowColor}` } : {}}
                  whileTap={!exportingFormat ? { scale: 0.95 } : {}}
                  title={`Export as ${format.label}`}
                >
                  {exportingFormat === format.value ? (
                    <Loader className={`w-4 h-4 ${format.color} animate-spin`} />
                  ) : (
                    <format.icon className={`w-4 h-4 ${format.color} group-hover:scale-110 transition-transform`} />
                  )}
                  {exportingFormat === format.value && (
                    <motion.div
                      className="absolute inset-0 rounded-lg border-2 border-blue-400"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
          {/* MFA Status */}
          <div className="flex items-center space-x-2 px-3 py-2 rounded-full bg-green-600 cursor-default">
            <Shield className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">
              MFA: Active
            </span>
          </div>
          
          {/* Data Source Warning Badge - TFL Safety Guidelines */}
          <div className="flex items-center space-x-2 px-4 py-2 bg-orange-600 border-2 border-orange-400 rounded-full shadow-lg">
            <AlertTriangle className="w-4 h-4 text-white" />
            <Database className="w-4 h-4 text-white" />
            <span className="text-sm font-bold text-white">Data Source: Replica DB Only</span>
          </div>
          
          {/* System Status */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">System Operational</span>
          </div>
           
          {/* Notifications */}
          <button className="relative p-2 text-gray-300 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-200">{user?.name || 'User'}</span>
            </button>
                 
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <p className="text-xs text-gray-500">Role: {user?.role}</p>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Shield className="w-3 h-3 mr-1" />
                      MFA: Active
                    </span>
                  </div>
                </div>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>  
            )}
          </div>
          
          {/* Current Time */}
          <div className="text-sm text-gray-300">
            {new Date().toLocaleString()}
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      <ToastNotification
        type={toast.type}
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={hideToast}
        duration={3000}
      />
    </header>
  );
};

export default Header;
