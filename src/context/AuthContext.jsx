import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { auth } from '../firebase/config';

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  role: null,
  permissions: [],
  mfaVerified: true,
  sessionTimeout: null,
  loginAttempts: 0,
  lastActivity: new Date(),
  ipWhitelisted: false,
  auditLog: [],
  recaptchaVerifier: null,
  confirmationResult: null,
  otpSent: false,
  phoneNumber: null,
  otpRateLimit: null, // Add rate limiting state
  lastOTPSent: null, // Track last OTP sent time
  mockMode: false, // Development mock mode flag
  mockNotification: null // Mock mode notification message
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        role: action.payload.role,
        permissions: action.payload.permissions,
        mfaVerified: true,
        ipWhitelisted: action.payload.ipWhitelisted || false,
        loading: false,
        error: null,
        loginAttempts: 0,
        lastActivity: new Date(),
        sessionTimeout: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      };
    
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload.error,
        loginAttempts: state.loginAttempts + 1,
        isAuthenticated: false,
        user: null,
        role: null,
        permissions: []
      };
    
    case 'MFA_VERIFY':
      return {
        ...state,
        mfaVerified: true,
        error: null
      };
    
    case 'LOGOUT':
      return {
        ...initialState,
        auditLog: [...state.auditLog, {
          timestamp: new Date(),
          action: 'LOGOUT',
          user: state.user?.email || 'unknown',
          ip: action.payload.ip || 'unknown'
        }]
      };
    
    case 'SESSION_TIMEOUT':
      return {
        ...initialState,
        auditLog: [...state.auditLog, {
          timestamp: new Date(),
          action: 'SESSION_TIMEOUT',
          user: state.user?.email || 'unknown',
          ip: action.payload.ip || 'unknown'
        }]
      };
    
    case 'UPDATE_ACTIVITY':
      return {
        ...state,
        lastActivity: new Date(),
        sessionTimeout: new Date(Date.now() + 30 * 60 * 1000)
      };
    
    case 'ADD_AUDIT_LOG':
      return {
        ...state,
        auditLog: [...state.auditLog, action.payload]
      };
    
    case 'UPDATE_PERMISSIONS':
      return {
        ...state,
        permissions: action.payload
      };
    
    case 'SET_RECAPTCHA_VERIFIER':
      return {
        ...state,
        recaptchaVerifier: action.payload
      };
    
    case 'SET_CONFIRMATION_RESULT':
      return {
        ...state,
        confirmationResult: action.payload
      };
    
    case 'OTP_SENT':
      return {
        ...state,
        otpSent: true,
        phoneNumber: action.payload.phoneNumber,
        error: null
      };
    
    case 'SET_OTP_RATE_LIMIT':
      return {
        ...state,
        otpRateLimit: action.payload
      };
    
    case 'RESET_OTP':
      return {
        ...state,
        otpSent: false,
        confirmationResult: null,
        phoneNumber: null,
        otpRateLimit: null
      };
    
    case 'ENABLE_MOCK_MODE':
      return {
        ...state,
        mockMode: true,
        mockNotification: action.payload.notification,
        otpSent: true,
        phoneNumber: action.payload.phoneNumber || '+91-XXXX-XXX-1234'
      };
    
    case 'DISABLE_MOCK_MODE':
      return {
        ...state,
        mockMode: false,
        mockNotification: null,
        otpSent: false,
        phoneNumber: null
      };
    
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check session timeout
  useEffect(() => {
    const checkSession = setInterval(() => {
      if (state.isAuthenticated && state.sessionTimeout) {
        if (new Date() > state.sessionTimeout) {
          dispatch({ 
            type: 'SESSION_TIMEOUT', 
            payload: { ip: 'session-timeout' } 
          });
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkSession);
  }, [state.isAuthenticated, state.sessionTimeout]);

  // Initialize mfaVerified from localStorage on mount
  useEffect(() => {
    const storedMFAStatus = localStorage.getItem('mfaVerified');
    if (storedMFAStatus === 'true' && state.isAuthenticated) {
      dispatch({ type: 'MFA_VERIFY' });
    }
  }, [state.isAuthenticated]);

  // Save mfaVerified to localStorage whenever it changes
  useEffect(() => {
    if (state.mfaVerified) {
      localStorage.setItem('mfaVerified', 'true');
    } else {
      localStorage.removeItem('mfaVerified');
    }
  }, [state.mfaVerified]);

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      // Simulate API call
      const response = await mockLoginAPI(credentials);
      
      if (response.success) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.user,
            role: response.role,
            permissions: response.permissions,
            mfaVerified: true,
            ipWhitelisted: response.ipWhitelisted
          }
        });
        
        // Add audit log
        dispatch({
          type: 'ADD_AUDIT_LOG',
          payload: {
            timestamp: new Date(),
            action: 'LOGIN',
            user: response.user.email,
            ip: credentials.ip || 'unknown',
            status: 'SUCCESS'
          }
        });
        
        return { success: true };
      } else {
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: { error: response.error }
        });
        return { success: false, error: response.error };
      }
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: { error: 'Login failed. Please try again.' }
      });
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = () => {
    dispatch({ 
      type: 'LOGOUT', 
      payload: { ip: 'logout' } 
    });
  };

  const updateActivity = () => {
    if (state.isAuthenticated) {
      dispatch({ type: 'UPDATE_ACTIVITY' });
    }
  };

  const hasPermission = (permission) => {
    return state.permissions.includes(permission) || state.role === 'admin';
  };

  const addAuditLog = (action, resource, status = 'SUCCESS') => {
    dispatch({
      type: 'ADD_AUDIT_LOG',
      payload: {
        timestamp: new Date(),
        action,
        user: state.user?.email || 'unknown',
        resource,
        ip: 'unknown',
        status
      }
    });
  };

  const value = {
    ...state,
    login,
    logout,
    updateActivity,
    hasPermission,
    addAuditLog
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Mock Login API (keeping for local authentication)
// In production, this would be replaced with your backend authentication
const mockLoginAPI = async (credentials) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock user database
  const users = {
    'ganesh@tfl.com': {
      user: { id: 1, email: 'ganesh@tfl.com', name: 'Admin User' },
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'audit', 'admin'],
      mfaVerified: true,
      mfaRequired: false,
      ipWhitelisted: true
    },
    'admin@tfl.com': {
      user: { id: 2, email: 'admin@tfl.com', name: 'Admin User' },
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'audit', 'admin'],
      mfaVerified: true,
      mfaRequired: false,
      ipWhitelisted: true
    },
    'operator@tfl.com': {
      user: { id: 3, email: 'operator@tfl.com', name: 'Operator User' },
      role: 'operator',
      permissions: ['read', 'write'],
      mfaVerified: true,
      mfaRequired: false,
      ipWhitelisted: true
    },
    'viewer@tfl.com': {
      user: { id: 4, email: 'viewer@tfl.com', name: 'Viewer User' },
      role: 'viewer',
      permissions: ['read'],
      mfaVerified: true,
      mfaRequired: false,
      ipWhitelisted: false
    }
  };

  const user = users[credentials.email];
  
  if (!user || credentials.password !== 'password123') {
    return { success: false, error: 'Invalid credentials' };
  }

  return {
    success: true,
    ...user
  };
};

// Note: Mock OTP functions removed - now using real Firebase Auth
// const mockSendOTP = ... (replaced with Firebase)
// const mockOTPVerification = ... (replaced with Firebase)
// const mockMFAVerification = ... (replaced with Firebase)
