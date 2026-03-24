import React, { useState, useEffect, useRef } from 'react';
import { X, Smartphone, Shield, Lock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MFAModal = ({ isOpen, onClose, onMFAVerified }) => {
  const { sendOTP, verifyOTP, setupRecaptcha, otpSent, phoneNumber, loading, error, recaptchaVerifier, otpRateLimit, mockMode, mockNotification } = useAuth();
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [initError, setInitError] = useState(null);
  const recaptchaContainerRef = useRef(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Initialize reCAPTCHA when modal opens
  useEffect(() => {
    if (isOpen && recaptchaContainerRef.current && !recaptchaReady) {
      const initializeRecaptcha = async () => {
        try {
          console.log('🔐 MFAModal: Starting reCAPTCHA initialization...');
          await setupRecaptcha('recaptcha-container');
          setRecaptchaReady(true);
          setInitError(null);
          console.log('✅ MFAModal: reCAPTCHA initialized successfully');
        } catch (error) {
          console.error('❌ MFAModal: reCAPTCHA initialization failed:', error);
          setInitError(error.message || 'Failed to initialize reCAPTCHA');
          setRecaptchaReady(false);
        }
      };
      
      // Small delay to ensure DOM is ready
      const timer = setTimeout(initializeRecaptcha, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, recaptchaReady, setupRecaptcha]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      console.log('🔄 MFAModal: Resetting state on modal close');
      setMobileNumber('');
      setOtpCode('');
      setCountdown(0);
      setIsSendingOTP(false);
      setIsVerifyingOTP(false);
      setInitError(null);
      setRecaptchaReady(false);
    }
  }, [isOpen]);

  // Check for rate limiting
  useEffect(() => {
    if (otpRateLimit && otpRateLimit.blockedUntil) {
      const now = new Date();
      if (now < otpRateLimit.blockedUntil) {
        const remainingTime = Math.ceil((otpRateLimit.blockedUntil - now) / 1000);
        setCountdown(remainingTime);
      } else {
        setCountdown(0);
      }
    }
  }, [otpRateLimit]);

  const handleSendOTP = async () => {
    console.log('📱 MFAModal: Send OTP clicked', { 
      mobileNumber, 
      mobileNumberLength: mobileNumber?.length, 
      recaptchaReady, 
      recaptchaVerifier: !!recaptchaVerifier,
      otpRateLimit,
      mockMode
    });
    
    // Handle Mock Mode - skip validation and directly show OTP input
    if (mockMode) {
      console.log('🔧 MFAModal: Using Mock Mode - skipping reCAPTCHA and Firebase');
      setInitError(null);
      return; // In mock mode, OTP is already "sent" when rate limit triggered
    }
    
    // Normal validation checks for non-mock mode
    if (!mobileNumber || mobileNumber.length !== 10) {
      console.log('❌ MFAModal: Invalid mobile number', { mobileNumber, length: mobileNumber?.length });
      return;
    }

    if (!recaptchaReady || !recaptchaVerifier) {
      console.log('❌ MFAModal: reCAPTCHA not ready', { recaptchaReady, recaptchaVerifier: !!recaptchaVerifier });
      setInitError('reCAPTCHA not initialized. Please wait...');
      return;
    }

    // Check for existing rate limit
    if (otpRateLimit && otpRateLimit.blockedUntil) {
      const now = new Date();
      if (now < otpRateLimit.blockedUntil) {
        const remainingTime = Math.ceil((otpRateLimit.blockedUntil - now) / 1000);
        console.log('⏰ MFAModal: Rate limit active', { remainingTime });
        setCountdown(remainingTime);
        setInitError(`Security limit reached. Please wait ${remainingTime} seconds before trying again.`);
        return;
      }
    }

    setIsSendingOTP(true);
    setInitError(null);
    
    try {
      console.log('📤 MFAModal: Sending OTP to', mobileNumber);
      const result = await sendOTP(mobileNumber);
      
      if (result.success) {
        setCountdown(60);
        console.log('✅ MFAModal: OTP sent successfully');
      } else {
        // Handle rate limiting with enhanced feedback
        if (result.isRateLimit) {
          const waitTime = result.cooldownTime || 60;
          setCountdown(waitTime);
          console.log('⏰ MFAModal: Rate limit activated', { waitTime });
        }
        setInitError(result.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('❌ MFAModal: Failed to send OTP:', error);
      setInitError(error.message || 'Failed to send OTP');
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      return;
    }

    setIsVerifyingOTP(true);
    try {
      const result = await verifyOTP(otpCode);
      if (result.success) {
        console.log('✅ MFAModal: OTP verified successfully');
        if (onMFAVerified) {
          onMFAVerified();
        }
        onClose();
      }
    } catch (error) {
      console.error('❌ MFAModal: OTP verification failed:', error);
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const handleResendOTP = () => {
    setCountdown(60);
    handleSendOTP();
  };

  const handleMobileNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(value);
  };

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(value);
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 text-white rounded-xl w-full max-w-md border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Multi-Factor Authentication</h2>
              <p className="text-sm text-gray-400">Verify your identity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Mock Mode Notification */}
          {mockMode && mockNotification && (
            <div className="flex items-center space-x-3 p-4 bg-blue-900 border border-blue-600 rounded-lg">
              <Lock className="w-5 h-5 text-blue-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-300">{mockNotification}</p>
                <p className="text-xs text-blue-400 mt-1">Firebase rate limit reached - using development mode</p>
              </div>
            </div>
          )}
          
          {/* Mobile Number Input */}
          {!otpSent ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Smartphone className="w-4 h-4" />
                <span>Enter your mobile number for OTP verification</span>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={handleMobileNumberChange}
                    onKeyPress={(e) => handleKeyPress(e, handleSendOTP)}
                    placeholder="9876543210"
                    className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                    disabled={isSendingOTP}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}
              
              {initError && (
                <div className="flex items-center space-x-2 text-yellow-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{initError}</span>
                </div>
              )}

              <button
                onClick={handleSendOTP}
                disabled={mobileNumber.length !== 10 || isSendingOTP || !recaptchaReady || !recaptchaVerifier || countdown > 0}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 relative z-10"
                style={{ pointerEvents: (mobileNumber.length !== 10 || isSendingOTP || !recaptchaReady || !recaptchaVerifier || countdown > 0) ? 'none' : 'auto' }}
              >
                {isSendingOTP ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : countdown > 0 ? (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Wait {countdown}s</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Send OTP</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* OTP Input */
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>OTP sent to {phoneNumber}</span>
              </div>

              {/* Mock Mode Hint */}
              {mockMode && (
                <div className="flex items-center space-x-2 p-3 bg-blue-800 border border-blue-500 rounded-lg">
                  <Lock className="w-4 h-4 text-blue-300" />
                  <span className="text-sm text-blue-300">Use code: <span className="font-mono font-bold">123456</span></span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={handleOTPChange}
                  onKeyPress={(e) => handleKeyPress(e, handleVerifyOTP)}
                  placeholder="123456"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 text-center text-xl font-mono"
                  disabled={isVerifyingOTP}
                  maxLength={6}
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleVerifyOTP}
                disabled={otpCode.length !== 6 || isVerifyingOTP}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                {isVerifyingOTP ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Verify OTP</span>
                  </>
                )}
              </button>

              {/* Resend OTP */}
              <div className="text-center">
                <button
                  onClick={handleResendOTP}
                  disabled={countdown > 0}
                  className="text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed text-sm"
                >
                  {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-800 border-t border-gray-700 rounded-b-xl">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
            <Lock className="w-3 h-3" />
            <span>Secure OTP verification powered by Firebase</span>
          </div>
        </div>

        {/* Hidden reCAPTCHA container - ensure it's not blocking clicks */}
        <div 
          id="recaptcha-container" 
          ref={recaptchaContainerRef} 
          className="hidden" 
          style={{ 
            position: 'absolute',
            zIndex: -1,
            pointerEvents: 'none'
          }} 
        />
      </div>
    </div>
  );
};

export default MFAModal;
