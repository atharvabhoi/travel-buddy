# Admin Access Setup Guide

This guide explains how to set up admin access for selected users only.

## Method 1: Using Admin Email/UID List (Simplest - No Backend Required)

### Step 1: Add Admin Users to Config File

1. Open `src/config/adminConfig.js`
2. Add admin email addresses to the `ADMIN_EMAILS` array:
   ```javascript
   export const ADMIN_EMAILS = [
     'admin@travelbuddy.com',
     'your-email@gmail.com',
   ];
   ```
3. OR add admin user UIDs to the `ADMIN_UIDS` array:
   ```javascript
   export const ADMIN_UIDS = [
     'abc123xyz789', // User UID from Firebase Console
   ];
   ```

### Step 2: Find User UIDs (if using UIDs)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** > **Users**
4. Find the user you want to make admin
5. Copy their **UID** (it's a long string like `abc123xyz789...`)
6. Add it to `ADMIN_UIDS` in `adminConfig.js`

### Step 3: Restart Your Development Server

```bash
npm run dev
```

**Note:** This method works immediately but is less secure. Anyone with access to your code can see admin emails/UIDs.

---

## Method 2: Using Firebase Custom Claims (Recommended for Production)

Custom claims are more secure and can be checked in Firestore security rules.

### Step 1: Install Firebase Admin SDK

```bash
npm install firebase-admin
```

### Step 2: Create Admin Script

Create a file `set-admin.js` in your project root:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function setAdmin(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`✅ Successfully set ${email} as admin`);
  } catch (error) {
    console.error(`❌ Error setting admin for ${email}:`, error.message);
  }
}

// Add admin users here
const adminEmails = [
  'admin@travelbuddy.com',
  'your-email@gmail.com',
];

// Set all admins
Promise.all(adminEmails.map(email => setAdmin(email)))
  .then(() => {
    console.log('✅ All admins set successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
```

### Step 3: Run the Script

```bash
node set-admin.js
```

### Step 4: Update Firestore Security Rules

Go to Firebase Console > Firestore Database > Rules and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }
    
    // Buses collection - readable by all, writable by admins only
    match /buses/{busId} {
      allow read: if true;
      allow write: if isAdmin(); // Only admins can write/delete
    }
    
    // Bookings collection
    match /bookings/{bookingId} {
      allow read: if request.auth != null && 
                     (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && 
                               (resource.data.userId == request.auth.uid || isAdmin());
    }
    
    // Search history collection
    match /searchHistory/{historyId} {
      allow read, write: if request.auth != null && 
                            resource.data.userId == request.auth.uid;
    }
  }
}
```

### Step 5: User Must Re-authenticate

After setting custom claims, users need to:
1. Sign out
2. Sign back in

This refreshes their ID token with the new admin claim.

---

## Method 3: Using Firestore Admin Collection (Alternative)

You can also store admin users in Firestore and check them dynamically.

### Step 1: Create Admin Collection in Firestore

1. Go to Firebase Console > Firestore Database
2. Create a collection named `admins`
3. Add a document with ID = user's email or UID
4. Add a field `isAdmin: true`

### Step 2: Update Code to Check Firestore

Modify `src/config/adminConfig.js` to check Firestore:

```javascript
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export const checkAdminFromFirestore = async (user) => {
  if (!user) return false;
  
  try {
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    return adminDoc.exists() && adminDoc.data().isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};
```

---

## Testing Admin Access

1. **As Admin User:**
   - Should see "Admin" link in navbar
   - Can access `/admin` route
   - Can delete/edit buses

2. **As Regular User:**
   - Should NOT see "Admin" link in navbar
   - Should see "Access Denied" if trying to access `/admin` directly
   - Cannot delete/edit buses

---

## Removing Admin Access

### Method 1 (Email/UID List):
Remove the email/UID from `adminConfig.js`

### Method 2 (Custom Claims):
Create `remove-admin.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function removeAdmin(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: false });
    console.log(`✅ Successfully removed admin from ${email}`);
  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }
}

removeAdmin('user@example.com')
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
```

Run: `node remove-admin.js`

---

## Security Notes

1. **Custom Claims** are the most secure method
2. **Email/UID List** is simpler but less secure (visible in code)
3. Always update **Firestore Security Rules** to match your admin check method
4. Never expose admin credentials or UIDs in client-side code for production

---

## Troubleshooting

**Q: Admin link not showing in navbar**
- Check if user email/UID is in `adminConfig.js`
- If using custom claims, user must sign out and sign back in
- Check browser console for errors

**Q: "Access Denied" even though I'm admin**
- Verify email/UID is correct in `adminConfig.js`
- If using custom claims, run `set-admin.js` again
- Clear browser cache and re-authenticate

**Q: Can't delete buses**
- Check Firestore security rules allow admin writes
- Verify admin status is being checked correctly
- Check browser console for permission errors

