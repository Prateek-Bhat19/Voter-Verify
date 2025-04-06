const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Admin user details
const adminEmail = 'admin@eci.gov.in'; // Dummy email for Election Commission of India
const adminPassword = 'Admin@ECI2023';
const adminPhone = '+919999999999';

async function seedAdmin() {
  try {
    // Connect to the database
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      await mongoose.connection.close();
      return;
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const adminUser = new User({
      name: 'Election Commission Administrator',
      email: adminEmail,
      password: hashedPassword,
      phoneNumber: adminPhone,
      isAdmin: true,
      phoneNumberVerified: true,
      faceEmbedding: [] // Empty array as placeholder since it's required
    });
    
    await adminUser.save();
    
    console.log('Admin user created successfully');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin; 