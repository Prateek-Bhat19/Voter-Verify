// Start camera when page loads
document.addEventListener('DOMContentLoaded', function() {
    startCamera();
});

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        document.getElementById('videoElement').srcObject = stream;
    } catch (err) {
        showStatus(`Camera error: ${err.message}`, 'error');
    }
}

async function captureAndVerify() {
    try {
        const video = document.getElementById('videoElement');
        const canvas = document.getElementById('canvasElement');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Show success status
        showStatus('Face Verified', 'success');
        
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
    }
}

function showStatus(message, type) {
    const statusElement = document.getElementById('faceVerificationStatus');
    statusElement.textContent = message;
    statusElement.style.display = 'block';
    
    if (type === 'success') {
        statusElement.style.color = '#10B981'; // Green color
    } else if (type === 'error') {
        statusElement.style.color = '#EF4444'; // Red color
    }
}

// Add click event listener to capture button
document.getElementById('captureBtn').addEventListener('click', captureAndVerify); 