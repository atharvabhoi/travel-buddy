# Fix Firebase API Key Error

## Error: `auth/api-key-not-valid`

This error means your Firebase API key is either incorrect or has restrictions that prevent it from working.

## Solution Steps:

### Step 1: Get Your Correct API Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **travel-buddy-cfb2f**
3. Click the **gear icon** ⚙️ next to "Project Overview"
4. Select **"Project settings"**
5. Scroll down to **"Your apps"** section
6. Find your web app (or click the web icon `</>` to add one if you don't have it)
7. Copy the **"apiKey"** value from the config object shown

### Step 2: Check API Key Restrictions

1. In Firebase Console, go to **Project settings**
2. Click on **"Cloud Messaging"** tab (or go directly to Google Cloud Console)
3. Click **"Manage API in Google Cloud Console"** link
   - OR go directly to: https://console.cloud.google.com/apis/credentials
4. Select your project: **travel-buddy-cfb2f**
5. Find your API key in the list
6. Click on it to edit
7. Check **"API restrictions"** section:
   - If "Don't restrict key" is selected → This is fine
   - If "Restrict key" is selected → Make sure these APIs are enabled:
     - ✅ Identity Toolkit API (for Authentication)
     - ✅ Firebase Installations API
     - ✅ Firebase Remote Config API
     - ✅ Cloud Firestore API (for database)

### Step 3: Enable Required APIs

If APIs are not enabled:

1. In Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for and enable:
   - **Identity Toolkit API**
   - **Firebase Installations API**
   - **Cloud Firestore API**
3. Wait a few minutes for APIs to activate

### Step 4: Update Your Config File

1. Copy the correct API key from Firebase Console
2. Update `src/config/firebase.js` with the new API key
3. Make sure ALL values match what's shown in Firebase Console

### Step 5: Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Alternative: Remove API Restrictions (Easier for Development)

If you want to quickly test without restrictions:

1. Go to Google Cloud Console → Credentials
2. Click on your API key
3. Under "API restrictions", select **"Don't restrict key"**
4. Click **"Save"**
5. Wait 1-2 minutes for changes to propagate

⚠️ **Note:** For production, you should keep restrictions enabled and only allow necessary APIs.

## Verify Your Config

Your `src/config/firebase.js` should look like this (with YOUR actual values):

```javascript
const firebaseConfig = {
  apiKey: "YOUR-ACTUAL-API-KEY-FROM-CONSOLE",
  authDomain: "travel-buddy-cfb2f.firebaseapp.com",
  projectId: "travel-buddy-cfb2f",
  storageBucket: "travel-buddy-cfb2f.firebasestorage.app",
  messagingSenderId: "1073545254654",
  appId: "1:1073545254654:web:d6c72e1cc8e71efa12f7af",
  measurementId: "G-RFQTER3HTT"
};
```

## Still Not Working?

1. **Double-check** all values in Firebase Console match your config file
2. **Wait 2-3 minutes** after making changes (API changes take time to propagate)
3. **Clear browser cache** and hard refresh (Ctrl+Shift+R)
4. **Check browser console** for any other errors
5. **Verify** Authentication is enabled in Firebase Console → Authentication → Sign-in method

