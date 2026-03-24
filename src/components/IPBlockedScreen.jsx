import React from 'react';
import { ShieldOff, Phone, Mail } from 'lucide-react';

const IPBlockedScreen = () => (
  <div className="min-h-screen flex items-center 
    justify-center bg-gray-50">
    <div className="glass rounded-xl p-10 
      max-w-md text-center shadow-lg">
      <div className="w-16 h-16 bg-red-100 
        rounded-full flex items-center justify-center 
        mx-auto mb-6">
        <ShieldOff className="w-8 h-8 
          text-status-failure" />
      </div>
      <h1 className="text-2xl font-bold 
        text-gray-900 mb-2">
        Access Denied
      </h1>
      <p className="text-gray-600 text-sm mb-6">
        Your IP address is not whitelisted to access 
        the TFL Switch Monitoring Dashboard. 
        Please contact your system administrator.
      </p>
      <div className="bg-red-50 border border-red-200 
        rounded-lg p-4 text-left space-y-2">
        <p className="text-xs font-medium 
          text-red-800">
          TFL Security Policy — Section 17
        </p>
        <div className="flex items-center 
          space-x-2 text-xs text-red-700">
          <Phone className="w-3 h-3" />
          <span>Contact IT Support for IP whitelisting</span>
        </div>
        <div className="flex items-center 
          space-x-2 text-xs text-red-700">
          <Mail className="w-3 h-3" />
          <span>support@trustfintech.com</span>
        </div>
      </div>
    </div>
  </div>
);

export default IPBlockedScreen;
