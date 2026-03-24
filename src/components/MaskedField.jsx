import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * MaskedField Component - TFL Section 17 Compliance
 * 
 * Shows masked sensitive data with option to reveal for admin users
 * 
 * @param {string} value - The value to display/mask
 * @param {function} maskFn - Masking function from dataMasking.js
 * @param {string} className - Additional CSS classes
 * @param {string} placeholder - Placeholder when value is empty
 */
const MaskedField = ({ value, maskFn, className = '', placeholder = '—' }) => {
  const { role } = useAuth();
  const [isRevealed, setIsRevealed] = useState(false);
  const [revealTimeout, setRevealTimeout] = useState(null);

  const isAdmin = role === 'admin';
  const maskedValue = maskFn(value) || placeholder;
  const displayValue = isRevealed && isAdmin ? value : maskedValue;

  const handleReveal = () => {
    if (!isAdmin) return;

    // Clear existing timeout
    if (revealTimeout) {
      clearTimeout(revealTimeout);
    }

    // Reveal for 5 seconds
    setIsRevealed(true);
    const timeout = setTimeout(() => {
      setIsRevealed(false);
      setRevealTimeout(null);
    }, 5000);
    setRevealTimeout(timeout);
  };

  const handleHide = () => {
    if (revealTimeout) {
      clearTimeout(revealTimeout);
      setRevealTimeout(null);
    }
    setIsRevealed(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (revealTimeout) {
        clearTimeout(revealTimeout);
      }
    };
  }, [revealTimeout]);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="font-mono text-sm">
        {displayValue}
      </span>
      
      {isAdmin ? (
        <button
          onClick={isRevealed ? handleHide : handleReveal}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
          title={isRevealed ? 'Hide value' : 'Reveal value for 5 seconds'}
        >
          {isRevealed ? (
            <EyeOff className="w-4 h-4 text-blue-600" />
          ) : (
            <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      ) : (
        <div className="p-1" title="Access restricted to administrators">
          <Lock className="w-4 h-4 text-gray-400" />
        </div>
      )}
    </div>
  );
};

export default MaskedField;
