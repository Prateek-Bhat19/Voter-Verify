const mongoose = require('mongoose');
const DigitalToken = require('../models/digitalToken');
require('dotenv').config();

async function updateIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/evoting');

    // Drop the existing index
    await DigitalToken.collection.dropIndex('phoneNumber_1');

    // Create new sparse index
    await DigitalToken.collection.createIndex({ phoneNumber: 1 }, { sparse: true });

    process.exit(0);
  } catch (error) {
    console.error('Error updating index:', error);
    process.exit(1);
  }
}

updateIndex(); 