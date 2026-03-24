import { useRef, useEffect, useState } from 'react';

/**
 * Custom hook for auto-refreshing data with visibility and pause controls
 * @param {Function} callback - Function to call on each interval
 * @param {number} intervalMs - Interval in milliseconds
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether the interval should run (default: true)
 * @param {boolean} options.pauseOnHidden - Whether to pause when tab is hidden (default: true)
 * @returns {Object} { isRunning: boolean, lastRefresh: Date }
 */
export const useAutoRefresh = (callback, intervalMs, options = {}) => {
  const { enabled = true, pauseOnHidden = true } = options;
  
  const intervalRef = useRef(null);
  const callbackRef = useRef(callback);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  
  // Keep callback ref up to date
  useEffect(() => { callbackRef.current = callback; }, [callback]);
  
  // Start the interval
  const startInterval = () => {
    if (!enabled) return;
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Start new interval
    intervalRef.current = setInterval(() => {
      if (callbackRef.current && typeof callbackRef.current === 'function') {
        callbackRef.current();
        setLastRefresh(new Date());
      }
    }, intervalMs);
    
    setIsRunning(true);
  };
   
  // Stop the interval
  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsRunning(false);
    }
  };
                     
  // Setup and cleanup
  useEffect(() => {
    // Handle visibility change - moved inside useEffect to access fresh values
    const handleVisibilityChange = () => {
      if (!enabled) {
        stopInterval();
        return;
      }
      
      if (document.hidden) {
        if (pauseOnHidden) {
          stopInterval();
        }
      } else {
        startInterval();
      }
    };
    
    if (enabled) {
      startInterval();
      
      if (pauseOnHidden) {
        document.addEventListener('visibilitychange', handleVisibilityChange);
      }
    }
    
    return () => {
      stopInterval();
      if (pauseOnHidden) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [enabled, intervalMs, pauseOnHidden]);
  
  return {
    isRunning,
    lastRefresh
  };
};
