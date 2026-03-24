/**
 * Data Masking Utilities - TFL Section 17 Compliance
 * Provides functions to mask sensitive data like account numbers, UPI IDs, etc.
 */

/**
 * Masks account numbers showing only last 4 digits
 * @param {string} account - Account number to mask
 * @returns {string} Masked account number (XXXXXX1234)
 */
export const maskAccount = (account) => {
  if (!account || typeof account !== 'string') return account;
  
  if (account.length <= 4) return account;
  
  const lastFour = account.slice(-4);
  const maskedPart = 'X'.repeat(account.length - 4);
  return maskedPart + lastFour;
};

/**
 * Masks UPI IDs showing only last 4 digits
 * @param {string} upiId - UPI ID to mask
 * @returns {string} Masked UPI ID (XXXXX@bank)
 */
export const maskUPI = (upiId) => {
  if (!upiId || typeof upiId !== 'string') return upiId;
  
  const [username, domain] = upiId.split('@');
  if (!username || !domain) return upiId;
  
  if (username.length <= 4) return upiId;
  
  const lastFour = username.slice(-4);
  const maskedPart = 'X'.repeat(username.length - 4);
  return `${maskedPart}${lastFour}@${domain}`;
};

/**
 * Masks RRN (Reference Retrieval Number) showing first 4 and last 4 digits
 * @param {string} rrn - RRN to mask
 * @returns {string} Masked RRN (1234XXXX5678)
 */
export const maskRRN = (rrn) => {
  if (!rrn || typeof rrn !== 'string') return rrn;
  
  if (rrn.length <= 8) return rrn;
  
  const firstFour = rrn.slice(0, 4);
  const lastFour = rrn.slice(-4);
  const maskedPart = 'X'.repeat(rrn.length - 8);
  return firstFour + maskedPart + lastFour;
};

/**
 * Masks mobile numbers showing only last 4 digits
 * @param {string} mobile - Mobile number to mask
 * @returns {string} Masked mobile number (XXXXXX1234)
 */
export const maskMobile = (mobile) => {
  if (!mobile || typeof mobile !== 'string') return mobile;
  
  if (mobile.length <= 4) return mobile;
  
  const lastFour = mobile.slice(-4);
  const maskedPart = 'X'.repeat(mobile.length - 4);
  return maskedPart + lastFour;
};

/**
 * Masks email addresses showing first 2 characters and domain
 * @param {string} email - Email to mask
 * @returns {string} Masked email (abXXXXXX@domain.com)
 */
export const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return email;
  
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;
  
  if (localPart.length <= 2) return email;
  
  const firstTwo = localPart.slice(0, 2);
  const maskedPart = 'X'.repeat(localPart.length - 2);
  return `${firstTwo}${maskedPart}@${domain}`;
};

/**
 * Masks PAN numbers showing first 4 and last 1 character
 * @param {string} pan - PAN number to mask
 * @returns {string} Masked PAN (XXXXX7890X)
 */
export const maskPAN = (pan) => {
  if (!pan || typeof pan !== 'string') return pan;
  
  if (pan.length !== 10) return pan;
  
  const firstFour = pan.slice(0, 4);
  const lastChar = pan.slice(-1);
  const maskedPart = 'X'.repeat(5);
  return `${firstFour}${maskedPart}${lastChar}`;
};

/**
 * Generic masking function for any sensitive data
 * @param {string} data - Data to mask
 * @param {string} type - Type of masking to apply
 * @returns {string} Masked data
 */
export const maskSensitiveData = (data, type) => {
  if (!data || typeof data !== 'string') return data;
  
  switch (type.toLowerCase()) {
    case 'account':
      return maskAccount(data);
    case 'upi':
      return maskUPI(data);
    case 'rrn':
      return maskRRN(data);
    case 'mobile':
      return maskMobile(data);
    case 'email':
      return maskEmail(data);
    case 'pan':
      return maskPAN(data);
    default:
      // Default to account masking
      return maskAccount(data);
  }
};

/**
 * Validates if data contains sensitive patterns
 * @param {string} data - Data to validate
 * @returns {boolean} True if data appears to be sensitive
 */
export const isSensitiveData = (data) => {
  if (!data || typeof data !== 'string') return false;
  
  // Check for common sensitive patterns
  const patterns = [
    /^\d{10,}$/i, // Account numbers (10+ digits)
    /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, // Email
    /^\d{4}X*\d{4}$/i, // Partially masked RRN
    /^[A-Z]{5}\d{4}[A-Z]$/i, // PAN format
  ];
  
  return patterns.some(pattern => pattern.test(data));
};
