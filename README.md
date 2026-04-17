# Office Login System - Firebase Integration

## Complete Setup Guide

### 1. Firebase Service Account Key Setup

**Important Steps:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: "Employee Access System"
3. Go to Project Settings (gear icon)
4. Click on "Service accounts" tab
5. Click "Generate new private key"
6. Download the JSON file
7. Rename it to `serviceAccountKey.json`
8. Place it in `backend/` folder

### 2. Firebase Configuration Update

**Update script.js with your real Firebase config:**
```javascript
const firebaseConfig = {
    apiKey: "YOUR_REAL_API_KEY",
    authDomain: "employee-access-system-c81cb.firebaseapp.com",
    projectId: "employee-access-system-c81cb",
    storageBucket: "employee-access-system-c81cb.appspot.com",
    messagingSenderId: "740345917289",
    appId: "1:740345917289:web:7e8e74bce6811920cbd7f8"
};
```

### 3. Start the System

**Step 1: Install Dependencies**
```bash
npm install
```

**Step 2: Start Backend Server**
```bash
node backend/server.js
```

**Step 3: Open Frontend**
- Desktop: Open `index.html` in browser
- Mobile: Access via your computer's IP address

### 4. Mobile Access

**Option 1: Local Network**
1. Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. On mobile browser: `http://YOUR_COMPUTER_IP:5000`
3. Both devices must be on same WiFi network

**Option 2: Firebase Direct Access**
- The system now works directly with Firebase
- No server needed for basic attendance marking
- Real-time sync across all devices

### 5. Features

**What's New:**
- **Firebase Integration**: All attendance data saved to cloud
- **Mobile Responsive**: Works perfectly on phones/tablets
- **Real-time Sync**: Data syncs instantly across devices
- **IP Tracking**: Records user IP for security
- **Offline Support**: Local storage backup

**API Endpoints:**
- `POST /attendance` - Mark attendance
- `GET /attendance/today` - Get today's attendance
- `GET /attendance/:date` - Get attendance for specific date
- `GET /check-ip` - Check IP access

### 6. Firebase Security Rules

**Add these rules in Firebase Console:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /attendance/{docId} {
      allow read, write: if request.time < timestamp.date(2025, 1, 1);
    }
  }
}
```

### 7. Troubleshooting

**Common Issues:**
1. **Firebase Connection Failed**: Check serviceAccountKey.json
2. **Mobile Not Loading**: Check WiFi connection and IP address
3. **Data Not Saving**: Verify Firebase project settings
4. **Server Not Running**: Check if port 5000 is available

**Debug Mode:**
- Open browser console (F12)
- Check for Firebase errors
- Verify network requests

### 8. Usage Instructions

**For Employees:**
1. Login with credentials (parth/1234, rahul/1111, admin/admin)
2. Mark IN when arriving at office
3. Mark OUT when leaving
4. Data automatically saves to Firebase

**For Admin:**
- Access Firebase Console to view all attendance data
- Export data for reports
- Manage user access

### 9. Mobile Installation

**Add to Home Screen (PWA):**
1. Open system in mobile browser
2. Tap "Share" or "Menu" button
3. Select "Add to Home Screen"
4. System will work like native app

### 10. Data Structure

**Firebase Collection: `attendance`**
```javascript
{
  name: "employee_name",
  type: "IN" | "OUT",
  time: "display_time",
  timestamp: "ISO_timestamp",
  date: "YYYY-MM-DD",
  ip: "user_ip_address"
}
```

---

## Quick Start

1. **Download Service Key** from Firebase Console
2. **Replace config** in script.js
3. **Start server**: `node backend/server.js`
4. **Open browser**: `http://localhost:5000`
5. **Login** and test attendance marking

**Your system is now ready for mobile and desktop use with real-time Firebase sync!**
