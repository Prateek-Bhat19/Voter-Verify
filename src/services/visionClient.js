// File: src/services/visionClient.js
const vision = require('@google-cloud/vision');
const path = require('path');

// Provide the path to your service account key JSON
// e.g. place serviceAccountKey.json in project root or src/services
const client = new vision.ImageAnnotatorClient({
  keyFilename: path.join(__dirname, '../../serviceAccountKey.json'),
});

module.exports = client;
