# Fixing Firestore Authentication Error

If you're getting the error:
```
Error: 16 UNAUTHENTICATED: Request had invalid authentication credentials
```

## Quick Fix: Regenerate Service Account Key

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: **travel-buddy-cfb2f**

2. **Navigate to Project Settings**
   - Click the ⚙️ gear icon (top left)
   - Select **Project settings**

3. **Go to Service Accounts Tab**
   - Click on the **"Service accounts"** tab
   - You'll see "Firebase Admin SDK"

4. **Generate New Private Key**
   - Click **"Generate new private key"** button
   - A warning dialog will appear - click **"Generate key"**
   - A JSON file will be downloaded

5. **Replace the Old Key**
   - Delete the old `service-account-key.json` file
   - Move the newly downloaded JSON file to your project root
   - Rename it to `service-account-key.json`

6. **Run the Seed Script Again**
   ```bash
   node seed-firestore.js
   ```

## Alternative: Check IAM Permissions

If regenerating the key doesn't work:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select project: **travel-buddy-cfb2f**

2. **Navigate to IAM & Admin**
   - Go to **IAM & Admin** > **IAM**
   - Find your service account: `firebase-adminsdk-fbsvc@travel-buddy-cfb2f.iam.gserviceaccount.com`

3. **Verify Permissions**
   - The service account should have one of these roles:
     - **Firebase Admin SDK Administrator Service Agent** (recommended)
     - **Editor** (full access)
     - **Cloud Datastore User** (minimum for Firestore)

4. **Enable Firestore API**
   - Go to **APIs & Services** > **Library**
   - Search for "Cloud Firestore API"
   - Ensure it's **enabled**

## Verify the Fix

After regenerating the key, the script should:
1. ✅ Show "Firebase Admin initialized for project: travel-buddy-cfb2f"
2. ✅ Show "Firestore connection successful!"
3. ✅ Successfully seed all buses

If you still get errors, check:
- The JSON file is in the project root (same directory as `seed-firestore.js`)
- The file is named exactly `service-account-key.json`
- The project ID in the key matches `travel-buddy-cfb2f`



