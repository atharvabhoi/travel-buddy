// Seed Firestore with sample bus data using Firebase Admin SDK
// Make sure you have installed: npm install firebase-admin

const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

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
const path = require('path');

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

async function seedBuses() {
  try {
    console.log(`Starting to seed ${sampleBuses.length} buses...`);
    
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
    
    console.log(`✅ Successfully seeded ${sampleBuses.length} buses to Firestore!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding buses:', error);
    process.exit(1);
  }
}

seedBuses();
