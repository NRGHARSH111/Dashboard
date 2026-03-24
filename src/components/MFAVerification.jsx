import React, { useState } from 'react';
import { Shield, X, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MFAVerification = ({ isOpen, onClose }) => {
  const { sendOTP, verifyOTP, mfaVerified } = useAuth();
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOTP = async () => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsSending(true);
    setError('');
    
    try {
      const result = await sendOTP(mobileNumber);
      if (result.success) {
        setOtpSent(true);
        setSuccess('OTP sent successfully! For testing, use: 123456');
        console.log('🔐 MFAVerification: OTP sent successfully for TFL Section 17 compliance');
      } else {
        setError(result.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }

    setIsVerifying(true);
    setError('');
    
    try {
      const result = await verifyOTP(otpCode);
      if (result.success) {
        setSuccess('OTP verified successfully! MFA is now active.');
        console.log('✅ MFAVerification: OTP verified successfully - TFL Section 17 compliance achieved');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.error || 'Invalid OTP code');
      }
    } catch (err) {
      setError('OTP verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = () => {
    setMobileNumber('');
    setOtpCode('');
    setOtpSent(false);
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    if (mfaVerified) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6" />
              <h2 className="text-xl font-bold">MFA Verification</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
              disabled={!mfaVerified}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm mt-2 text-blue-100">
            TFL Section 17 - Security Compliance
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {!mfaVerified ? (
            <>
              {/* Mobile Number Input */}
              {!otpSent ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Smartphone className="w-4 h-4 inline mr-2" />
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Enter 10-digit mobile number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      maxLength={10}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter your registered mobile number for OTP verification
                    </p>
                  </div>

                  {/* Send OTP Button */}
                  <button
                    onClick={handleSendOTP}
                    disabled={isSending || !mobileNumber || mobileNumber.length !== 10}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {isSending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-4 h-4" />
                        <span>Send OTP</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* OTP Verification */
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-green-800">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">OTP Sent Successfully</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      To {mobileNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Shield className="w-4 h-4 inline mr-2" />
                      Enter OTP Code
                    </label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-center text-lg font-mono"
                      maxLength={6}
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      For testing purposes, use: 123456
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={handleVerifyOTP}
                      disabled={isVerifying || !otpCode || otpCode.length !== 6}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      {isVerifying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Verify OTP</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleReset}
                      className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Change Mobile Number
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-red-800">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-green-800">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{success}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Success State */
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                MFA Verification Complete
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Your account is now secured with multi-factor authentication.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 font-medium">
                  ✅ TFL Section 17 Compliance Achieved
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg">
          <p className="text-xs text-gray-500 text-center">
            🔒 This verification enhances your account security as per TFL guidelines
          </p>
        </div>
      </div>
    </div>
  );
};

export default MFAVerification;
