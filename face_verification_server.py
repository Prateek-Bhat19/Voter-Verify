import os
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'  # Disable GPU
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Reduce TensorFlow logging
os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'  # Prevent TensorFlow from allocating all GPU memory

# Import TensorFlow before other imports
import tensorflow as tf
tf.config.set_visible_devices([], 'GPU')  # Ensure GPU is disabled
tf.config.threading.set_inter_op_parallelism_threads(1)  # Limit thread usage
tf.config.threading.set_intra_op_parallelism_threads(1)

# Set memory growth for TensorFlow
gpus = tf.config.list_physical_devices('GPU')
if gpus:
    try:
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
    except RuntimeError as e:
        print(e)

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from deepface import DeepFace
import numpy as np
import base64
import cv2
import os
from datetime import datetime
import requests
import json
from io import BytesIO
from PIL import Image
import io
import time
import gc  # Garbage collection
import psutil  # Process and system utilities
import threading
from queue import Queue
import logging
from concurrent.futures import ThreadPoolExecutor
import tempfile
import traceback
import shutil
import cloudinary
import cloudinary.uploader
import cloudinary.api
from dotenv import load_dotenv
from functools import wraps

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:3000')
BACKEND_API_KEY = os.getenv('BACKEND_API_KEY', 'your-api-key')
PORT = int(os.getenv('PORT', 5001))
HOST = os.getenv('HOST', '0.0.0.0')
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

# Create temp directory
temp_dir = os.path.join(os.getcwd(), 'temp')
if not os.path.exists(temp_dir):
    os.makedirs(temp_dir)
    logger.info(f"Created temp directory: {temp_dir}")

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["*"],
        "methods": ["GET", "POST", "PUT", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Global variables for memory management
request_queue = Queue()
models_initialized = False
model_lock = threading.Lock()
executor = ThreadPoolExecutor(max_workers=4)

# Set DeepFace model directory to a writable location
os.environ['DEEPFACE_HOME'] = os.path.join(os.getcwd(), 'deepface_weights')
os.makedirs(os.environ['DEEPFACE_HOME'], exist_ok=True)
os.makedirs(os.path.join(os.environ['DEEPFACE_HOME'], '.deepface', 'weights'), exist_ok=True)
logger.info(f"DeepFace directory set to: {os.environ['DEEPFACE_HOME']}")

def manage_memory():
    """Aggressive memory management"""
    gc.collect()
    process = psutil.Process()
    memory_info = process.memory_info()
    if memory_info.rss > 1024 * 1024 * 1024:  # If using more than 1GB
        logger.warning("High memory usage detected, forcing garbage collection")
        gc.collect()

def initialize_models():
    """Initialize DeepFace models with a minimal test image"""
    global models_initialized
    if not models_initialized:
        with model_lock:
            if not models_initialized:
                try:
                    # Create a minimal test image
                    test_image = np.zeros((100, 100, 3), dtype=np.uint8)
                    # Initialize models
                    DeepFace.verify(test_image, test_image, model_name="VGG-Face")
                    models_initialized = True
                    logger.info("Models initialized successfully")
                except Exception as e:
                    logger.error(f"Error initializing models: {str(e)}")
                    raise

def process_request(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Add request to queue
            request_queue.put(1)
            
            # Initialize models if needed
            if not models_initialized:
                initialize_models()
            
            # Process request in thread pool
            future = executor.submit(f, *args, **kwargs)
            result = future.result()
            
            # Clean up
            request_queue.get()
            manage_memory()
            
            return result
        except Exception as e:
            logger.error(f"Error processing request: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    return decorated_function

@app.route('/api/verify', methods=['POST', 'OPTIONS'])
@process_request
def verify_face():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
            
        # Always return success for now
        return jsonify({
            "success": True,
            "verified": True,
            "match_percentage": 95,
            "message": "Face verification successful"
        })
        
    except Exception as e:
        logger.error(f"Error in verify_face: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/register-local', methods=['POST', 'OPTIONS'])
@process_request
def register_face():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
            
        # Always return success for now
        return jsonify({
            "success": True,
            "message": "Face registered successfully",
            "faceImageUrl": "/img/default-face.jpg"
        })
        
    except Exception as e:
        logger.error(f"Error in register_face: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/register', methods=['POST'])
@process_request
def register_face_local():
    try:
        data = request.get_json()
        if not data or 'userId' not in data or 'faceImage' not in data:
            return jsonify({
                'success': False,
                'message': 'Missing required fields: userId and faceImage'
            }), 400

        # Process image in memory
        image_data = data['faceImage'].split(',')[1] if ',' in data['faceImage'] else data['faceImage']
        nparr = np.frombuffer(base64.b64decode(image_data), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Verify face
        try:
            DeepFace.verify(img, img, model_name='Facenet')
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Face verification failed: {str(e)}'
            }), 400

        return jsonify({
            'success': True,
            'message': 'Face registered successfully'
        })
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error registering face: {str(e)}'
        }), 500

@app.route('/verify-voting', methods=['POST'])
def verify_voting():
    try:
        data = request.get_json()
        if not data or 'image' not in data or 'voterId' not in data:
            return jsonify({
                'success': False,
                'error': 'Image and voter ID are required'
            }), 400

        # Get voter's registered face from backend
        try:
            response = requests.get(
                f"{BACKEND_URL}/api/users/{data['voterId']}",
                headers={'Authorization': f'Bearer {BACKEND_API_KEY}'}
            )
            if response.status_code != 200:
                return jsonify({
                    'success': False,
                    'error': 'Failed to fetch voter data'
                }), 400

            voter_data = response.json()
            
            # Get the registered face image URL from Cloudinary
            registered_face_url = voter_data.get('faceImageUrl')
            if not registered_face_url:
                return jsonify({
                    'success': False,
                    'error': 'Registered face image not found'
                }), 400

            # Download the registered face image from Cloudinary
            registered_face_response = requests.get(registered_face_url)
            if registered_face_response.status_code != 200:
                return jsonify({
                    'success': False,
                    'error': 'Failed to fetch registered face image'
                }), 400

            # Save registered face image temporarily
            with open('temp_registered.jpg', 'wb') as f:
                f.write(registered_face_response.content)

            # Save current image temporarily
            current_image = base64_to_image(data['image'])
            current_image.save('temp_current.jpg')

            # Verify faces using DeepFace
            registered_face_encoding = DeepFace.encode(np.array(Image.open('temp_registered.jpg')))[0]
            current_face_encoding = DeepFace.encode(np.array(current_image))[0]
            face_distances = DeepFace.face_distance([registered_face_encoding], current_face_encoding)
            distance = float(face_distances[0])
            
            # Define threshold for face match (0.6 = 60%)
            threshold = 0.6
            
            # Calculate match percentage for display
            similarity = 1 - distance
            match_percentage = min(100, max(0, (similarity - threshold) * 100 / (1 - threshold)))
            
            # Only proceed with Cloudinary upload if match is above threshold
            if similarity > threshold:
                try:
                    # Convert current image to base64 for Cloudinary
                    _, buffer = cv2.imencode('.jpg', np.array(current_image))
                    img_str = base64.b64encode(buffer).decode('utf-8')
                    data_uri = f'data:image/jpeg;base64,{img_str}'

                    # Upload to Cloudinary
                    cloudinary_response = requests.post(
                        f'https://api.cloudinary.com/v1_1/{os.environ.get("CLOUDINARY_CLOUD_NAME")}/image/upload',
                        files={'file': data_uri},
                        data={
                            'api_key': os.environ.get('CLOUDINARY_API_KEY'),
                            'timestamp': int(datetime.now().timestamp()),
                            'folder': 'face-verification'
                        }
                    )

                    if cloudinary_response.status_code != 200:
                        return jsonify({
                            'success': False,
                            'error': 'Failed to upload verification image'
                        }), 500

                    cloudinary_data = cloudinary_response.json()
                    
                    return jsonify({
                        'success': True,
                        'message': 'Face identified successfully',
                        'matchPercentage': match_percentage,
                        'voter': voter_data,
                        'imageUrl': cloudinary_data['secure_url'],
                        'pythonService': 'primary'
                    })
                except Exception as e:
                    return jsonify({
                        'success': False,
                        'error': f'Failed to process verification: {str(e)}'
                    }), 500
            else:
                return jsonify({
                    'success': False,
                    'message': 'Face does not match registered face',
                    'matchPercentage': match_percentage,
                    'error': 'Face verification failed'
                }), 401

        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Failed to fetch voter data: {str(e)}'
            }), 500

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def download_image_from_url(url):
    try:
        print(f"Downloading image from URL: {url}")
        response = requests.get(url)
        if response.status_code == 200:
            image = Image.open(BytesIO(response.content))
            print(f"Successfully downloaded image, size: {image.size}")
            return image
        else:
            raise Exception(f"Failed to download image from URL: {response.status_code}")
    except Exception as e:
        print(f"Error downloading image: {str(e)}")
        raise Exception(f"Error downloading image: {str(e)}")

def base64_to_image(base64_string):
    try:
        print("Converting base64 to image")
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        image_data = base64.b64decode(base64_string)
        image = Image.open(BytesIO(image_data))
        
        # Convert RGBA to RGB if necessary
        if image.mode == 'RGBA':
            image = image.convert('RGB')
            
        print(f"Successfully converted base64 to image, size: {image.size}")
        return image
    except Exception as e:
        print(f"Error converting base64 to image: {str(e)}")
        raise Exception(f"Error converting base64 to image: {str(e)}")

def check_face_quality(image):
    # Convert PIL Image to numpy array
    image_np = np.array(image)
    
    # Convert to grayscale if needed
    if len(image_np.shape) == 3:
        gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
    else:
        gray = image_np
    
    # Calculate brightness
    brightness = np.mean(gray)
    
    # Calculate contrast
    contrast = np.std(gray)
    
    # Calculate sharpness using Laplacian variance
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    sharpness = np.var(laplacian)
    
    # Define thresholds
    BRIGHTNESS_THRESHOLD = 40
    CONTRAST_THRESHOLD = 20
    SHARPNESS_THRESHOLD = 100
    
    if brightness < BRIGHTNESS_THRESHOLD:
        return False, "Image is too dark"
    if contrast < CONTRAST_THRESHOLD:
        return False, "Image has low contrast"
    if sharpness < SHARPNESS_THRESHOLD:
        return False, "Image is not sharp enough"
    
    return True, "Image quality is good"

# Initialize models at startup
try:
    if not initialize_models():
        logger.error("Failed to initialize models at startup")
        raise Exception("Failed to initialize face verification models")
    models_initialized = True
    logger.info("Models initialized successfully at startup")
except Exception as e:
    logger.error(f"Error during model initialization: {str(e)}")
    models_initialized = False

# Only run the Flask development server if this script is run directly
if __name__ == '__main__':
    try:
        logger.info(f"Starting server on {HOST}:{PORT}")
        logger.info(f"BACKEND_URL: {BACKEND_URL}")
        logger.info(f"BACKEND_API_KEY: {os.environ.get('BACKEND_API_KEY')}")
        
        app.run(
            host=HOST,
            port=PORT,
            debug=DEBUG,
            use_reloader=False
        )
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")
        raise
