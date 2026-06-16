document.addEventListener("DOMContentLoaded", () => {
    updateDashboard();
    getEventFromParams(); // Load event details on page load
});

document.getElementById("uploadedFileAdd").addEventListener("change", function(event) {
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const newData = JSON.parse(e.target.result); // Parse uploaded JSON
                const storedData = localStorage.getItem("events"); 

                let existingData = storedData ? JSON.parse(storedData) : [];

                // Check if an entry with the same ID already exists
                const duplicate = existingData.find(item => item.id === newData.id);

                if (duplicate) {
                    console.warn("An entry with the same ID already exists.");
                } else {
                    existingData.push(newData); // Add new data to array
                    localStorage.setItem("uploadedJSON", JSON.stringify(existingData));
                    console.log("JSON saved successfully:", existingData);
                }

            } catch (error) {
                console.error("Invalid JSON format:", error);
            }
        };

        reader.readAsText(file); 
    }
});


const currentUrl = new URL(window.location.href);

let eventCountdownInterval; // Store interval globally

function updateEventTimer(event) {
    clearInterval(eventCountdownInterval); // Stop any previous interval

    eventCountdownInterval = setInterval(function () {
        document.getElementById("days-to-event").innerHTML = formatTimeDifference(new Date(event.date));
    }, 1000); // Update every second
}

function getEventFromParams() {
    let eventId = currentUrl.searchParams.get("id");

    if (!eventId) {
        console.warn("No event ID found in URL.");
        return;
    }

    // Retrieve events from localStorage
    let events = JSON.parse(localStorage.getItem("events")) || [];
    let eventIndex = events.findIndex(e => e.id == eventId); // Find index of the event
    let event = events[eventIndex]; // Get event object

    if (eventIndex !== -1) {
        openModal(event, eventIndex); // Pass event & index correctly
    } else {
        console.error("Event not found.");
    }
}


// Call function on page load
window.onload = getEventFromParams;

let style = document.getElementById('style');

function openApp(section) {
    document.getElementById(section).style.transform = 'translate(-50%, 0)'
    if (section == 'qr-scanner') {
        let selectedOption = document.querySelector('input[name="Assigned"]:checked');
        let eventDetails = {
            name: document.getElementById("edit-title").value,
            date: document.getElementById("edit-date").value,
            info: document.getElementById("edit-info").value,
            location: document.getElementById("edit-location").value,
            assignedArea: selectedOption.id,
            whenScannedInstructions: document.getElementById('when-scanned').value,
            beAware: document.getElementById('be-aware-about').value,
            eventColor: document.getElementById('edit-event-color').value || `navy`,
            startEntry: document.getElementById('before-start').value|| '3',
            stopEntry: document.getElementById('after-shut').value || '6'
        };
        document.getElementById('qr-event-name').innerText = eventDetails.name;
        document.getElementById('qr-info').textContent = info || 'No info left by creator';
        document.getElementById('ticket-info').textContent = info || 'No info left by creator';
    }
}

setInterval(function() {
    document.querySelectorAll('.date-time').forEach(element => {
        element.innerHTML = `<h1>${new Date()}</h1>`
    }, 1000)
})

function closeApp(section) {
    document.getElementById(section).style.transform = 'translate(-50%, 100%)'
}

function popup(element, open) {
    if (open) {
        document.getElementById(element).style.display = 'unset';
    } else {
        document.getElementById(element).style.display = 'none';
    }
}

function saveEvent() {
    let title = document.getElementById("event-name-from-popup").value;
    let date = document.getElementById("event-date-from-popup").value;
    let qrdata = `${title}, ${date}`

    if (!title || !date) return alert("Please fill in all fields!");

    if (title.length > 20) {
        return alert("Text Length is reached. Max is 20.")
    }

    let events = JSON.parse(localStorage.getItem("events")) || [];
    events.push({ id: Date.now(), title, date, qrdata });
    localStorage.setItem("events", JSON.stringify(events));

    updateDashboard();
    popup('addEvent', false)
}

function updateDashboard() {
    let eventContainer = document.getElementById("events");
    if (!eventContainer) return console.error("Event container not found.");

    eventContainer.innerHTML = ""; // Clear previous entries

    let events = JSON.parse(localStorage.getItem("events")) || [];
    let currentTime = new Date().getTime(); // Get current timestamp

    // Sort events by closest start date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    events.forEach((event, index) => {
        if (!event.title || !event.date || event.id === undefined) {
            console.warn("Skipping invalid event:", event);
            return;
        }

        let eventTime = new Date(event.date).getTime();
        let timeDiff = (currentTime - eventTime) / (1000 * 60 * 60 * 24); // Convert to days

        if (timeDiff >= 1) {
            console.warn(`Deleting expired event: ${event.title}`);
            deleteTicket(event.id); // Remove the expired event
            return; // Skip adding to dashboard
        }

        let eventDiv = document.createElement("div");
        eventDiv.classList.add("event");
        eventDiv.innerHTML = `
            <strong>${event.title}</strong> - ${event.date}
            <button onclick="deleteTicket(${event.id})">Delete</button>
        `;

        eventDiv.onclick = () => openModal(event, index);
        eventContainer.appendChild(eventDiv);
    });

    if (!eventContainer.hasChildNodes()) {
        eventContainer.innerHTML = `
        <div style="text-align: center;">
            <h1 style="font-family: 'Cinzel';">You don't have events at the moment.</h1>
            <p>Create a new event here. This is the Events Manager.</p>
            <button onclick="popup('addEvent', true)">Create Event</button>
        </div>`;
    }
    categorizeEvents();
}

function categorizeEvents() {
    let eventContainer = document.getElementById("events-upcomming");
    if (!eventContainer) return console.error("Event container not found.");

    eventContainer.innerHTML = ""; // Clear previous entries

    let events = JSON.parse(localStorage.getItem("events")) || [];
    let currentTime = new Date();
    let yesterday = new Date();
    let tomorrow = new Date();

    yesterday.setDate(currentTime.getDate() - 1);
    tomorrow.setDate(currentTime.getDate() + 1);

    // Create category containers
    let yesterdayDiv = document.createElement("div");
    yesterdayDiv.innerHTML = "<h2>Yesterday's Events</h2>";
    
    let todayDiv = document.createElement("div");
    todayDiv.innerHTML = "<h2>Today's Events</h2>";
    
    let tomorrowDiv = document.createElement("div");
    tomorrowDiv.innerHTML = "<h2>Tomorrow's Events</h2>";

    events.forEach(event => {
        let eventDate = new Date(event.date);
        let eventDiv = document.createElement("div");
        eventDiv.classList.add("event");
        eventDiv.innerHTML = `<strong>${event.title}</strong> - ${event.date}`;
        eventDiv.onclick = () => openModal(event);

        if (eventDate.toDateString() === yesterday.toDateString()) {
            yesterdayDiv.appendChild(eventDiv);
        } else if (eventDate.toDateString() === currentTime.toDateString()) {
            todayDiv.appendChild(eventDiv);
        } else if (eventDate.toDateString() === tomorrow.toDateString()) {
            tomorrowDiv.appendChild(eventDiv);
        }
    });

    if (yesterdayDiv.childElementCount > 1) eventContainer.appendChild(yesterdayDiv);
    if (todayDiv.childElementCount > 1) eventContainer.appendChild(todayDiv);
    if (tomorrowDiv.childElementCount > 1) eventContainer.appendChild(tomorrowDiv);

    if (!eventContainer.hasChildNodes()) {
        eventContainer.innerHTML = `
        <div style="text-align: center;">
            <h1>No events found.</h1>
            <p>Create a new event here. This is the Events Manager.</p>
            <button onclick="popup('addEvent', true)">Create Event</button>
        </div>`;
    }
}

// Run function on page load
document.addEventListener("DOMContentLoaded", categorizeEvents);


function checkButtonStatus(eventStartTime) {
    let button = document.getElementById("qr-button");
    if (!button || !eventStartTime) return; // Ensure button exists & event start time is valid

    let eventStart = new Date(eventStartTime);
    let currentTime = new Date();
    let elapsedTime = (currentTime - eventStart) / (1000 * 60 * 60); // Convert ms to hours
    let timeUntilEvent = (eventStart - currentTime) / (1000 * 60 * 60); // Time left before event

    if (elapsedTime >= 6) {
        button.disabled = true; // Disable if event is past 6 hours
        button.innerText = "Event Time Expired";
    } else if (timeUntilEvent > 3) {
        button.disabled = true; // Disable if more than 3 hours before the event
        button.innerText = "Available 3 Hours Before Event";
    } else {
        button.disabled = false; // Enable if within the 3-hour pre-event window
        button.innerText = "QR Code Ready!";
    }
}

function deleteTicket(ticketId) {
    let tickets = JSON.parse(localStorage.getItem("events")) || [];
    tickets = tickets.filter(ticket => ticket.id !== ticketId); // Remove selected ticket
    localStorage.setItem("events", JSON.stringify(tickets)); // Save updated list

    updateDashboard(); // Refresh UI
    setTimeout(function() {
        closeApp('dashboard-event-details')
    }, 600)
}


let currentIndex = null;
function openModal(event, index) {
    currentIndex = index;
    currentUrl.searchParams.set('id', event.id)
    window.history.pushState({}, '', currentUrl);
    // Populate modal with event details
    document.getElementById("modal-title").textContent = event.title || '';
    document.getElementById("edit-title").value = event.title || '';
    document.getElementById("edit-date").value = event.date || '';
    document.getElementById("edit-info").value = event.info || '';
    document.getElementById("edit-location").value = event.location || '';
    document.getElementById("when-scanned").value = event.whenScannedInstructions || '';
    document.getElementById("be-aware-about").value = event.beAware || '';
    document.getElementById("edit-event-color").value = event.eventColor || '#000080';
    document.getElementById("edit-event-txt").value = event.eventtxtColor || '#fffff';
    document.getElementById('before-start').value =  event.startEntry|| '3';
    document.getElementById('after-shut').value = event.stopEntery || '6';
    document.getElementById('share-file-other').addEventListener('click', function() {
        getFileAndShare(event)
    })

    let eventStart = new Date(event.date);
    let currentTime = new Date();
    let elapsedTime = (currentTime - eventStart) / (1000 * 60 * 60); // Convert ms to hours
    let inputs = document.querySelectorAll('input')

    if (elapsedTime >= 0) {
        inputs.forEach(one => {
            one.disabled = true
        })
    } else {
        inputs.forEach(one => {
            one.disabled = false
        });
        updateEventTimer(event);
    }
    

    setInterval(function() {
        document.getElementById('days-to-event').innerHTML = formatTimeDifference(new Date(event.date));
    }, 1000)
    // Select radio button based on event data (ensure there's a default selection)
    if (event.assigned === "yes") {
        setSelected("yes-assigned");
    } else {
        setSelected("no-assigned");
    }

    // checkButtonStatus(document.getElementById('edit-date').value)

    style.innerHTML = `
    #dashboard-close::before {
        background-color: ${event.eventColor} !important;
        backdrop-filter: brightness(0%);
    }
    #scanner-results, #qr-scanner {
        background-color: ${event.eventColor} !important;
        color: ${event.eventtxtColor};
    }
    `;

    document.getElementById('dashboard-event-details').style.backgroundColor = event.eventColor
    openApp("dashboard-event-details");
    generateQRCode();
}

document.getElementById('dashboard-close').addEventListener('click', function() {
    clearInterval(eventCountdownInterval);
})

function formatTimeDifference(savedDate) {
    let currentDate = new Date();
    let timeDiff = savedDate - currentDate; // Reverse calculation for countdown

    if (timeDiff < 0) return "Event has started!"; // Handle past dates

    if (timeDiff < -10) return "Event has already passed!"; // Handle past dates

    let days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    let hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    return `${days}:${hours}:${minutes}:${seconds} until the event`;
}


function setSelected(id) {
    let option = document.getElementById(id);
    if (option) option.checked = true;
}


function updateEvent() {
    let events = JSON.parse(localStorage.getItem("events")) || [];

    events[currentIndex].title = document.getElementById("edit-title").value;
    events[currentIndex].date = document.getElementById("edit-date").value;
    events[currentIndex].info = document.getElementById("edit-info").value;
    events[currentIndex].location = document.getElementById("edit-location").value;
    let selectedOption = document.querySelector('input[name="Assigned"]:checked');
    events[currentIndex].assigned = selectedOption ? selectedOption.id === "yes-assigned" ? "yes" : "no" : "no"; 
    events[currentIndex].whenScannedInstructions = document.getElementById('when-scanned').value || ''
    events[currentIndex].beAware = document.getElementById('be-aware-about').value || ''
    events[currentIndex].eventColor = document.getElementById('edit-event-color').value || ''
    events[currentIndex].eventtxtColor = document.getElementById('edit-event-txt').value || ''
    events[currentIndex].startEntry = document.getElementById('before-start').value || '3'
    events[currentIndex].stopEntery = document.getElementById('after-shut').value || '6'
    localStorage.setItem("events", JSON.stringify(events));
    document.getElementById('dashboard-event-details').style.backgroundColor = events[currentIndex].eventColor;

    document.getElementById('days-to-event').innerHTML = formatTimeDifference(new Date(events[currentIndex].date));

    style.innerHTML = `
    #dashboard-close::before {
        background-color: ${events[currentIndex].eventColor} !important;
        backdrop-filter: brightness(0%);
    }
    #scanner-results, #qr-scanner {
        background-color: ${events[currentIndex].eventColor} !important;
        color: ${events[currentIndex].eventtxtColor};
    }
    `;

    updateDashboard();
    generateQRCode();
    alert('Event has been updated.')
}

// Initialize and render event details on screen
function setUpEventScreen() {
  const selectedOption = document.querySelector('input[name="Assigned"]:checked');
  const assignedAreaVal = selectedOption ? selectedOption.id : "no-assigned";
  const eventDetails = {
    name: document.getElementById("edit-title").value,
    date: document.getElementById("edit-date").value,
    info: document.getElementById("edit-info").value,
    location: document.getElementById("edit-location").value,
    assignedArea: assignedAreaVal,
    whenScannedInstructions: document.getElementById("when-scanned").value,
    beAware: document.getElementById("be-aware-about").value,
    eventColor: document.getElementById("edit-event-color").value || "#000080",
    eventTxtColor: document.getElementById("edit-event-txt")
      ? document.getElementById("edit-event-txt").value
      : "#ffffff",
    startEntry: document.getElementById("before-start").value || "3",
    stopEntry: document.getElementById("after-shut").value || "6",
  };

  const screen = document.getElementById("eventDetailsScreen");
  screen.style.background = eventDetails.eventColor;
  screen.innerHTML = `
    <button class="close-btn" id="dashboard-close" onclick="closeApp('eventDetailsScreen')">
      <i class="fa-solid fa-circle-xmark"></i>
    </button>
    <div style="text-align: center;">
      <h1 style="font-size: 6rem">${eventDetails.name}</h1>
      <h2>📅 ${eventDetails.date}</h2>
      <h3>📍 ${eventDetails.location}</h3>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span>
          <h1>Ticket Info</h1>
          <p>- Re-entries are not allowed ${eventDetails.stopEntry} hours after the start time.</p>
          <p>- Entries allowed ${eventDetails.startEntry} hours before the event starts.</p>
          <p>- Sharing your tickets will result in removal from the event and voiding your ticket.</p>
      </span>
      <span>
          <h1>ℹ️ Info</h1>
          <p>${eventDetails.info}</p>
      </span>
      <span>
          <h1>"Be Aware About"</h1>
          <p>${eventDetails.beAware}</p>
      </span>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span>
          <h1>"When Scanned"</h1>
          <p>${eventDetails.whenScannedInstructions}</p>
      </span>
      <span>
          <h1>Assigned Areas / Seat</h1>
          <p>${
            eventDetails.assignedArea === "yes-assigned"
              ? "Assigned Seats. Sit down when instructed by the QR code scanner."
              : "No Assigned Seats. Sit wherever you want."
          }</p>
      </span>
    </div>`;
  openApp("eventDetailsScreen");
}

// Global QR scanner instance (initialized only when needed)
let qrScanner = null;

// Ensure scanner initializes after the page loads
window.addEventListener("load", () => {
    qrScanner = new Html5Qrcode("qr-reader"); 
});

// Function to initialize scanner only when necessary
function ensureScannerInitialized() {
    if (!qrScanner) {
        console.warn("Scanner not initialized, creating instance...");
        qrScanner = new Html5Qrcode("qr-reader");
    }
}

function startScanning() {
    let qrScanner = new Html5Qrcode("qr-reader"); // Create a new instance

    qrScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        qrMessage => {
            checkQRCode(qrMessage);
            stopScanning(qrScanner); // Pass instance to stopScanning
        }
    ).then(() => {
        console.log("Scanning started.");
        openApp("qr-scanner");
    }).catch(error => console.error("Error starting scanner:", error));
}

function stopScanning(qrScanner) {
    if (qrScanner) {
        qrScanner.stop().then(() => {
            console.log("QR scanning stopped.");
            forceStopCamera();
        }).catch(error => console.error("Error stopping scanner:", error));
        closeApp('qr-scanner')
    } else {
        console.warn("Scanner is not running or already stopped.");
    }
}


// Function to restart the scanner properly
function restartScanner() {
    if (qrScanner) {
        qrScanner.stop().then(() => {
            console.log("Restarting scanner...");
            qrScanner = new Html5Qrcode("qr-reader"); // Reinitialize after stopping
        }).catch(error => console.error("Error stopping scanner during restart:", error));
    } else {
        console.warn("Scanner is not initialized yet, creating new instance...");
        qrScanner = new Html5Qrcode("qr-reader");
    }
}

// Validate QR code scan results
function checkQRCode(message) {
    try {
        const scannedData = JSON.parse(message);

        const eventColorInput = document.getElementById("edit-event-color");
        const eventTxtColorInput = document.getElementById("edit-event-txt");

        const eventDetails = {
            name: document.getElementById("edit-title").value || "",
            date: document.getElementById("edit-date").value || "",
            location: document.getElementById("edit-location").value || "",
            eventColor: eventColorInput ? eventColorInput.value : "navy",
            eventtxtColor: eventTxtColorInput ? eventTxtColorInput.value : "black",
        };

        document.getElementById("qr-info").innerText = JSON.stringify(eventDetails);

        const expectedMessage = JSON.stringify(eventDetails);
        console.log("Scanned QR:", scannedData);
        console.log("Expected QR:", expectedMessage);

        if (JSON.stringify(scannedData) === expectedMessage) {
            showFinishedScanMessage(true);
        } else {
            showFinishedScanMessage(false);
            setTimeout(startScanning, 5000); // Retry scanning after 5 seconds
        }
    } catch (error) {
        console.error("Invalid QR format:", error);
        showFinishedScanMessage(false);
    }
}

// Force stop camera stream (avoid conflicts when restarting scanner)
function forceStopCamera() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            stream.getTracks().forEach(track => track.stop());
            console.log("Camera stream stopped.");
        })
        .catch(error => {
            console.error("Error stopping camera stream:", error);
        });
}



// Display a message based on whether the QR scan was successful
function showFinishedScanMessage(success) {
  const selectedOption = document.querySelector('input[name="Assigned"]:checked');
  const assignedArea = selectedOption ? selectedOption.id : "no-assigned";

  // Retrieve and update seat index from localStorage
  let seatIndex = parseInt(localStorage.getItem("seatIndex")) || 1;
  localStorage.setItem("seatIndex", seatIndex + 1);
  localStorage.setItem(
    `amtPeople-${document.getElementById("edit-title").value}`,
    seatIndex + 1
  );

  openApp("scanner-results");
  const container = document.getElementById("scanner-results");

  const eventDetails = {
    name: document.getElementById("edit-title").value,
    date: document.getElementById("edit-date").value,
    info:
      document.getElementById("edit-info").value ||
      "No Info Left by Event Creator.",
    location: document.getElementById("edit-location").value,
    assignedArea: assignedArea,
    whenScannedInstructions:
      document.getElementById("when-scanned").value ||
      'No "When Scanned" Instructions',
    beAware:
      document.getElementById("be-aware-about").value ||
      'No "Be Aware About" Instructions',
    eventColor:
      document.getElementById("edit-event-color").value || "navy",
  };

  if (success) {
    container.innerHTML = `
      <i class="fa-solid fa-square-check status"></i>
      <h1>QR Matches Up!</h1>
      <p>Take time to read the rules and instructions</p>
      <div class="app-section-app">
      <h2>Info</h2>
      <p>${eventDetails.info}</p>
      </div>
      <div class="app-section-app">
      <h2>When Scanned Instructions</h2>
      <p>${eventDetails.whenScannedInstructions}</p>
      </div>
      <div class="app-section-app">
      <h2>Be Aware About</h2>
      <p>${eventDetails.beAware}</p>
      <p>When scanned, you're in. Remember, no re-entry after 6 hours since the start date. You must show your QR code when asked. You may NOT share this QR code with another person.</p>
      </div>
      
      <div class="app-section-app">
          <h1>Assigned Seating Position</h1>
          <p>${
            assignedArea === "no-assigned"
              ? "General Admission"
              : `Seat Number: ${seatIndex}`
          }</p>
      </div>
      
      <div class="app-section-app">
          <h2>Make Sure to Agree</h2>
          <p>Failure to agree will result in removal from the event.</p>
          <label for="agree-check">
              <input type="radio" id="agree-check" name="agree-radio"> I agree to the printed text above and am ready.
          </label>
          <br>
          <button onclick="checkIfAgree('agree-check')">Agree and Enter</button>
      </div>`;
  } else {
    container.innerHTML = `
      <i class="fa-solid fa-triangle-exclamation status"></i>
      <h1>Scan Again</h1>
      <p>You may have provided the wrong QR code or didn't scan it properly. Try again, or contact the event organizer for help.</p>`;
    setTimeout(() => {
      closeApp("scanner-results");
    }, 5000);
  }
}

function generateQRCode() {
    let eventDetails = {
        name: document.getElementById("edit-title").value,
        date: document.getElementById("edit-date").value,
        location: document.getElementById("edit-location").value,
        eventColor: document.getElementById('edit-event-color').value || `navy`,
        eventtxtColor: document.getElementById('edit-event-txt').value || `black`,
    };
    let otherData = {
        startEntry: document.getElementById('before-start').value || '3',
        stopEntry: document.getElementById('after-shut').value || '6',
    };

    let qrCanvas = document.getElementById("qrCanvas");
    let ctx = qrCanvas.getContext("2d");

    qrCanvas.width = 600;
    qrCanvas.height = 350;

    // Set solid background color
    ctx.fillStyle = eventDetails.eventColor;
    ctx.fillRect(0, 0, qrCanvas.width, qrCanvas.height);

    // Dark overlay effect
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(0, 0, qrCanvas.width, qrCanvas.height);

    // Generate QR Code
    let qrElement = document.createElement("div");
    new QRCode(qrElement, {
        text: JSON.stringify(eventDetails),
        width: 200,
        height: 200
    });

    setTimeout(() => {
        let qrImage = qrElement.querySelector("img");
        if (!qrImage) return console.error("QR Code generation failed.");
        qrImage.style.borderRadius = '3px'

        // Draw QR Code
        ctx.drawImage(qrImage, 50, 50);

        // Apply text shadows
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 4;

        // Draw header text
        ctx.fillStyle = "gold";
        ctx.font = "bold 26px Playfair Display";
        ctx.fillText("🎟️ PrimePass", 10, 25);

        // Reset shadow for regular text
        ctx.shadowColor = "transparent";

        // Add text wrapping
        ctx.fillStyle = eventDetails.eventtxtColor;
        ctx.font = "16px Poppins";
        let lines = [
            `🎟️ Event: ${eventDetails.name}`,
            `📅 Date: ${eventDetails.date}`,
            `📍 Location: ${eventDetails.location}`,
        ];
        let x = 270, y = 60, lineHeight = 30;

        lines.forEach(line => {
            ctx.fillText(line, x, y);
            y += lineHeight;
        });

        ctx.fillStyle = "gold";
        ctx.font = "16px Oswald";
        ctx.fillText("Scan this QR code at the event entry.", 40, 280);

        ctx.fillStyle = "white";
        ctx.font = "10px Poppins";
        ctx.fillText(`Ticket is voided ${otherData.stopEntry} hours after the event.`, 5, 300);
        ctx.fillText(`First entry permitted ${otherData.startEntry} hours before event. Voided if lost, deleted, or shared with another, unless event organizer.`, 5, 320);
        ctx.fillText(`Must show QR when required.`, 5, 340)
    }, 500);
}


function downloadQRCode() {
    let qrCanvas = document.getElementById("qrCanvas");
    let qrImage = qrCanvas.toDataURL("image/png");

    let link = document.createElement("a");
    link.href = qrImage;
    link.download = "primepass_ticket.png";
    link.click();
}

// Share

function shareCanvas(platform) {
    let canvas = document.getElementById("qrCanvas");
    if (!canvas) return alert("No image available to share!");

    let message = "Join this event that I am hosting! Here's your ticket.";

    canvas.toBlob(blob => {
        let blobUrl = URL.createObjectURL(blob); // Generate Blob URL

        switch (platform) {
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(blobUrl)}`, "_blank");
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(blobUrl)}`, "_blank");
                break;
            case 'linkedin':
                window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(blobUrl)}&title=${encodeURIComponent("Join me!")}`, "_blank");
                break;
            case 'reddit':
                window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(blobUrl)}&title=${encodeURIComponent("Join me!")}`, "_blank");
                break;
            case 'whatsapp':
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message + " " + blobUrl)}`, "_blank");
                break;
            case 'copyLink':
                navigator.clipboard.writeText(blobUrl);
                alert("Image URL copied to clipboard!");
                break;
            case 'native':
                let file = new File([blob], "event-ticket.png", { type: "image/png" });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    navigator.share({ title: "Event Invite", text: message, files: [file] })
                        .then(() => console.log("Successfully shared"))
                        .catch(error => console.error("Error sharing:", error));
                } else {
                    alert("Native sharing is not supported on this device.");
                }
                break;
            default:
                alert("Unsupported platform");
                break;
        }
    }, "image/png");
}

function checkIfAgree(element) {
    var checkbox = document.getElementById(element)

    if (checkbox.checked) {
        closeApp('scanner-results');
        startScanning()
        checkbox.checked = false
    } else {
        alert('Agree to the rules first.')
    }
}

function getFileAndShare(event) {
    var fileName = 'event.json'
    // Convert event object to a JSON string
    const jsonString = JSON.stringify(event, null, 2); // Pretty formatting

    // Create a Blob and a temporary anchor tag to trigger a download
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
