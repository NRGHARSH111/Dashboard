# Firebase OTP Authentication Setup Guide

## Overview
This document provides step-by-step instructions to configure real mobile OTP authentication using Firebase Auth in the TFL Dashboard.

## Prerequisites
- Firebase project with Authentication enabled
- Firebase Admin SDK setup (optional, for backend operations)

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Enter project name: `tfl-monitoring-dashboard`
4. Enable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Phone Authentication
1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Phone** provider
3. Configure phone number settings:
   - Enable phone verification
   - Set test phone numbers for development
   - Configure SMS templates (optional)

## Step 2: Get Firebase Configuration

### 2.1 Firebase Config
1. In Firebase Console, go to **Project Settings** → **General**
2. Scroll down to "Your apps" section
3. Click on the web app icon (`</>`)
4. Copy the Firebase configuration object

### 2.2 Update Config File
Replace the placeholder values in `src/firebase/config.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 3: Install Dependencies

```bash
npm install firebase@11.0.1
```

## Step 4: Test Phone Numbers (Development)

### 4.1 Add Test Numbers
1. In Firebase Console → Authentication → Sign-in method → Phone
2. Click "Add test phone number"
3. Add test numbers:
   - Phone: `+919876543210` → Code: `123456`
   - Phone: `+919999999999` → Code: `654321`

### 4.2 Enable Test Mode
For development, you can temporarily enable test mode:

```javascript
// In src/firebase/config.js
auth.settings = {
  appVerificationDisabledForTesting: true, // ONLY for development
  languageCode: 'en-IN'
};
```

## Step 5: Production Deployment

### 5.1 Disable Test Mode
Before deploying to production:

```javascript
// In src/firebase/config.js
auth.settings = {
  appVerificationDisabledForTesting: false, // IMPORTANT: Set to false
  languageCode: 'en-IN'
};
```

### 5.2 Configure SMS Templates
1. Firebase Console → Authentication → Templates
2. Customize SMS template for your brand
3. Include TFL branding and security information

## Step 6: Security Considerations

### 6.1 reCAPTCHA Configuration
- Invisible reCAPTCHA is configured for better UX
- Badge positioned at bottom-right for compliance
- Dark theme matches TFL dashboard

### 6.2 Rate Limiting
Firebase automatically implements:
- SMS rate limiting (5 messages per phone number per hour)
- OTP attempt limiting (10 attempts per session)
- IP-based rate limiting

### 6.3 Audit Logging
All OTP operations are logged in:
- Console logs for development
- Firebase Auth logs for production
- Local audit trail in AuthContext

## Step 7: Testing

### 7.1 Development Testing
1. Use test phone numbers from Firebase Console
2. Verify OTP flow works end-to-end
3. Check MFA status updates in Header

### 7.2 Production Testing
1. Use real mobile numbers
2. Verify SMS delivery
3. Test error scenarios (invalid numbers, expired OTP)

## Step 8: Troubleshooting

### Common Issues

#### "reCAPTCHA not initialized"
- Ensure Firebase config is correct
- Check internet connection
- Verify reCAPTCHA container exists in DOM

#### "Failed to send OTP"
- Check Firebase project settings
- Verify phone number format (+91XXXXXXXXXX)
- Ensure Phone Auth is enabled

#### "Invalid OTP code"
- Wait for SMS delivery (can take 30-60 seconds)
- Use test codes for development
- Check OTP expiration (10 minutes)

### Debug Mode
Enable debug logging:

```javascript
// In browser console
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
```

## Step 9: Features Implemented

### ✅ Core Features
- **Real OTP sending** via Firebase Auth
- **Indian mobile number** formatting (+91 prefix)
- **Invisible reCAPTCHA** for security
- **MFA status** display in Header
- **Security wrapper** for sensitive features
- **Audit logging** for compliance

### ✅ UI Components
- **MFAModal**: Mobile number and OTP input
- **SecurityWrapper**: Protection for dashboard features
- **Header integration**: MFA status and trigger
- **Dark theme**: Matches TFL dashboard design

### ✅ Security Features
- **MFA requirement** for sensitive tabs
- **Session persistence** across refreshes
- **Proper cleanup** on component unmount
- **Error handling** and user feedback

## Step 10: Production Checklist

- [ ] Firebase config updated with real values
- [ ] Test mode disabled
- [ ] SMS templates configured
- [ ] Rate limiting reviewed
- [ ] Error monitoring setup
- [ ] User documentation updated
- [ ] Security audit completed

## Support

For issues:
1. Check Firebase Console logs
2. Review browser console errors
3. Verify Firebase project configuration
4. Test with different phone numbers

## Next Steps

- Configure Firebase Functions for backend validation
- Implement additional MFA methods (TOTP, hardware keys)
- Add user management dashboard
- Integrate with existing TFL security systems
