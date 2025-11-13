# Firebase Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: "Travel Buddy"
4. Follow the setup wizard

## Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** provider
3. Enable **Google** provider
   - Add your project's support email
   - Save the OAuth consent screen configuration

## Step 3: Create Firestore Database

1. Go to **Firestore Database** in Firebase Console
2. Click "Create database"
3. Start in **test mode** (for development)
4. Choose your preferred location (e.g., `asia-south1` for India)

## Step 4: Configure Firestore Security Rules

Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Buses collection - readable by all, writable by admins only
    match /buses/{busId} {
      allow read: if true;
      allow write: if false; // Only admins can write (use Admin SDK)
    }
    
    // Bookings collection - users can read/write their own bookings
    match /bookings/{bookingId} {
      allow read: if request.auth != null && 
                     (resource.data.userId == request.auth.uid || 
                      request.auth.token.admin == true);
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && 
                               resource.data.userId == request.auth.uid;
    }
  }
}
```

## Step 5: Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the web icon (`</>`) to add a web app
4. Register your app
5. Copy the Firebase configuration object

## Step 6: Update Application Config

1. Open `src/config/firebase.js`
2. Replace the placeholder values with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## Step 7: Seed Sample Bus Data

### Option 1: Manual Entry (Firebase Console)
1. Go to Firestore Database
2. Create a collection named `buses`
3. Add documents manually using the sample data structure from `src/utils/seedData.js`

### Option 2: Using Firebase Admin SDK (Recommended)

Create a file `seed-firestore.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-service-account-key.json');
const { sampleBuses } = require('./src/utils/seedData.js');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedBuses() {
  const batch = db.batch();
  
  sampleBuses.forEach(bus => {
    const ref = db.collection('buses').doc();
    batch.set(ref, bus);
  });
  
  await batch.commit();
  console.log('Buses seeded successfully!');
}

seedBuses();
```

Run: `node seed-firestore.js`

## Step 8: Test the Application

1. Run `npm install`
2. Run `npm run dev`
3. Test authentication (signup/login)
4. Test bus search and booking flow

## Important Notes

- **Security Rules**: Update Firestore rules for production
- **Environment Variables**: Consider using environment variables for Firebase config
- **Indexes**: Firestore may require composite indexes for queries (check console for prompts)
- **Google Sign-In**: Ensure OAuth consent screen is properly configured

