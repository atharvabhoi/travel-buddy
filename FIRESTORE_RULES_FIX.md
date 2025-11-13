# Fix Firestore Security Rules for Admin Panel

## Problem
The current Firestore security rules block all write operations (including delete) on the `buses` collection. This prevents the admin panel from deleting buses.

## Solution: Update Firestore Security Rules

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **travel-buddy-cfb2f**
3. Navigate to **Firestore Database** → **Rules** tab

### Step 2: Update the Rules

Replace the existing rules with the following:

**Option A: Allow all authenticated users (for development):**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Buses collection - readable by all, writable by authenticated users
    match /buses/{busId} {
      allow read: if true;
      allow write: if request.auth != null; // Allow authenticated users to write/delete
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
    
    // Search history collection
    match /searchHistory/{historyId} {
      allow read, write: if request.auth != null && 
                            resource.data.userId == request.auth.uid;
    }
  }
}
```

### Step 3: Publish the Rules
1. Click **"Publish"** button at the top
2. Wait for the rules to be deployed (usually takes a few seconds)

### Step 4: Test Delete Functionality
1. Go back to your admin panel
2. Try deleting a bus
3. It should work now!

**Option B: Admin-only access (Recommended for Production):**

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

**Note:** For Option B, you need to set up Firebase Custom Claims. See `ADMIN_SETUP.md` for detailed instructions.

---

## Alternative: More Restrictive Rules (Recommended for Production)

If you want to restrict bus management to specific admin users only, you can use custom claims:

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

**Note:** For the admin-only approach, you'll need to set custom claims on user accounts using Firebase Admin SDK. For now, the first solution (allowing all authenticated users) will work for development.

