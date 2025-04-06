require('dotenv').config();

module.exports = {
    mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/voter-verification',
    pythonServiceUrl: process.env.PYTHON_SERVICE_URL,
    faceVerificationUrl: process.env.FACE_VERIFICATION_URL,
    backendUrl: process.env.BACKEND_URL,
    allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000']
}; 