const urlParams = new URLSearchParams(window.location.search);
const phoneNumber = urlParams.get("phoneNumber");

if (phoneNumber) {
    document.getElementById("phone-text").textContent = `We've sent a text message to: ${phoneNumber}`;
} else {
    document.getElementById("phone-text").textContent = "Phone number not found.";
}

const continueBtn = document.getElementById('continue-btn');

continueBtn.addEventListener('click', async () => {
    const otp = document.getElementById('otp').value;

    try {
        const response = await fetch('/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber, otp }),
        });

        const data = await response.json();

        if (response.ok) {
            alert('Verification successful!');
            // Redirect to the next page (e.g., dashboard)
            window.location.href = '/dashboard.html'; // Replace with your desired URL
        } else {
            alert(data.error || 'Verification failed');
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        alert('Failed to verify OTP.');
    }
});