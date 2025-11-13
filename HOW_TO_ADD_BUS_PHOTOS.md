# How to Add Bus Photos

This guide explains where and how to add bus photos to your Travel Buddy application.

## 📍 Where to Add Photos

You have **3 options** to add bus photos:

---

## Option 1: Admin Panel (Recommended - Easiest)

### Steps:

1. **Login as Admin**
   - Go to `/admin` route in your application
   - Login with an admin account (configured in `src/config/adminConfig.js`)

2. **Add/Edit Bus**
   - Click **"Add New Bus"** button or click **Edit** on an existing bus
   - Fill in the bus details

3. **Add Photos**
   - Scroll down to find **"Bus Photos"** field
   - Enter photo URLs, one per line:
     ```
     https://example.com/bus-exterior-1.jpg
     https://example.com/bus-exterior-2.jpg
     https://example.com/bus-exterior-3.jpg
     ```
   - Scroll to **"Interior Photos"** field
   - Enter interior photo URLs, one per line:
     ```
     https://example.com/bus-interior-1.jpg
     https://example.com/bus-interior-2.jpg
     ```

4. **Save**
   - Click **"Add Bus"** or **"Update Bus"** button
   - Photos will be saved to Firebase Firestore

---

## Option 2: Firebase Console (Direct Database Entry)

### Steps:

1. **Go to Firebase Console**
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Navigate to **Firestore Database**

2. **Find Bus Document**
   - Go to `buses` collection
   - Click on the bus document you want to edit

3. **Add Photo Fields**
   - Click **"Add field"**
   - Field name: `busPhotos`
   - Field type: **Array**
   - Add photo URLs as array elements:
     ```
     https://example.com/bus1.jpg
     https://example.com/bus2.jpg
     ```
   - Click **"Add field"** again
   - Field name: `interiorPhotos`
   - Field type: **Array**
   - Add interior photo URLs

4. **Save**
   - Click **"Update"**

---

## Option 3: Update Existing Buses via Code

### For Bulk Updates:

If you have many buses to update, you can modify the seed data or create a script:

**Example Structure:**
```javascript
{
  name: "Volvo Multi-Axle",
  operator: "VRL Travels",
  // ... other fields
  busPhotos: [
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800",
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=600"
  ],
  interiorPhotos: [
    "https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=800",
    "https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=800&h=600"
  ]
}
```

---

## 📸 Photo URL Sources

### Option A: Use Image Hosting Services

1. **Upload to Cloud Storage**
   - Firebase Storage
   - AWS S3
   - Google Cloud Storage
   - Cloudinary
   - Imgur

2. **Get Public URLs**
   - Copy the public URL
   - Paste into the photo fields

### Option B: Use Placeholder Services (For Testing)

- **Unsplash**: `https://images.unsplash.com/photo-[ID]?w=800&h=600&fit=crop`
- **Picsum**: `https://picsum.photos/800/600`
- **Placeholder.com**: `https://via.placeholder.com/800x600`

### Option C: Use Your Own Server

- Host images on your web server
- Use direct URLs: `https://yourdomain.com/images/bus1.jpg`

---

## 📋 Data Structure

Each bus document in Firestore should have:

```javascript
{
  // ... existing fields
  busPhotos: [
    "https://example.com/bus-exterior-1.jpg",
    "https://example.com/bus-exterior-2.jpg"
  ],
  interiorPhotos: [
    "https://example.com/bus-interior-1.jpg",
    "https://example.com/bus-interior-2.jpg"
  ]
}
```

**Field Types:**
- `busPhotos`: **Array of strings** (URLs)
- `interiorPhotos`: **Array of strings** (URLs)

---

## ✅ How Photos Are Displayed

1. **Search Page**: Shows first bus photo in the card
2. **Bus Details Page**: 
   - Full photo gallery with tabs
   - Switch between "Bus Photos" and "Interior Photos"
   - Navigation arrows and thumbnails

---

## 🔧 Troubleshooting

### Photos Not Showing?

1. **Check URLs**: Make sure URLs are accessible (public)
2. **Check Format**: URLs should be in an array format
3. **Check Field Names**: Must be exactly `busPhotos` and `interiorPhotos`
4. **Check Console**: Open browser console for error messages

### Fallback Images

If photos fail to load, the app will show placeholder images automatically.

---

## 💡 Tips

1. **Image Size**: Recommended 800x600px or larger
2. **Format**: JPG or PNG work best
3. **Multiple Photos**: Add 3-5 photos for best user experience
4. **Quality**: Use high-quality images for better display
5. **CDN**: Use a CDN for faster image loading

---

## 🎯 Quick Start

**Fastest way to add photos:**

1. Login to Admin Panel (`/admin`)
2. Click "Edit" on any bus
3. Paste photo URLs in the text areas
4. Click "Update Bus"
5. Done! ✅

---

For more help, check the Admin Panel or Firebase Console documentation.

