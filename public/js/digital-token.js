async function generateToken() {
    try {
        // Get the JWT token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            alert("You need to log in first");
            window.location.href = "/login.html";
            return;
        }

        // Show loading state
        document.getElementById("loading-indicator").classList.remove("d-none");
        
        // Make the API call with the token in the header
        const response = await fetch("/api/digital-token/generate", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        // Handle the response
        if (response.ok) {
            const data = await response.json();
            console.log("Token generated:", data);
            
            if (data.qrCodeUrl) {
                document.getElementById("qr-code").src = data.qrCodeUrl;
                document.getElementById("qr-section").classList.remove("d-none");
                document.getElementById("token-download-btn").classList.remove("d-none");
            } else {
                alert("Failed to generate QR code.");
            }
        } else {
            const errorData = await response.json();
            alert(errorData.error || "Failed to generate token.");
        }
    } catch (error) {
        console.error("Error generating token:", error);
        alert("Server error. Please try again later.");
    } finally {
        document.getElementById("loading-indicator").classList.add("d-none");
    }
}

async function downloadTokenPDF() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("You need to log in first");
            window.location.href = "/login.html";
            return;
        }

        document.getElementById("loading-indicator").classList.remove("d-none");
        
        const response = await fetch("/api/digital-token/download", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            // Convert the response to a blob
            const blob = await response.blob();
            
            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);
            
            // Create a temporary link element and trigger a download
            const a = document.createElement('a');
            a.href = url;
            a.download = 'digital_token.pdf';
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            const errorData = await response.json();
            alert(errorData.error || "Failed to download token PDF.");
        }
    } catch (error) {
        console.error("Error downloading token:", error);
        alert("Server error. Please try again later.");
    } finally {
        document.getElementById("loading-indicator").classList.add("d-none");
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Generate token automatically on page load
    generateToken();
    
    // Set up event listener for the download button
    const downloadBtn = document.getElementById('token-download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadTokenPDF);
    }
});

