const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create Express app
const app = express();

// CORS configuration
app.use(cors({
  origin: ['https://voter-verify-backend-ry3f.onrender.com', 'http://localhost:3000', 'https://voter-verify-face-ofgu.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files - moved before API routes
app.use(express.static(path.join(__dirname, '../public')));

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const slotRoutes = require("./routes/timeSlotRoutes");
const adminRoutes = require("./routes/adminRoutes");
const digitalTokenRoutes = require("./routes/digitalTokenRoutes");
const expressRoutes = require("./routes/voterRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/admin', adminRoutes);
app.use('/voter', expressRoutes);
app.use('/api/digital-token', digitalTokenRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Add backward compatibility routes
app.use('/admin', adminRoutes);
app.use('/api/timeslots', slotRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/evoting', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000
})
.then(() => {console.log('MongoDB connected in app.js')})
.catch(err => console.error('MongoDB connection error:', err));

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    // Check MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const memoryStatus = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB'
    };
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      memory: memoryStatus
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Default route
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// Export the app
module.exports = app; 