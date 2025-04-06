const mongoose = require('mongoose');
const User = require('./src/models/userModel');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function changeAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Find admin user
    const admin = await User.findOne({ email: 'admin@eci.gov.in' });
    if (!admin) {
      console.log('Admin user not found');
      await mongoose.connection.close();
      return;
    }
    
    // Hash new password and update
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    admin.password = hashedPassword;
    await admin.save();
    
    console.log('Admin password updated successfully to Admin@123');
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error updating admin password:', error);
  }
}

changeAdminPassword(); 