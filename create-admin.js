const mongoose = require('mongoose');
const User = require('./src/models/userModel');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@eci.gov.in' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      await mongoose.connection.close();
      return;
    }
    
    // Create new admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      name: 'Admin',
      email: 'admin@eci.gov.in',
      password: hashedPassword,
      phoneNumber: '1234567890',
      isAdmin: true,
      phoneNumberVerified: true
    });
    
    await admin.save();
    
    console.log('Admin user created successfully:');
    console.log('Email: admin@eci.gov.in');
    console.log('Password: admin123');
    console.log('isAdmin: true');
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

createAdmin(); 