# Use Python 3.8 as base image
FROM python:3.8-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p deepface_weights registered_faces temp

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV DEEPFACE_HOME=/app/deepface_weights

# Expose ports
EXPOSE 5001

# Start the application
CMD ["python", "face_verification_server.py"] 