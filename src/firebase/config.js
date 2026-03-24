import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase Configuration - Replace with your actual Firebase project config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Configure Auth settings for India
auth.settings = {
  // Enable phone authentication for Indian numbers
  appVerificationDisabledForTesting: false, // Set to true only for development
  // Set recaptcha language to English (India)
  languageCode: 'en-IN'
};

// Development test phone numbers for Firebase Console
// Add these numbers in Firebase Console → Authentication → Sign-in method → Phone → Test phone numbers:
export const TEST_PHONE_NUMBERS = {
  '+919876543210': '123456',  // Admin test number
  '+919999999999': '654321',  // User test number
  '+918888888888': '111111'   // Operator test number
};

// Export the app instance for other Firebase services
export default app;

// Helper function to format Indian mobile numbers
export const formatIndianMobileNumber = (phoneNumber) => {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a valid 10-digit Indian number
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  // If already has country code, return as is
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  
  return phoneNumber;
};

// ReCAPTCHA configuration
export const RECAPTCHA_CONFIG = {
  // Invisible reCAPTCHA for better UX
  size: 'invisible',
  // Badge position for Indian compliance
  badge: 'bottomright',
  // Theme to match TFL dashboard
  theme: 'dark'
};

console.log('🔥 Firebase Auth initialized for TFL Dashboard OTP system');
