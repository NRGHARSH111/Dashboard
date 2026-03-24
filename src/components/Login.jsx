import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Mail, Eye, EyeOff, AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginForm = () => {
  const { login, loading, error, loginAttempts } = useAuth();
  const isDev = import.meta.env.DEV;
  const [currentStep, setCurrentStep] = useState(1);
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [countdown, setCountdown] = useState(30);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutCountdown, setLockoutCountdown] = useState(0);
  
  const inputRefs = useRef([]);
  const countdownInterval = useRef(null);
  const lockoutInterval = useRef(null);

  // Mock OTP - TODO: Replace with real API
  const MOCK_OTP = '123456';

  // Handle countdown timer
  useEffect(() => {
    if (currentStep === 2 && countdown > 0) {
      countdownInterval.current = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsResendDisabled(false);
      clearInterval(countdownInterval.current);
    }

    return () => clearInterval(countdownInterval.current);
  }, [countdown, currentStep, isResendDisabled]);

  // Handle lockout timer
  useEffect(() => {
    if (isLocked && lockoutCountdown > 0) {
      lockoutInterval.current = setInterval(() => {
        setLockoutCountdown(prev => prev - 1);
      }, 1000);
    } else if (lockoutCountdown === 0) {
      setIsLocked(false);
      setOtpAttempts(0);
      clearInterval(lockoutInterval.current);
    }

    return () => clearInterval(lockoutInterval.current);
  }, [lockoutCountdown, isLocked]);

  // Initialize countdown when moving to step 2
  useEffect(() => {
    if (currentStep === 2) {
      setCountdown(30);
      setIsResendDisabled(true);
      setOtpValues(['', '', '', '', '', '']);
      setOtpAttempts(0);
      setOtpError('');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [currentStep]);

  // Auto-submit when all OTP digits are entered
  useEffect(() => {
    if (otpValues.every(v => v !== '') && !isLocked && currentStep === 2) {
      const timer = setTimeout(() => {
        handleOtpSubmit({ preventDefault: () => {} });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [otpValues]);

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    
    // Mock validation - in real app, this would call API to verify credentials
    if (credentials.email && credentials.password) {
      // Simulate API validation
      const isValidCredentials = credentials.email === 'ganesh@tfl.com' && credentials.password === 'password123';
      
      if (isValidCredentials) {
        setCurrentStep(2);
      } else {
        setOtpError('Invalid credentials');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '');
    if (!digit && value !== '') return;
    
    if (digit.length > 1) return; // Only allow single digit
    
    const newOtpValues = [...otpValues];
    newOtpValues[index] = digit;
    setOtpValues(newOtpValues);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Clear error when user starts typing
    if (otpError) {
      setOtpError('');
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtpValues = pastedData.split('').map((char, index) => 
      index < 6 ? char : ''
    );
    setOtpValues(newOtpValues);
    
    // Focus last filled input
    const lastFilledIndex = pastedData.length >= 6 ? 5 : pastedData.length - 1;
    if (lastFilledIndex >= 0 && lastFilledIndex < 6) {
      inputRefs.current[lastFilledIndex]?.focus();
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    
    const enteredOtp = otpValues.join('');
    
    if (enteredOtp.length !== 6) {
      setOtpError('Please enter all 6 digits');
      return;
    }

    if (isLocked) return;

    // TODO: Replace with real API call
    if (enteredOtp === MOCK_OTP) {
      // Success - call actual login
      await login(credentials);
    } else {
      const newAttempts = otpAttempts + 1;
      setOtpAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        // Lock for 60 seconds
        setIsLocked(true);
        setLockoutCountdown(60);
        setOtpError('Too many failed attempts. Please wait 60 seconds.');
      } else {
        setOtpError(`Invalid OTP. ${3 - newAttempts} attempts remaining`);
      }
    }
  };

  const handleResendOtp = () => {
    if (!isResendDisabled && !isLocked) {
      // TODO: Replace with real API call
      setCountdown(30);
      setIsResendDisabled(true);
      setOtpValues(['', '', '', '', '', '']);
      setOtpAttempts(0);
      setOtpError('');
      inputRefs.current[0]?.focus();
    }
  };

  const handleBackToStep1 = () => {
    setCurrentStep(1);
    setCredentials({ email: '', password: '', rememberMe: false });
    setOtpValues(['', '', '', '', '', '']);
    setOtpError('');
    setOtpAttempts(0);
  };

  const isFormValid = credentials.email && credentials.password;
  const isOtpComplete = otpValues.every(val => val !== '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass tfl-card rounded-lg shadow-lg border border-gray-200 p-8 w-full max-w-md"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">TFL Monitoring Dashboard</h2>
        <p className="text-gray-600 mt-2">Enterprise Monitoring System</p>
      </div>

      <AnimatePresence mode="wait">
        {currentStep === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <form onSubmit={handleStep1Submit} className="space-y-6">
              {(error || otpError) && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-3"
                >
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-800">{error || otpError}</span>
                  </div>
                </motion.div>
              )}

              {loginAttempts >= 3 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
                >
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      Multiple failed attempts. Account will be locked after 5 attempts.
                    </span>
                  </div>
                </motion.div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={credentials.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="ganesh@tfl.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={credentials.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="rememberMe"
                    type="checkbox"
                    checked={credentials.rememberMe}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              {isDev && <p className="text-xs text-gray-500">Demo: ganesh@tfl.com / password123</p>}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6">
              <button
                onClick={handleBackToStep1}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to login</span>
              </button>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Enter Verification Code</h3>
              <p className="text-sm text-gray-600 mt-1">
                We've sent a 6-digit code to {credentials.email}
              </p>
            </div>

            <form onSubmit={handleOtpSubmit} className="space-y-6">
              {otpError && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-lg border ${
                    isLocked 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className={`w-4 h-4 ${isLocked ? 'text-red-600' : 'text-yellow-600'}`} />
                    <span className={`text-sm ${isLocked ? 'text-red-800' : 'text-yellow-800'}`}>
                      {otpError}
                    </span>
                  </div>
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Enter 6-digit code
                </label>
                <div className="flex justify-center space-x-2">
                  {otpValues.map((value, index) => (
                    <input
                      key={index}
                      ref={el => inputRefs.current[index] = el}
                      type="text"
                      maxLength={1}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={value}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      disabled={isLocked}
                      className={`w-12 h-12 text-center text-lg font-semibold border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        isLocked 
                          ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Countdown Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Code expires in</span>
                  <span className="text-xs font-medium text-gray-700">{countdown}s</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: `${(countdown / 30) * 100}%` }}
                    transition={{ duration: 1, ease: "linear" }}
                    className="bg-blue-600 h-2 rounded-full"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={!isOtpComplete || isLocked || loading}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    'Verify'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResendDisabled || isLocked}
                  className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLocked ? (
                    `Wait ${lockoutCountdown}s`
                  ) : isResendDisabled ? (
                    `Resend (${countdown}s)`
                  ) : (
                    <span className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4" />
                      <span>Resend</span>
                    </span>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              {isDev && <p className="text-xs text-gray-500">TODO: Replace with real OTP API</p>}
              {isDev && <p className="text-xs text-gray-400 mt-1">Mock OTP: 123456</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Login = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return null; // Will be handled by routing
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
