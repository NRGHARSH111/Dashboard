import React from 'react';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MFAModal from './MFAModal';

const SecurityWrapper = ({ children, featureName = "Dashboard Feature", showWarning = true }) => {
  const { mfaVerified, isAuthenticated } = useAuth();
  const [showMFAModal, setShowMFAModal] = React.useState(false);

  const handleMFAVerified = () => {
    console.log(`✅ SecurityWrapper: MFA verified for ${featureName}`);
  };

  // If user is not authenticated, don't render anything (AuthContext handles this)
  if (!isAuthenticated) {
    return null;
  }

  // If MFA is verified, render the children
  if (mfaVerified) {
    return <>{children}</>;
  }

  // If MFA is not verified, show warning and prompt
  return (
    <>
      {showWarning && (
        <div className="glass rounded-lg p-8 mb-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            {/* Warning Icon */}
            <div className="p-3 bg-yellow-100 rounded-full">
              <Shield className="w-8 h-8 text-yellow-600" />
            </div>
            
            {/* Warning Message */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">
                MFA Verification Required
              </h3>
              <p className="text-gray-600 max-w-md">
                This {featureName} requires Multi-Factor Authentication for security compliance. 
                Please verify your mobile number to access this feature.
              </p>
            </div>

            {/* Security Badge */}
            <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-full">
              <Lock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                TFL Security Compliance
              </span>
            </div>

            {/* Action Button */}
            <button
              onClick={() => setShowMFAModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Shield className="w-4 h-4" />
              <span>Verify with OTP</span>
            </button>
          </div>
        </div>
      )}

      {/* MFA Modal */}
      <MFAModal
        isOpen={showMFAModal}
        onClose={() => setShowMFAModal(false)}
        onMFAVerified={handleMFAVerified}
      />

      {/* Console logging for security compliance */}
      {console.log('🔒 SecurityWrapper: Access blocked - MFA verification required for', featureName)}
    </>
  );
};

export default SecurityWrapper;
