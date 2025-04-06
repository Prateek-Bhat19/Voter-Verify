#!/bin/bash

# Exit on error
set -e

echo "Starting face verification server..."

# Create necessary directories
mkdir -p deepface_weights/.deepface/weights
mkdir -p temp

# Set environment variables
export PORT=${PORT:-5001}
export DEEPFACE_HOME=$(pwd)/deepface_weights
export PYTHONUNBUFFERED=1

# Copy model file if it exists
if [ -f "facenet_keras.h5" ]; then
    cp facenet_keras.h5 deepface_weights/.deepface/weights/
fi

# Start the server using gunicorn
echo "Starting server on port $PORT..."
exec gunicorn \
    --config gunicorn_config.py \
    --bind "0.0.0.0:$PORT" \
    --workers 1 \
    --timeout 120 \
    --graceful-timeout 30 \
    --log-level info \
    face_verification_server:app 