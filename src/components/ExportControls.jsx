import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, Table, FileSpreadsheet, ChevronDown, CheckCircle, X } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ExportButton = ({ format, onClick, icon: Icon, label }) => (
  <motion.button
    onClick={onClick}
    className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
  </motion.button>
);

const ExportControls = () => {
  const { liveFeed, kpis } = useDashboard();
  const [showDropdown, setShowDropdown] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // TFL Section 18: Export formats with UI state management
  const exportFormats = [
    { id: 'csv', label: 'CSV', icon: Table, description: 'Comma-separated values' },
    { id: 'excel', label: 'Excel', icon: FileSpreadsheet, description: 'Microsoft Excel format' },
    { id: 'pdf', label: 'PDF', icon: FileText, description: 'Portable Document Format' },
    { id: 'json', label: 'JSON API', icon: Download, description: 'JavaScript Object Notation API' }
  ];
  
  // Show notification for export request
  const showNotification = (format, message) => {
    setNotification({
      format: format.toUpperCase(),
      message,
      timestamp: new Date().toLocaleTimeString()
    });
    
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };
  
  // TFL Section 18: Export functionality with actual file generation
  const handleExport = (format) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const formatInfo = exportFormats.find(f => f.id === format);
    
    console.log(`📊 Export Action Triggered: ${format.toUpperCase()}`);
    console.log(`📅 Timestamp: ${timestamp}`);
    console.log(`📊 Available Data: ${liveFeed.length} transactions`);
    
    // Show UI notification for export request
    let notificationMessage = '';
    
    switch (format) {
      case 'csv':
        console.log('🔧 Export Type: CSV Format');
        console.log('📄 File Name: `tfl_transactions_${timestamp}.csv`');
        console.log('📊 Data: First 1,000 transactions from live feed');
        notificationMessage = `CSV export requested: tfl_transactions_${timestamp}.csv (1,000 transactions)`;
        exportCSV(timestamp);
        break;
      case 'excel':
        console.log('🔧 Export Type: Excel Format');
        console.log('📄 File Name: `tfl_transactions_${timestamp}.xlsx`');
        console.log('📊 Data: First 1,000 transactions from live feed');
        notificationMessage = `Excel export requested: tfl_transactions_${timestamp}.xlsx (1,000 transactions)`;
        exportExcel(timestamp);
        break;
      case 'pdf':
        console.log('🔧 Export Type: PDF Format');
        console.log('📄 File Name: `tfl_transactions_${timestamp}.pdf`');
        console.log('📊 Data: First 100 transactions (formatted report)');
        notificationMessage = `PDF export requested: tfl_transactions_${timestamp}.pdf (100 transactions, formatted report)`;
        exportPDF(timestamp);
        break;
      case 'json':
        console.log('🔧 Export Type: JSON API Format');
        console.log('📄 File Name: `tfl_dashboard_${timestamp}.json`');
        console.log('📊 Data: Complete dashboard data (live feed + KPIs)');
        console.log('📊 Live Feed Records:', liveFeed.slice(0, 100));
        console.log('📊 KPI Data:', kpis);
        notificationMessage = `JSON API export requested: tfl_dashboard_${timestamp}.json (complete dashboard data)`;
        exportJSON(timestamp);
        break;
      default:
        console.log('❌ Unknown export format:', format);
        notificationMessage = `Unknown export format: ${format}`;
        break;
    }
    
    // Show notification
    showNotification(format, notificationMessage);
    setShowDropdown(false);
  };

  // TFL Section 18: CSV Export Implementation
  const exportCSV = (timestamp) => {
    try {
      const data = liveFeed.slice(0, 1000);
      const headers = ['Transaction ID', 'Timestamp', 'Amount', 'Status', 'RRN', 'Account'];
      const csvContent = [
        headers.join(','),
        ...data.map(txn => [
          txn.id || '',
          txn.timestamp || '',
          txn.amount || '',
          txn.status || '',
          txn.rrn || '',
          txn.account || ''
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `tfl_transactions_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ CSV export completed successfully');
    } catch (error) {
      console.error('❌ CSV export failed:', error);
    }
  };

  // TFL Section 18: Excel Export Implementation
  const exportExcel = (timestamp) => {
    try {
      const data = liveFeed.slice(0, 1000);
      const worksheet = XLSX.utils.json_to_sheet(data.map(txn => ({
        'Transaction ID': txn.id || '',
        'Timestamp': txn.timestamp || '',
        'Amount': txn.amount || '',
        'Status': txn.status || '',
        'RRN': txn.rrn || '',
        'Account': txn.account || ''
      })));
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
      
      // Add KPIs sheet
      const kpiWorksheet = XLSX.utils.json_to_sheet([
        { 'Metric': 'Total Transactions', 'Value': kpis.totalTransactions || 0 },
        { 'Metric': 'Success Rate', 'Value': `${kpis.successRate || 0}%` },
        { 'Metric': 'Average Response Time', 'Value': `${kpis.avgResponseTime || 0}ms` },
        { 'Metric': 'Error Rate', 'Value': `${kpis.errorRate || 0}%` },
        { 'Metric': 'Throughput', 'Value': `${kpis.throughput || 0} tps` }
      ]);
      XLSX.utils.book_append_sheet(workbook, kpiWorksheet, 'KPIs');
      
      XLSX.writeFile(workbook, `tfl_transactions_${timestamp}.xlsx`);
      console.log('✅ Excel export completed successfully');
    } catch (error) {
      console.error('❌ Excel export failed:', error);
    }
  };

  // TFL Section 18: PDF Export Implementation
  const exportPDF = (timestamp) => {
    try {
      const doc = new jsPDF();
      const data = liveFeed.slice(0, 100);
      
      // Add title
      doc.setFontSize(18);
      doc.text('TFL Transaction Report', 14, 22);
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);
      doc.text(`Total Transactions: ${data.length}`, 14, 42);
      
      // Add KPI summary
      doc.setFontSize(14);
      doc.text('KPI Summary', 14, 56);
      doc.setFontSize(10);
      doc.text(`Success Rate: ${kpis.successRate || 0}%`, 14, 66);
      doc.text(`Avg Response Time: ${kpis.avgResponseTime || 0}ms`, 14, 74);
      doc.text(`Error Rate: ${kpis.errorRate || 0}%`, 14, 82);
      
      // Add transactions table
      const tableData = data.map(txn => [
        txn.id || '',
        new Date(txn.timestamp).toLocaleString(),
        `₹${txn.amount || 0}`,
        txn.status || '',
        txn.rrn || ''
      ]);
      
      doc.autoTable({
        head: [['ID', 'Timestamp', 'Amount', 'Status', 'RRN']],
        body: tableData,
        startY: 92,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }
      });
      
      doc.save(`tfl_transactions_${timestamp}.pdf`);
      console.log('✅ PDF export completed successfully');
    } catch (error) {
      console.error('❌ PDF export failed:', error);
    }
  };

  // TFL Section 18: JSON Export Implementation
  const exportJSON = (timestamp) => {
    try {
      const exportData = {
        metadata: {
          generated: new Date().toISOString(),
          format: 'TFL Dashboard Export',
          version: '1.0',
          section: 'TFL Section 18 Compliance'
        },
        kpis: kpis,
        transactions: liveFeed.slice(0, 1000),
        summary: {
          totalTransactions: liveFeed.length,
          exportCount: Math.min(1000, liveFeed.length),
          successRate: kpis.successRate || 0,
          errorRate: kpis.errorRate || 0
        }
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `tfl_dashboard_${timestamp}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ JSON export completed successfully');
    } catch (error) {
      console.error('❌ JSON export failed:', error);
    }
  };

  return (
    <motion.div 
      className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
        <div className="text-sm text-gray-500">
          {liveFeed.length} records available
        </div>
      </div>
      
      {/* Export Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3"
          >
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-green-800">
                  Export Requested: {notification.format}
                </h4>
                <button
                  onClick={() => setNotification(null)}
                  className="text-green-600 hover:text-green-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-green-700 mt-1">{notification.message}</p>
              <p className="text-xs text-green-600 mt-2">Requested at {notification.timestamp}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Export Buttons Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {exportFormats.map((format) => (
          <ExportButton
            key={format.id}
            format={format.id}
            onClick={() => handleExport(format.id)}
            icon={format.icon}
            label={`Export ${format.label}`}
          />
        ))}
      </div>
      
      {/* Dropdown Alternative */}
      <div className="relative">
        <motion.button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>Choose Export Format</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </motion.button>
        
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
          >
            {exportFormats.map((format) => (
              <button
                key={format.id}
                onClick={() => handleExport(format.id)}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
              >
                <format.icon className="w-4 h-4 text-gray-600" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{format.label}</div>
                  <div className="text-xs text-gray-500">{format.description}</div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>• CSV/Excel: Up to 1,000 recent transactions</p>
        <p>• PDF: Up to 100 recent transactions (formatted report)</p>
        <p>• JSON API: Complete dashboard data (transactions + KPIs)</p>
        <p className="mt-2 text-blue-600 font-medium">📋 TFL Section 18: Export formats available</p>
      </div>
    </motion.div>
  );
};

export default ExportControls;
