document.addEventListener("DOMContentLoaded", () => {
    const video = document.getElementById("video");
    const captureBtn = document.getElementById("captureBtn");
    const canvas = document.getElementById("canvas");
    const result = document.getElementById("result");
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        alert("You need to log in first");
        window.location.href = "/login.html";
        return;
    }

    // Start webcam
    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: "user" 
                }
            });
            video.srcObject = stream;
            
            // Show success message
            if (result) {
                result.textContent = "Camera started. Please center your face and click 'Capture'";
                result.className = "text-success";
            }
        } catch (error) {
            console.error("Camera error:", error);
            if (result) {
                result.textContent = "Camera access denied. Please allow camera permissions.";
                result.className = "text-danger";
            }
            alert("Camera access denied. Please allow camera permissions.");
        }
    }

    startCamera();

    captureBtn.addEventListener("click", async () => {
        if (!video.srcObject) {
            alert("Camera not available. Please reload the page and allow camera access.");
            return;
        }
        
        try {
            // Show loading state
            if (result) {
                result.textContent = "Processing...";
                result.className = "text-info";
            }
            
            // Capture image from video stream
            const context = canvas.getContext("2d");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert image to base64
            const imageData = canvas.toDataURL("image/jpeg");
            
            // Send to backend for verification
            const response = await fetch("/api/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    image1: imageData.split(',')[1], // Remove data:image/jpeg;base64, prefix
                    image2: imageData.split(',')[1] // Remove data:image/jpeg;base64, prefix
                })
            });
            
            // Handle CORS errors
            if (response.status === 0) {
                throw new Error('CORS error: Unable to connect to face verification service. Please try again.');
            }
            
            if (response.status === 500) {
                throw new Error('Server error: Face verification service is temporarily unavailable. Please try again later.');
            }
            
            const responseData = await response.json();
            
            if (!response.ok) {
                throw new Error(responseData.message || responseData.error || "Face verification failed");
            }
            
            // Display result
            if (result) {
                result.textContent = responseData.message;
                result.className = responseData.success ? "text-success" : "text-danger";
            }
            
            if (responseData.success) {
                localStorage.setItem("faceVerifiedAt", Date.now());
                localStorage.setItem("faceVerified", "true");
                
                setTimeout(() => {
                    alert("Face verified successfully! You can now generate your digital token.");
                    window.location.href = "/digital-token.html";
                }, 1000);
            }
        } catch (error) {
            console.error("Face verification error:", error);
            
            if (result) {
                result.textContent = error.message || "Error verifying face. Please try again.";
                result.className = "text-danger";
            }
        }
    });
});

async function verifyFace(image1, image2) {
    try {
        const response = await fetch("/api/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                image1,
                image2
            })
        });

        if (!response.ok) {
            throw new Error('Face verification failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Face verification error:', error);
        throw error;
    }
}
