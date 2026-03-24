/**
 * Data masking utilities for sensitive information
 * Complies with enterprise security standards
 */

/**
 * Masks an account number showing only last 4 digits
 * @param {string} accountNumber - The full account number
 * @returns {string} Masked account number
 */
export const maskAccountNumber = (accountNumber) => {
  if (!accountNumber || typeof accountNumber !== 'string') {
    return '****';
  }
  
  const cleanNumber = accountNumber.replace(/\D/g, '');
  if (cleanNumber.length < 4) {
    return '****';
  }
  
  const lastFour = cleanNumber.slice(-4);
  const maskLength = Math.max(cleanNumber.length - 4, 4);
  return '*'.repeat(maskLength) + lastFour;
};

/**
 * Masks RRN (Reference Retrieval Number) showing partial format
 * @param {string} rrn - The full RRN
 * @returns {string} Masked RRN
 */
export const maskRRN = (rrn) => {
  if (!rrn || typeof rrn !== 'string') {
    return '************';
  }
  
  if (rrn.length <= 8) {
    return '*'.repeat(rrn.length);
  }
  
  const firstTwo = rrn.substring(0, 2);
  const lastFour = rrn.substring(rrn.length - 4);
  const middleMask = '*'.repeat(rrn.length - 6);
  
  return firstTwo + middleMask + lastFour;
};

/**
 * Masks mobile number showing only last 4 digits
 * @param {string} mobileNumber - The full mobile number
 * @returns {string} Masked mobile number
 */
export const maskMobileNumber = (mobileNumber) => {
  if (!mobileNumber || typeof mobileNumber !== 'string') {
    return '****';
  }
  
  const cleanNumber = mobileNumber.replace(/\D/g, '');
  if (cleanNumber.length < 4) {
    return '****';
  }
  
  const lastFour = cleanNumber.slice(-4);
  const maskLength = Math.max(cleanNumber.length - 4, 4);
  return '*'.repeat(maskLength) + lastFour;
};

/**
 * Masks email address showing only first 2 characters and domain
 * @param {string} email - The full email address
 * @returns {string} Masked email
 */
export const maskEmail = (email) => {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return '****@****.***';
  }
  
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return '*'.repeat(localPart.length) + '@' + domain;
  }
  
  const firstTwo = localPart.substring(0, 2);
  const maskLength = Math.max(localPart.length - 2, 2);
  return firstTwo + '*'.repeat(maskLength) + '@' + domain;
};

/**
 * Masks card number showing only last 4 digits
 * @param {string} cardNumber - The full card number
 * @returns {string} Masked card number
 */
export const maskCardNumber = (cardNumber) => {
  if (!cardNumber || typeof cardNumber !== 'string') {
    return '**** **** **** ****';
  }
  
  const cleanNumber = cardNumber.replace(/\D/g, '');
  if (cleanNumber.length < 4) {
    return '****';
  }
  
  const lastFour = cleanNumber.slice(-4);
  const maskLength = Math.max(cleanNumber.length - 4, 4);
  const masked = '*'.repeat(maskLength) + lastFour;
  
  // Format in groups of 4 for readability
  const groups = [];
  for (let i = 0; i < masked.length; i += 4) {
    groups.push(masked.substring(i, i + 4));
  }
  
  return groups.join(' ');
};

/**
 * Masks PAN (Permanent Account Number) showing partial format
 * @param {string} pan - The full PAN
 * @returns {string} Masked PAN
 */
export const maskPAN = (pan) => {
  if (!pan || typeof pan !== 'string') {
    return '****';
  }
  
  const cleanPan = pan.replace(/\s/g, '').toUpperCase();
  if (cleanPan.length < 4) {
    return '****';
  }
  
  const lastFour = cleanPan.slice(-4);
  const maskLength = Math.max(cleanPan.length - 4, 4);
  return '*'.repeat(maskLength) + lastFour;
};

/**
 * General purpose mask function that can mask any string
 * @param {string} value - The value to mask
 * @param {number} visibleChars - Number of characters to show at the end
 * @param {string} maskChar - Character to use for masking
 * @returns {string} Masked string
 */
export const maskGeneric = (value, visibleChars = 4, maskChar = '*') => {
  if (!value || typeof value !== 'string') {
    return maskChar.repeat(visibleChars);
  }
  
  if (value.length <= visibleChars) {
    return maskChar.repeat(value.length);
  }
  
  const visible = value.slice(-visibleChars);
  const maskLength = value.length - visibleChars;
  return maskChar.repeat(maskLength) + visible;
};
