// Seed Firestore with sample bus data using Firebase Admin SDK
// Make sure you have installed: npm install firebase-admin

const admin = require('firebase-admin');
const path = require('path');

// Check if service account key exists
const serviceAccountPath = path.join(__dirname, 'service-account-key.json');
let serviceAccount;

try {
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  console.error('❌ Error loading service account key:', error.message);
  console.log('\n📝 Please ensure service-account-key.json exists in the project root.');
  console.log('   You can download it from:');
  console.log('   Firebase Console > Project Settings > Service Accounts > Generate new private key');
  process.exit(1);
}

// Validate service account structure
if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
  console.error('❌ Invalid service account key format.');
  console.log('   The key must contain: project_id, private_key, and client_email');
  process.exit(1);
}

// Initialize Firebase Admin with explicit project ID
try {
  // Check if already initialized
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    console.log(`✅ Firebase Admin initialized for project: ${serviceAccount.project_id}`);
  }
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  console.log('\n💡 Troubleshooting:');
  console.log('   1. Verify the service account key is valid');
  console.log('   2. Check that Firestore API is enabled in Google Cloud Console');
  console.log('   3. Ensure the service account has "Firebase Admin SDK Administrator Service Agent" role');
  process.exit(1);
}

const db = admin.firestore();

// Note: This script uses the sampleBuses array from src/utils/seedData.js
// Since seedData.js uses ES6 exports, you have two options:
// 1. Use the data directly (see below)
// 2. Convert seedData.js to CommonJS format

// For now, we'll read the file and parse it, or you can manually copy the array
// The easiest way is to copy the sampleBuses array from src/utils/seedData.js
// and paste it here, or use a tool like babel to transpile

// Alternative: Read and evaluate the ES6 module (requires additional setup)
// For simplicity, copy the sampleBuses array from src/utils/seedData.js here

// IMPORTANT: Copy the entire sampleBuses array from src/utils/seedData.js
// and paste it below, replacing this comment

const fs = require('fs');

// Read the seedData.js file and extract the array
// This is a simple approach - for production, consider using a proper module loader
let sampleBuses = [];

try {
  const seedDataPath = path.join(__dirname, 'src', 'utils', 'seedData.js');
  const seedDataContent = fs.readFileSync(seedDataPath, 'utf8');
  
  // Extract the array using regex (simple approach)
  // Find the content between export const sampleBuses = [ and ];
  const arrayMatch = seedDataContent.match(/export const sampleBuses = (\[[\s\S]*?\]);/);
  
  if (arrayMatch) {
    // Evaluate the array (safe in this context as it's our own file)
    sampleBuses = eval(arrayMatch[1]);
    console.log(`Loaded ${sampleBuses.length} buses from seedData.js`);
  } else {
    console.error('Could not parse sampleBuses from seedData.js');
    console.log('Please manually copy the sampleBuses array from src/utils/seedData.js');
    process.exit(1);
  }
} catch (error) {
  console.error('Error reading seedData.js:', error.message);
  console.log('Please ensure src/utils/seedData.js exists and contains sampleBuses array');
  process.exit(1);
}

async function testConnection() {
  try {
    console.log('🔍 Testing Firestore connection...');
    // Try to read from Firestore to verify authentication
    const testRef = db.collection('_test').doc('connection');
    await testRef.set({ test: true, timestamp: admin.firestore.FieldValue.serverTimestamp() });
    await testRef.delete();
    console.log('✅ Firestore connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Firestore connection failed:', error.message);
    if (error.code === 16) {
      console.log('\n💡 Authentication Error - Possible solutions:');
      console.log('   1. Regenerate the service account key from Firebase Console');
      console.log('   2. Ensure Firestore API is enabled in Google Cloud Console');
      console.log('   3. Check that the service account has proper IAM permissions');
      console.log('   4. Verify the project ID matches: travel-buddy-cfb2f');
    }
    return false;
  }
}

async function seedBuses() {
  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      process.exit(1);
    }
    
    console.log(`\n🚀 Starting to seed ${sampleBuses.length} buses...`);
    
    // Firestore has a limit of 500 operations per batch
    // Split into batches if needed
    const batchSize = 500;
    let processed = 0;
    
    for (let i = 0; i < sampleBuses.length; i += batchSize) {
      const batch = db.batch();
      const batchData = sampleBuses.slice(i, i + batchSize);
      
      batchData.forEach(bus => {
        const ref = db.collection('buses').doc();
        batch.set(ref, bus);
      });
      
      await batch.commit();
      processed += batchData.length;
      console.log(`✅ Seeded ${processed}/${sampleBuses.length} buses...`);
    }
    
    console.log(`\n🎉 Successfully seeded ${sampleBuses.length} buses to Firestore!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding buses:', error);
    if (error.code === 16) {
      console.log('\n💡 This is an authentication error. Please:');
      console.log('   1. Verify your service account key is valid');
      console.log('   2. Check IAM permissions in Google Cloud Console');
      console.log('   3. Ensure Firestore API is enabled');
    }
    process.exit(1);
  }
}

seedBuses();
