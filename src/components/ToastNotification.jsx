import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, Download, AlertCircle, Loader } from 'lucide-react';

const ToastNotification = ({ 
  type = 'success', 
  message, 
  isVisible, 
  onClose,
  duration = 3000 
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (isVisible) {
      setProgress(100);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(interval);
            return 0;
          }
          return prev - (100 / (duration / 100));
        });
      }, 100);

      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [isVisible, duration, onClose]);

  const getToastConfig = (type) => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-600',
          icon: CheckCircle,
          iconColor: 'text-green-100',
          messageColor: 'text-green-100',
          progressColor: 'bg-green-400'
        };
      case 'error':
        return {
          bgColor: 'bg-red-600',
          icon: AlertCircle,
          iconColor: 'text-red-100',
          messageColor: 'text-red-100',
          progressColor: 'bg-red-400'
        };
      case 'loading':
        return {
          bgColor: 'bg-blue-600',
          icon: Loader,
          iconColor: 'text-blue-100',
          messageColor: 'text-blue-100',
          progressColor: 'bg-blue-400'
        };
      default:
        return {
          bgColor: 'bg-gray-600',
          icon: Download,
          iconColor: 'text-gray-100',
          messageColor: 'text-gray-100',
          progressColor: 'bg-gray-400'
        };
    }
  };

  const config = getToastConfig(type);
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed top-4 right-4 z-50 glass rounded-lg shadow-2xl border border-white/20 overflow-hidden min-w-[320px] max-w-md`}
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className={`${config.bgColor} p-4`}>
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 ${config.iconColor}`}>
                {type === 'loading' ? (
                  <Icon className="w-5 h-5 animate-spin" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${config.messageColor}`}>
                  {message}
                </p>
              </div>
              <button
                onClick={onClose}
                className={`flex-shrink-0 ${config.iconColor} hover:opacity-75 transition-opacity`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3 bg-white/20 rounded-full h-1 overflow-hidden">
              <motion.div
                className={`h-full ${config.progressColor}`}
                initial={{ width: '100%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ToastNotification;
