const mongoose = require('mongoose');
const User = require('./src/models/userModel');
require('dotenv').config();

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const admin = await User.findOne({ email: 'admin@eci.gov.in' });
    console.log('Admin user exists:', admin !== null);
    if (admin) {
      console.log('Admin details:', {
        email: admin.email,
        isAdmin: admin.isAdmin,
        id: admin._id.toString()
      });
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error checking admin:', error);
  }
}

checkAdmin(); 