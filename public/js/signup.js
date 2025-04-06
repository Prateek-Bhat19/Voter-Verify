document.addEventListener("DOMContentLoaded", function () {
    let phoneNumber = "";
    let userId = ""; 

    const verifyPhoneButton = document.getElementById("verify-phone-button");
    const verifyOtpButton = document.getElementById("verify-otp-button");
    const signupForm = document.getElementById("signup-form");
    const signupButton = signupForm?.querySelector('button[type="submit"]');
    const verifyOtpSection = document.getElementById("verify-otp-section");
    const continueButton = document.getElementById("continue-btn");

    // Send OTP for phone verification
    if (verifyPhoneButton) {
        verifyPhoneButton.addEventListener("click", async () => {
            phoneNumber = document.getElementById("phoneNumber")?.value.trim();
            if (!phoneNumber) {
                alert("Please enter a valid phone number.");
                return;
            }

            verifyPhoneButton.disabled = true;

            try {
                const response = await fetch("/auth/send-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ phoneNumber }),
                });
                const data = await response.json();
                alert(data.message || data.error);

                if (response.ok) {
                    // Remove the "hidden" class to show the OTP input and button
                    document.getElementById("otp")?.classList.remove("hidden");
                    verifyOtpButton?.classList.remove("hidden");
                }
            } catch (error) {
                console.error("Error sending OTP:", error);
                alert("Failed to send OTP.");
            } finally {
                verifyPhoneButton.disabled = false;
            }
        });
    }

    // Verify OTP (first step of verification)
    if (verifyOtpButton) {
        verifyOtpButton.addEventListener("click", async () => {
            const otp = document.getElementById("otp")?.value.trim();
            if (!otp) {
                alert("Please enter the OTP.");
                return;
            }

            verifyOtpButton.disabled = true;

            try {
                const response = await fetch("/auth/verify-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ phoneNumber, otp }),
                });
                const data = await response.json();
                alert(data.message || data.error);

                if (response.ok) {
                    // Hide the OTP-related elements and show the signup button
                    verifyPhoneButton?.classList.add("hidden");
                    document.getElementById("otp")?.classList.add("hidden");
                    verifyOtpButton?.classList.add("hidden");
                    signupButton?.classList.remove("hidden");
                }
            } catch (error) {
                console.error("Error verifying OTP:", error);
                alert("Failed to verify OTP.");
            } finally {
                verifyOtpButton.disabled = false;
            }
        });
    }

    // Handle signup process
    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const name = document.getElementById("name")?.value.trim();
            const email = document.getElementById("email")?.value.trim();
            const password = document.getElementById("password")?.value.trim();
            const adharNumber = document.getElementById("adharNumber")?.value.trim();
            const voterId = document.getElementById("voterId")?.value.trim();
            phoneNumber = document.getElementById("phoneNumber")?.value.trim();

            if (!name || !email || !password || !adharNumber || !voterId || !phoneNumber) {
                alert("Please fill in all required fields.");
                return;
            }

            try {
                // Create user account
                const response = await fetch("/auth/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password, adharNumber, phoneNumber, voterId }),
                });
                const data = await response.json();
                
                if (response.ok) {
                    userId = data.userId;  // Store the user ID if provided by the server
                    
                    // Now send the OTP to the user's phone
                    const otpResponse = await fetch("/auth/send-otp", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ phoneNumber, userId }),
                    });
                    
                    const otpData = await otpResponse.json();
                    
                    if (otpResponse.ok) {
                        // Show the OTP verification section
                        signupForm.style.display = "none";
                        verifyOtpSection.style.display = "block";
                        document.getElementById("phone-text").textContent = `We've sent a text message to: ${phoneNumber}`;
                    } else {
                        alert("Failed to send OTP: " + (otpData.error || "Unknown error"));
                    }
                } else {
                    alert("Signup failed: " + (data.error || "Unknown error"));
                }
            } catch (error) {
                console.error("Signup error:", error);
                alert("Signup error: " + error.message);
            }
        });
    }

    // Final OTP verification (if using a separate "continue" button)
    if (continueButton) {
        continueButton.addEventListener("click", async () => {
            const otp = document.getElementById("final-otp")?.value.trim();
            if (!otp) {
                alert("Please enter the final OTP.");
                return;
            }

            continueButton.disabled = true;

            try {
                const response = await fetch("/auth/verify-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ phoneNumber, otp, userId }),
                });
                const data = await response.json();

                if (response.ok) {
                    alert('Verification successful!');
                    window.location.href = '/dashboard.html';
                } else {
                    alert(data.error || 'Verification failed');
                }
            } catch (error) {
                console.error('Error verifying OTP:', error);
                alert('Failed to verify OTP.');
            } finally {
                continueButton.disabled = false;
            }
        });
    }
});
