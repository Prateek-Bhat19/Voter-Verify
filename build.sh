#!/bin/bash

# Exit on error
set -e

echo "Starting build process..."

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --no-cache-dir -r requirements.txt

# Create required directories
echo "Creating required directories..."
mkdir -p deepface_weights
mkdir -p uploads

# Copy model file
echo "Copying model file..."
cp facenet_keras.h5 deepface_weights/

# Clean up only application-specific files
echo "Cleaning up..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true
find . -type f -name "*.pyo" -delete 2>/dev/null || true
find . -type f -name "*.pyd" -delete 2>/dev/null || true

echo "Build completed successfully!" 