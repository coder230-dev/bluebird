let currentEditingCountdown = null;

document.addEventListener('DOMContentLoaded', function() {
    renderCountdowns()
})

// Helper function to toggle "popup" elements (if used)
function popup(element, openClose) {
    if (openClose) {
        document.getElementById(element).classList.add('open');
    } else {
        document.getElementById(element).classList.remove('open');
    }
}

// Retrieve countdown by name from localStorage
function findCountdown(name) {
    const countdowns = JSON.parse(localStorage.getItem("countdowns")) || [];
    return countdowns.find(c => c.name === name);
}

// Format date to avoid "Invalid date" errors
function formatDate(dateString) {
    const date = new Date(dateString);
    return isNaN(date) ? "Invalid date" : date.toLocaleString();
}

function renderCountdowns() {
    const countdowns = JSON.parse(localStorage.getItem("countdowns")) || [];
    const container = document.getElementById("countdowns");
    container.innerHTML = "";

    countdowns.forEach(c => {
        const div = document.createElement("label");
        div.style.backgroundColor = c.backgroundColor || "transparent";
        div.classList.add('countdown-div')
        div.style.padding = "10px";
        div.style.margin = "5px";
        div.style.borderRadius = "5px";
        div.style.cursor = "pointer";
        div.innerHTML = `
        <div>
        <input type="checkbox" class="checkbox-open">
        <section>
            <span class="i">${c.icon}</span>
            <span>
                <h3>${c.name}</h3>
                <p>Ends: ${formatDate(c.endDate)}</p>
                ${c.description ? `<p>${c.description}</p>` : ""}
            </span>
        </section>
        </section>
            <button onclick="editCountdown('${c.name}')">Edit</button>
            <button onclick="deleteCountdown('${c.name}')">Delete</button>
            <button onclick="viewCountdownInfo('${c.name}')">View</button>
        </section>
        <section>
            <p id="countdown-${c.name}">Loading...</p>
        </section>
        </div>
        <div id="manage">
            <h1>Hi</h1>
        </div>
        `;
        container.appendChild(div);

        // Start countdown timer
        startCountdown(c.endDate, `countdown-${c.name}`);
    });
}


// View countdown details using findCountdown function
function viewCountdownInfo(name) {
    const countdown = findCountdown(name);
    if (countdown) {
        alert(`Countdown Info:\nName: ${countdown.name}\nEnds: ${formatDate(countdown.endDate)}\nDescription: ${countdown.description || "None"}`);
    } else {
        alert("Countdown not found.");
    }
}

// Save a countdown to localStorage
function saveCountdown(countdown) {
    let countdowns = JSON.parse(localStorage.getItem("countdowns")) || [];
    const existingIndex = countdowns.findIndex(c => c.name === countdown.name);

    if (existingIndex !== -1) {
        countdowns[existingIndex] = countdown; // Update existing
    } else {
        countdowns.push(countdown); // Add new
    }

    localStorage.setItem("countdowns", JSON.stringify(countdowns));
    renderCountdowns();
}

// Delete a countdown from localStorage
function deleteCountdown(name) {
    let countdowns = JSON.parse(localStorage.getItem("countdowns")) || [];
    countdowns = countdowns.filter(c => c.name !== name);
    localStorage.setItem("countdowns", JSON.stringify(countdowns));
    renderCountdowns();
}

// Edit a countdown (loads data into the form)
function editCountdown(name) {
    const countdown = findCountdown(name);
    if (countdown) {
        popup('add-countdown', true)
        document.getElementById("countdown-name").value = countdown.name;
        document.getElementById("countdown-end-date").value = countdown.endDate;
        document.getElementById("countdown-bgColor").value = countdown.backgroundColor || "#ffffff";
        document.getElementById("countdown-description").value = countdown.description || "";
        document.getElementById("countdown-icon").value = countdown.icon || "";
        currentEditingCountdown = countdown.name;
        document.querySelector("button[type='submit']").textContent = "Update Countdown";
    }
}

// Attach event listeners for adding/updating countdowns
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("countdownForm").addEventListener("submit", function (event) {
        event.preventDefault();

        const countdownData = {
            name: document.getElementById("countdown-name").value,
            endDate: document.getElementById("countdown-end-date").value,
            backgroundColor: document.getElementById("countdown-bgColor").value || "transparent",
            icon: document.getElementById("countdown-icon").value || "",
            description: document.getElementById("countdown-description").value || null
        };

        if (currentEditingCountdown) {
            updateCountdown(countdownData, currentEditingCountdown);
            currentEditingCountdown = null;
            document.querySelector("button[type='submit']").textContent = "Add Countdown";
        } else {
            saveCountdown(countdownData);
        }

        renderCountdowns();
        document.getElementById("countdownForm").reset();
        popup('add-countdown')
    });

    renderCountdowns(); // Initial render
});

// Update an existing countdown
function updateCountdown(newCountdown, oldKey) {
    let countdowns = JSON.parse(localStorage.getItem("countdowns")) || [];
    const index = countdowns.findIndex(c => c.name === oldKey);

    if (index !== -1) {
        countdowns[index] = newCountdown;
    }

    localStorage.setItem("countdowns", JSON.stringify(countdowns));
    renderCountdowns();
}

function startCountdown(endDate, elementId) {
    function updateCountdown() {
        const now = new Date();
        const targetDate = new Date(endDate);
        const timeDiff = targetDate - now;

        if (timeDiff <= 0) {
            document.getElementById(elementId).innerHTML = "Countdown expired!";
            clearInterval(interval);
            return;
        }

        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        document.getElementById(elementId).innerHTML = `${days}d ${hours}h ${minutes}m`;
    }

    updateCountdown(); // Initial call
    const interval = setInterval(updateCountdown, 1000); // Update every second
}
