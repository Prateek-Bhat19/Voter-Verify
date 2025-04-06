const vision = require('@google-cloud/vision');

// Creates a client
const client = new vision.ImageAnnotatorClient({
  keyFilename: "serviceAccountKey.json",  // Ensure this file is in your root folder
});

async function detectFaces() {
  try {
    const fileName = "face-test.jpg"; // Change this to a real image path
    
    // Perform face detection
    const [result] = await client.faceDetection(fileName);
    const faces = result.faceAnnotations;
    
    console.log(`Found ${faces.length} face(s)`);
    faces.forEach((face, i) => {
      console.log(`Face #${i + 1}:`);
      console.log(`  Joy: ${face.joyLikelihood}`);
      console.log(`  Anger: ${face.angerLikelihood}`);
      console.log(`  Surprise: ${face.surpriseLikelihood}`);
      console.log(`  Confidence: ${face.detectionConfidence}`);
    });

  } catch (error) {
    console.error("Error detecting faces:", error);
  }
}

// Run the function
detectFaces();
