import os
import subprocess
import sys
import time
import socket
from face_verification_server import app
from dotenv import load_dotenv

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('127.0.0.1', port))
            return False
        except socket.error:
            return True

def start_server():
    # Load environment variables
    load_dotenv()
    
    # Get port from environment variable, default to 5001
    port = int(os.environ.get('FACE_VERIFICATION_PORT', 5001))
    
    # Check if port is available
    if is_port_in_use(port):
        print(f"Port {port} is already in use. Please close any other applications using this port.")
        sys.exit(1)
    
    # Set the port in environment
    os.environ['FACE_VERIFICATION_PORT'] = str(port)
    
    # Start the Flask development server
    try:
        print(f"Starting server on port {port}...")
        app.run(host='0.0.0.0', port=port, debug=True)
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)

if __name__ == '__main__':
    start_server() 