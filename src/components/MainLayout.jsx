import { useState } from 'react';
import { Activity, Shield, Satellite, Radar, Download, Lock } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

const MainLayout = ({ children }) => {
  const { activeTab, setActiveTab, mfaVerified, toggleMFA } = useDashboard();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'banl', label: 'BANL', icon: Activity },
    { id: 'imps', label: 'IMPS', icon: Activity },
    { id: 'upi', label: 'UPI', icon: Activity },
    { id: 'npci-link', label: 'NPCI Link', icon: Satellite },
    { id: 'errors', label: 'Errors', icon: Activity },
    { id: 'banks', label: 'Banks', icon: Activity },
    { id: 'logs', label: 'Logs', icon: Activity },
    { id: 'audit', label: 'Audit', icon: Shield },
  ];

  const handleExport = (format) => {
    console.log(`Exporting as ${format}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Radar className="w-8 h-8 text-blue-400" />
                <h1 className="text-2xl font-bold">TFL Switch Monitoring Dashboard</h1>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400">Live</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* MFA Status */}
              <button
                onClick={toggleMFA}
                className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                  mfaVerified 
                    ? 'bg-green-900 text-green-300 border border-green-700' 
                    : 'bg-red-900 text-red-300 border border-red-700'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>MFA: {mfaVerified ? 'Verified' : 'Not Verified'}</span>
              </button>

              {/* Export Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleExport('csv')}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="flex items-center space-x-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>JSON</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
