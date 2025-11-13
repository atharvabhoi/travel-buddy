# How to Seed Bus Data into Firestore

You have **two options** to add sample bus data to your Firestore database:

## Option 1: Manual Entry (Easier - No coding required)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **travel-buddy-cfb2f**
3. Navigate to **Firestore Database**
4. Click **"Start collection"** (if you haven't created it yet)
5. Collection ID: `buses`
6. Click **"Next"**
7. Add documents manually using the sample data structure:

**Document Structure:**
- `name`: "Volvo Multi-Axle" (string)
- `operator`: "VRL Travels" (string)
- `from`: "Mumbai" (string)
- `to`: "Pune" (string)
- `type`: "sleeper" (string)
- `fare`: 850 (number)
- `departureTime`: "08:00" (string)
- `arrivalTime`: "14:30" (string)
- `duration`: "6h 30m" (string)
- `rating`: 4.5 (number)
- `reviews`: 234 (number)
- `availableSeats`: 40 (number)
- `amenities`: ["AC", "Charging Point", "Reading Light", "WiFi", "Blanket"] (array)

**Sample Routes to Add:**
- Mumbai → Pune (3 buses)
- Delhi → Jaipur (2 buses)
- Bangalore → Chennai (2 buses)
- Hyderabad → Bangalore (1 bus)

See `src/utils/seedData.js` for complete sample data.

---

## Option 2: Using Firebase Admin SDK (Faster for multiple buses)

### Step 1: Install Firebase Admin SDK

```bash
npm install firebase-admin
```

### Step 2: Get Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **travel-buddy-cfb2f**
3. Click the **gear icon** ⚙️ → **Project settings**
4. Go to **"Service accounts"** tab
5. Click **"Generate new private key"**
6. Save the downloaded JSON file as `service-account-key.json` in your project root
7. **⚠️ IMPORTANT:** Add `service-account-key.json` to `.gitignore` (already done)

### Step 3: Run the Seed Script

```bash
node seed-firestore.js
```

You should see: `✅ Successfully seeded 8 buses to Firestore!`

---

## Option 3: Use Firebase Console Import (Alternative)

1. Go to Firestore Database in Firebase Console
2. Click **"..."** menu → **Import**
3. You'll need to export data first or use the Admin SDK method above

---

## Verify Data

After seeding, verify in Firebase Console:
1. Go to **Firestore Database**
2. You should see a `buses` collection
3. Click on it to see all the bus documents

---

## Troubleshooting

**If you get "Permission denied" error:**
- Make sure Firestore security rules allow writes (for Admin SDK, this shouldn't be an issue)
- Check that your service account key is valid

**If buses don't appear:**
- Refresh the Firebase Console
- Check the browser console for errors
- Verify the collection name is exactly `buses` (lowercase)

---

**Recommendation:** Use **Option 1** if you're just testing, or **Option 2** if you want to add all buses quickly.

