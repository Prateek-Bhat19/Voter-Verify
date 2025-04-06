document.addEventListener("DOMContentLoaded", () => {
    fetchAvailableTimeSlots();
});

// Function to fetch available time slots
async function fetchAvailableTimeSlots() {
    try {
        const response = await fetch("/api/timeslots/available");
        const slots = await response.json();

        if (!slots.length) {
            document.getElementById("slotsContainer").innerHTML = "<p>No available slots.</p>";
            return;
        }

        const slotsList = document.getElementById("slotsList");
        slotsList.innerHTML = ""; // Clear existing slots

        slots.forEach(slot => {
            const option = document.createElement("option");
            option.value = slot._id;
            option.textContent = `${slot.date} - ${slot.startTime} to ${slot.endTime} (Remaining: ${slot.maxCapacity - slot.bookedVoters.length})`;
            slotsList.appendChild(option);
        });
    } catch (error) {
        console.error("Error fetching time slots:", error);
    }
}

async function getVoterId(voterId) {
    try {
        const response = await fetch(`/api/voters/${voterId}`); // Corrected API route
        if (!response.ok) {
            throw new Error('Failed to fetch voter details.');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching voter details:', error);
    }
}

