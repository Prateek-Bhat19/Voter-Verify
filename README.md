# Face Verification System

A secure face verification system for voter authentication.

## Features

- Real-time face verification
- Face registration
- Admin interface
- Secure API endpoints
- Memory-efficient processing

## Prerequisites

- Python 3.8+
- Node.js 14+
- npm or yarn
- Webcam access

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd face-verification
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Install Node.js dependencies:
```bash
npm install
```

4. Create a `.env` file in the root directory with the following variables:
```env
HOST=0.0.0.0
PORT=5001
DEBUG=False
BACKEND_URL=http://localhost:3000
BACKEND_API_KEY=your-api-key
DEEPFACE_HOME=./deepface_weights
```

## Running the Application

1. Start the Node.js server:
```bash
npm start
```

2. Start the Python face verification server:
```bash
python face_verification_server.py
```

The application will be available at:
- Frontend: http://localhost:3000
- Face Verification API: http://localhost:5001

## Deployment

### Production Deployment

1. Set up a production environment:
```bash
export NODE_ENV=production
export DEBUG=False
```

2. Update the `.env` file with production values:
```env
HOST=0.0.0.0
PORT=5001
DEBUG=False
BACKEND_URL=https://your-production-url.com
BACKEND_API_KEY=your-production-api-key
DEEPFACE_HOME=/path/to/deepface_weights
```

3. Use a process manager like PM2 to run the servers:
```bash
# Install PM2
npm install -g pm2

# Start the Node.js server
pm2 start server.js

# Start the Python server
pm2 start face_verification_server.py --interpreter python
```

### Docker Deployment

1. Build the Docker image:
```bash
docker build -t face-verification .
```

2. Run the container:
```bash
docker run -d \
  -p 3000:3000 \
  -p 5001:5001 \
  -v /path/to/deepface_weights:/app/deepface_weights \
  --env-file .env \
  face-verification
```

## Security Considerations

1. Always use HTTPS in production
2. Keep API keys and secrets secure
3. Regularly update dependencies
4. Monitor memory usage
5. Implement rate limiting
6. Use proper CORS configuration

## Troubleshooting

1. If the face verification server fails to start:
   - Check if port 5001 is available
   - Verify DeepFace model directory permissions
   - Check memory usage

2. If the frontend can't connect to the API:
   - Verify CORS configuration
   - Check network connectivity
   - Ensure both servers are running

3. For memory issues:
   - Monitor memory usage with `top` or `htop`
   - Adjust garbage collection settings
   - Consider increasing server resources

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- Python (v3.6+)
- MongoDB

### Environment Setup
1. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/evoting
JWT_SECRET=your_secure_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GEMINI_API_KEY=your_gemini_api_key
FACE_VERIFICATION_PORT=5001
```

### Installation

1. Install Node.js dependencies:
```bash
npm install
```

2. Install Python dependencies (for face verification server):
```bash
pip install flask flask-cors pillow numpy
```

### Running the Application

1. Start the face verification server:
```bash
python face_verification_server.py
```

2. In a separate terminal, start the main Node.js server:
```bash
npm start
```

3. Access the application:
   - Voter interface: http://localhost:3000
   - Admin interface: http://localhost:3000/admin

## Recent Fixes

1. QR Code Generation and PDF Download:
   - Fixed the digital token generation and PDF download functionality
   - Resolved duplicate key errors in the database

2. Face Verification:
   - Simplified verification response to show clear access granted/denied messages
   - Improved face recognition model with better similarity calculation

3. Voter Management Table:
   - Added proper formatting for voter data display
   - Fixed misaligned table headers

4. AI Chatbot:
   - Implemented Gemini AI integration for voter assistance

## Troubleshooting

- If you encounter a duplicate key error with phoneNumber, the fix is already applied but you might need to clear the existing tokens collection:
```
mongo
use evoting
db.digitaltokens.drop()
```

- For face verification server issues, check the console logs to ensure it's running on port 5001

"# Evote" 
things to do 
4️⃣ Next Steps
✅ Add Liveness Detection (Anti-Spoofing)
To prevent photo or video spoofing, add:

Eye blinking detection
Head movement verification
Mouth movement verification
✅ Add Multi-Factor Authentication (MFA)
If face verification fails, request:

OTP verification via SMS
Fingerprint authentication (WebAuthn)
Would you like me to implement liveness detection or MFA next? 🚀


set up auth MIddleware