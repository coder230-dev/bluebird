var unsavedChanges = true
// Warn before reloading or closing the page
window.addEventListener("beforeunload", (event) => {
    if (unsavedChanges) {
        event.preventDefault(); 
        console.log('Reload?')
        event.returnValue = "You have unsaved changes. Are you sure you want to leave?";
    }
});

/***** DATABASE SETUP *****/
const dbName = "FileStorageDB";
const storeName = "files";

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 2);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                // Create the store and add indexes for the file name and type.
                const store = db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
                store.createIndex("name", "name", { unique: false });
                store.createIndex("type", "type", { unique: false });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Database initialization failed");
    });
}

async function saveFile(name, type, data, base64) {
    const base64Data = ''
    if (!name) return;
    if (base64) {
        const base64Data = btoa(data);
    } else {
        const base64Data = data
    }
    const db = await initDB();
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    store.add({ name: name, type: type, data: base64Data });

    transaction.oncomplete = () => {
        console.log("File saved:", name);
        loadFiles(); // Refresh saved files
    };
}


async function loadFiles() {
    const db = await initDB();
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
        const files = request.result;
        const container = document.getElementById("saved-files");
        if (container) {
            // container.innerHTML = ""; // Clear previous entries
            files.forEach((file) => {
                // Create an element based on whether it's an image or not.
                const elem = document.createElement(file.type.startsWith("image/") ? "img" : "p");
                 
                elem.classList.add('file-home-screen')
                if (file.type.startsWith("image/")) {
                    elem.src = file.data;
                }
                elem.innerText = file.name;
                elem.style.margin = "10px";
                // Clicking the saved file triggers the file handler
                elem.addEventListener('click', function () {
                    var fileData = decodeIfBase64(file.data).split('/')
                    loadContent(file.type, fileData, file.name);
                });
                container.appendChild(elem);
            });
        }
    };

    request.onerror = () => console.error("Failed to retrieve files from database.");
}

function decodeIfBase64(str) {
    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;

    if (base64Regex.test(str)) {
        try {
            return atob(str); // Decodes Base64 to original text
        } catch (e) {
            return str; // In case of unexpected errors, return the original string
        }
    }
    return str; // If not Base64, return unchanged
}


async function editFile(id) {
    const db = await initDB();
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
        const file = getRequest.result;
        if (file) {
            // Populate the edit form with existing file details
            document.getElementById("editFileName").value = file.name;
            document.getElementById("editFileType").value = file.type;
            document.getElementById("editFileId").value = id; // Store ID for updating
            
            // Display the edit form
            document.getElementById("edit-form-container").style.display = "block";
        } else {
            console.error("File not found.");
        }
    };

    getRequest.onerror = () => console.error("Error retrieving file for editing.");
}

async function updateFile() {
    const id = document.getElementById("editFileId").value;
    const newName = document.getElementById("editFileName").value;
    const newType = document.getElementById("editFileType").value;

    const db = await initDB();
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const getRequest = store.get(Number(id));

    getRequest.onsuccess = () => {
        const file = getRequest.result;
        if (file) {
            file.name = newName;
            file.type = newType;

            const putRequest = store.put(file);
            putRequest.onsuccess = () => {
                console.log("File updated:", newName);
                loadFiles(); // Refresh saved files
                document.getElementById("edit-form-container").style.display = "none"; // Hide form after update
            };
            putRequest.onerror = () => console.error("Error updating file.");
        }
    };

    getRequest.onerror = () => console.error("Error retrieving file for updating.");
}


async function deleteFile(id) {
    const db = await initDB();
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const delRequest = store.delete(id);

    delRequest.onsuccess = () => {
        console.log("File deleted");
        loadFiles();
    };

    delRequest.onerror = () => console.error("Error deleting file.");
}

async function isFileSaved(fileName) {
    const db = await initDB();
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const index = store.index("name"); // Using the index for file names
    const request = index.get(fileName);

    return new Promise((resolve) => {
        request.onsuccess = () => {
            resolve(!!request.result); // Returns true if file exists, false otherwise
        };
        request.onerror = () => resolve(false);
    });
}

// Example usage:
isFileSaved("example.pdf").then((exists) => {
    console.log(exists ? "File is saved in the database" : "File is not found");
});


/***** FILE VIEWER & INTERACTION *****/

// Current URL helper variable
const currentUrl = new URL(window.location.href);

/***** File Viewer Code with Custom Toolbars *****/

// Create a hidden file input element
const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.style.display = "none";
document.body.appendChild(fileInput);

// Get UI element references
const uploadBox = document.getElementById("drag-box");
const urlInput = document.getElementById("pathToUrl");

// Click on upload box opens file dialog
if (uploadBox) {
    uploadBox.addEventListener("click", () => fileInput.click());
}

// File selection via file input fires file processing
fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
        handleFileUpload(fileInput.files[0]);
    }
});

// Hide the preloader on window load and load from URL parameters
window.onload = () => {
    const preloaderEl = document.querySelector('preloader');
    if (preloaderEl) preloaderEl.style.display = 'none';
    showGreeter('greeter');
    loadFromParams();
    loadFiles(); // Auto-load files from database when page is loaded.
};

// Handle drag-and-drop file uploads
if (uploadBox) {
    uploadBox.addEventListener("dragover", (event) => {
        event.preventDefault();
        uploadBox.style.borderColor = "#ff9800"; // Highlight while dragging over
    });
    uploadBox.addEventListener("dragleave", () => {
        uploadBox.style.borderColor = "#ccc"; // Reset border on drag leave
    });
    uploadBox.addEventListener("drop", (event) => {
        event.preventDefault();
        uploadBox.style.borderColor = "#ccc";
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
}

// Handle URL input changes
if (urlInput) {
    urlInput.addEventListener("change", () => {
        if (urlInput.value.trim()) {
            handleFileUpload(urlInput.value.trim());
        }
    });
}

/*
 * promptForURLHandling
 * Displays the URL type selection container and waits for a click.
 */
function promptForURLHandling(url) {
    // Show URL type selection container (assumed to have ID "file-type-url")
    displayContainer('file-type-url', true);
    const urlNextBtn = document.getElementById('url-type-next');
    if (urlNextBtn) {
        urlNextBtn.addEventListener('click', function handler() {
            const selectedInput = document.querySelector('input[name="typeFile-url"]:checked');
            if (selectedInput) {
                loadContent(selectedInput.value.toLowerCase(), url, url);
                // Remove the listener after handling
                urlNextBtn.removeEventListener('click', handler);
            } else {
                console.warn("No URL file type selected.");
            }
        });
    }
}

/*
 * loadContent
 * Loads file content into the preview container with a custom toolbar based on the type.
 */
function loadContent(type, content, fileName) {
    const preview = document.createElement('div');
    preview.classList.add('preview-file-element');
    preview.id = `preview-element-id-${fileName}`
    preview.innerHTML = "";
    
    // Append custom toolbars and content based on type
    if (type === "image") {
        const fileLogo = `<i class="fa-solid fa-image"></i>` 
        preview.innerHTML += createToolbar("image", content, fileName);
        preview.innerHTML += `<img id="imageContent" draggable="false" src="${content}" alt="${fileName}" style="min-height: calc(100% - 77px); transition: transform 0.3s ease-in-out;"/>`;
        setTimeout(() => {
            const img = document.getElementById("imageContent");
            let zoomed = false;
            const zoomButton = document.getElementById("zoomButton");
            if (zoomButton && img) {
                zoomButton.addEventListener("click", () => {
                    zoomed = !zoomed;
                    img.style.transform = zoomed ? `scale(${document.getElementById('zoom-factor').value || 2})` : "scale(1)";
                });
                enableImagePanZoom(img);
            }
        }, 50);
    } 
    else if (type === "iframe") {
        const fileLogo = `<i class="fa-solid fa-link"></i>` 
        preview.innerHTML += createToolbar("iframe", content, fileName);
        preview.innerHTML += `<iframe id="iframeContent" src="${content}" style="width:100%; height:500px; border:none;"></iframe>`;
        setTimeout(() => {
            const reloadBtn = document.getElementById("iframeReload");
            const goBtn = document.getElementById("iframeGo");
            if (reloadBtn) {
                reloadBtn.addEventListener("click", () => {
                    const iframe = document.getElementById("iframeContent");
                    if (iframe) iframe.src = iframe.src;
                });
            }
            if (goBtn) {
                goBtn.addEventListener("click", () => {
                    const newUrl = document.getElementById("iframeAddress").value;
                    const iframe = document.getElementById("iframeContent");
                    if (iframe) iframe.src = newUrl;
                });
            }
        }, 50);
    } 
    else if (type === "text") {
        const fileLogo = `<i class="fa-solid fa-font"></i>` 
        preview.innerHTML += createToolbar("text", content, fileName);
        preview.innerHTML += `<div class="flexbox">
            <div>
              <h3>Your Upload</h3>
              <textarea id="textContent" readonly style="width:100%; height:300px;">${content}</textarea>
              <details>
                <summary><h3>Add CSS</h3></summary>
                <textarea id="cssTextContent" readonly style="width:100%; height:300px;" placeholder="Added a HTML file? Add your custom CSS here to see it if it works. You cannot upload CSS files (at the moment)."></textarea>
              </details>
              <details>
                <summary><h3>Add HTML</h3></summary>
                <textarea id="htmlTextContent" readonly style="width:100%; height:300px;" placeholder="Add custom HTML here if needed."></textarea>
              </details>
            </div>
            <iframe id="sidebarTxt"></iframe>
          </div>`;
        setTimeout(() => {
            const editButton = document.getElementById("editButton");
            const saveButton = document.getElementById("saveButton");
            const textArea  = document.getElementById("textContent");
            const cssTextArea = document.getElementById("cssTextContent");
            if (editButton && saveButton && textArea && cssTextArea) {
                editButton.addEventListener("click", () => {
                    textArea.removeAttribute("readonly");
                    cssTextArea.removeAttribute("readonly");
                    editButton.style.display = "none";
                    saveButton.style.display = "inline-block";
                });
                saveButton.addEventListener("click", () => {
                    textArea.setAttribute("readonly", true);
                    cssTextArea.setAttribute("readonly", true);
                    editButton.style.display = "inline-block";
                    saveButton.style.display = "none";
                    // Optionally, add additional save logic (download file etc.)
                });
                document.getElementById("toggleDarkMode").addEventListener("click", () => {
                    textArea.classList.toggle("dark-mode");
                    cssTextArea.classList.toggle("dark-mode");
                });
                document.getElementById('showRightBar').addEventListener('click', function() {
                    const sidebar = document.getElementById('sidebarTxt');
                    if (sidebar) {
                        sidebar.style.display = 'block';
                        sidebar.contentDocument.body.innerHTML = `<style>${cssTextArea.value}</style>${textArea.value}`;
                    }
                });
            }
        }, 50);
    } 
    else if (type === "video") {
        const fileLogo = `<i class="fa-solid fa-film"></i>`
        preview.innerHTML += createToolbar("video", content, fileName);
        preview.classList.add("center-content");
        preview.innerHTML += `<div class="video-container">
            <video id="customVideo" src="${content}"></video>
            <div class="video-controls" id="video-controls">
                <div>
                    <button title="Rewind 5 sec." id="rewind"><i class="fa-solid fa-rotate-left"></i></button>
                    <button title="Play/Pause" id="playPause"><i class="fa-solid fa-play"></i></button>
                    <button title="Skip 5 sec." id="forward"><i class="fa-solid fa-rotate-right"></i></button>
                </div>
                <div>
                    <span id="videoTimestamp"></span>
                    <input type="range" id="progressBar" min="0" max="100" value="0">
                </div>
                <div>
                    <button title="More Options" id="moreOptions"><i class="fa-solid fa-ellipsis"></i></button>
                    <div class="more-menu">
                        <label class="m-option" for="speed">Speed:
                            <select id="speed">
                                <option value="0.5">0.5x</option>
                                <option value="1" selected>1x</option>
                                <option value="1.5">1.5x</option>
                                <option value="2">2x</option>
                            </select>
                        </label>
                        <button title="Picture-in-Picture Mode" class="m-option" id="pipMode"><i class="material-symbols-rounded">picture_in_picture_alt</i>Picture-in-Picture</button>
                        <button title="Mute/Volume" class="m-option" id="muteToggle"><i class="fa-solid fa-volume-off"></i></button>
                        <input type="range" id="volumeControl" min="0" max="1" step="0.1" value="1">
                    </div>
                    <button title="Fullscreen" id="fullscreen"><i class="fa-solid fa-expand"></i></button>
                </div>
            </div>
            </div>`;
        setTimeout(() => {
            getVideoPlayerReady();
        }, 50);
    }
    else if (type === "audio") {
        const fileLogo = `<i class="fa-solid fa-headphones"></i>`
        preview.innerHTML += createToolbar("audio", content, fileName);
        preview.innerHTML += `<audio id="audioContent" controls style="width:100%;">
                                <source src="${content}">
                                Your browser does not support the audio element.
                              </audio>`;
        setTimeout(() => {
            const volumeControl = document.getElementById("audioVolume");
            const audio = document.getElementById("audioContent");
            if (volumeControl && audio) {
                volumeControl.addEventListener("input", () => {
                    audio.volume = volumeControl.value / 100;
                });
            }
        }, 50);
    } 
    else if (type === "html") {
        const fileLogo = `<i class="fa-solid fa-code"></i>`
        // For HTML content, fetch and display inside a div along with a text toolbar.
        preview.innerHTML += createToolbar("text", content, fileName);
        fetch(content)
            .then((response) => response.text())
            .then((data) => {
                preview.innerHTML += `<div id="htmlContent">${data}</div>`;
            })
            .catch(() => {
                preview.innerHTML += `<p>Failed to load HTML content.</p>`;
            });
    } 
    else {
        preview.innerHTML += `<p>Unsupported type: ${type}</p>`;
    }

    const container = document.getElementById('files-preview-sec');
    if (!container.contains(preview)) {
        container.appendChild(preview);
    }

    displayPreview(true, fileName);

    var previewElementHome = document.createElement('div')

    previewElementHome.classList.add('box');
    previewElementHome.id = `previewElementHome-id-${fileName}`
    previewElementHome.innerHTML = `
    <h1>${fileLogo} ${fileName}</h1>
    <p>${type}</p>
    `
    unsavedChanges = true
    document.getElementById('no-uploads').style.display = 'none';
    previewElementHome.addEventListener('click', function() {
        displayPreview(true, fileName)
    })
    document.getElementById('saved-files').appendChild(previewElementHome)

    // Update URL parameters so the page state can be shared or reloaded.
    // currentUrl.searchParams.set('fileName', fileName);
    // currentUrl.searchParams.set('fileType', type);
    // currentUrl.searchParams.set('fileContent', content);
    window.history.pushState({}, '', currentUrl);
}

/*
 * createToolbar
 * Returns a toolbar HTML string customized for the given type.
 */
function createToolbar(type, content, fileName) {
    let toolbar = `<nav> <h1 id="fileTitle">${fileName}</h1>`;

    if (type === "iframe") {
        toolbar += `
            <button id="iframeReload">🔄 Reload</button>
            <input type="text" id="iframeAddress" value="${content}" style="width: 60%;">
            <button id="iframeGo">➡️ Go</button>
            <button><i class="fa-solid fa-caret-down"></i> Open in..</button>
        `;
    } else if (type === "image") {
        toolbar += `
            <div>
                <input type="number" id="zoom-factor" max="9" min="1" step="0.1" value="2">
                <button id="zoomButton"><i class="fa-solid fa-magnifying-glass"></i></button>
            </div>
        `;
    } else if (type === "text") {
        toolbar += `
            <div>
                <button title="Edit" id="editButton"><i class="fa-solid fa-pen"></i></button>
                <button title="Toggle Dark Mode" id="toggleDarkMode"><i class="fa-solid fa-moon"></i></button>
                <button title="Show Sidebar" id="showRightBar"><i class="material-symbols-rounded">view_sidebar</i></button>
                <button title="Save Changes" id="saveButton" style="display: none;"><i class="fa-solid fa-check"></i></button>
            </div>
        `;
    } else if (type === "video") {
        toolbar += `<button id="videoFullscreen">⛶ Fullscreen</button>`;
    } else if (type === "audio") {
        toolbar += `
            <label for="audioVolume">🔊 Volume:</label>
            <input type="range" id="audioVolume" min="0" max="100" value="50">
        `;
    }

    toolbar += `<button id="close-btn-for-element-${fileName}" onclick="displayPreview()">
                    <i class="fa-solid fa-xmark"></i>
                 </button></nav>`;

    return toolbar;
}

function contextMenu(id, event) {
    event.preventDefault(); // Prevent default right-click behavior

    const menu = document.getElementById(id);
    if (!menu) return;

    // Get mouse position
    let mouseX = event.clientX;
    let mouseY = event.clientY;
    
    // Ensure menu stays within screen bounds
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;

    if (mouseX + menuWidth > windowWidth) mouseX = windowWidth - menuWidth - 10;
    if (mouseY + menuHeight > windowHeight) mouseY = windowHeight - menuHeight - 10;

    // Set position and display
    menu.style.display = "block";
    menu.style.left = `${mouseX}px`;
    menu.style.top = `${mouseY}px`;
}

document.addEventListener("click", (event) => {
    if (!event.target.closest('.context-menu')) {
        document.querySelectorAll(".context-menu").forEach(menu => {
            menu.style.display = "none";
        });
    }
});


/*
 * displayContainer
 * Hides all containers with class "container" then displays the one specified.
 */
function displayContainer(element, show = false) {
    const target = document.getElementById(element);
    if (target) {
        if (show) {
            target.classList.add('open-cont')
        } else {
            target.classList.remove('open-cont')
        }
    }
    if (element === 'preview') {
        document.getElementById('preview').innerHTML = '';
    }
}

function displayPreview(show, name) {
    if (show) {
        document.getElementById(`preview-element-id-${name}`).style.display = 'block';
    } else {
        document.getElementById('files-preview-sec').querySelectorAll('div').forEach((e) => {
            e.style.display = 'none';
        });

    }
}

/*
 * handleFileUpload
 * Processes both file uploads and URL inputs.
 */
function handleFileUpload(fileOrUrl) {
    // If the input is a URL (a string starting with "http" or data URL), handle accordingly.
    if (typeof fileOrUrl === "string" && (fileOrUrl.startsWith("http") || fileOrUrl.startsWith('data:'))) {
        return promptForURLHandling(fileOrUrl);
    }
    // Skip unsupported file types (e.g., .exe files)
    if (!fileOrUrl || fileOrUrl.name.endsWith(".exe")) {
        console.warn("Skipping unsupported file:", fileOrUrl?.name || fileOrUrl);
        return;
    }
    console.log("File Name:", fileOrUrl.name);
    console.log("Uploading:", fileOrUrl);
    console.log("Type:", fileOrUrl.type);
    console.log("Name:", fileOrUrl.name);
    
    const reader = new FileReader();
    // Process file based on type
    if (fileOrUrl.type.startsWith("image/")) {
        reader.readAsDataURL(fileOrUrl);
        reader.onload = (e) => loadContent("image", e.target.result, fileOrUrl.name);
    } else if (
        fileOrUrl.type.startsWith("text/") ||
        fileOrUrl.type === "application/json" ||
        fileOrUrl.type === "text/html" ||
        fileOrUrl.type === "text/css" ||
        fileOrUrl.type === "application/javascript"
    ) {
        reader.readAsText(fileOrUrl);
        reader.onload = (e) => {loadContent("text", e.target.result, fileOrUrl.name); // saveFile(fileOrUrl.name, 'text', e.target.result, false)
        }
    } else if (fileOrUrl.type.startsWith("audio/")) {
        reader.readAsDataURL(fileOrUrl);
        reader.onload = (e) => loadContent("audio", e.target.result, fileOrUrl.name);
    } else if (fileOrUrl.type.startsWith("video/")) {
        const videoURL = URL.createObjectURL(fileOrUrl);
        loadContent("video", videoURL, fileOrUrl.name);
    } else if (fileOrUrl.type.startsWith("application/pdf")) {
        const pdfURL = URL.createObjectURL(fileOrUrl);
        loadContent("iframe", pdfURL, fileOrUrl.name);

    } else {
        console.warn("Unsupported file type:", fileOrUrl.type);
    }

    // Save the file in the database (only if it’s a proper File object)
}

/***** IMAGE PAN & ZOOM *****/
function enableImagePanZoom(imgElement) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let translateX = 0;
    let translateY = 0;

    imgElement.style.cursor = "grab";
    imgElement.style.transformOrigin = "center center";

    imgElement.addEventListener("mousedown", (event) => {
        // Only allow dragging if the image is zoomed in
        if (imgElement.style.transform.includes("scale(2)")) {
            isDragging = true;
            startX = event.clientX - translateX;
            startY = event.clientY - translateY;
            imgElement.style.cursor = "grabbing";
        }
    });

    imgElement.addEventListener("mousemove", (event) => {
        if (isDragging) {
            translateX = event.clientX - startX;
            translateY = event.clientY - startY;
            imgElement.style.transform = `scale(${document.getElementById('zoom-factor').value || 2}) translate(${translateX}px, ${translateY}px)`;
        }
    });

    imgElement.addEventListener("mouseup", () => {
        isDragging = false;
        imgElement.style.cursor = "grab";
    });

    imgElement.addEventListener("mouseleave", () => {
        isDragging = false;
        imgElement.style.cursor = "grab";
    });

    // Reset zoom on double click
    imgElement.addEventListener("dblclick", () => {
        imgElement.style.transform = "scale(1)";
        translateX = 0;
        translateY = 0;
    });

    // Trackpad support (scroll zoom)
    imgElement.addEventListener("wheel", (event) => {
        event.preventDefault();
        if (event.deltaY < 0) {
            imgElement.style.transform = "scale(2)";
        } else {
            imgElement.style.transform = "scale(1)";
        }
    });
}

/***** VIDEO CONTROLS *****/
function getVideoPlayerReady() {
    const video = document.getElementById("customVideo");
    const playPause = document.getElementById("playPause");
    const rewind = document.getElementById("rewind");
    const forward = document.getElementById("forward");
    const progressBar = document.getElementById("progressBar");
    const speedControl = document.getElementById("speed");
    const pipMode = document.getElementById("pipMode");
    const muteToggle = document.getElementById("muteToggle");
    const volumeControl = document.getElementById("volumeControl");
    const fullscreen = document.getElementById("fullscreen");
    const timestamp = document.getElementById("videoTimestamp");
    const controls = document.getElementById("video-controls");
    let hideControlsTimeout;

    if (!video || !playPause || !rewind || !forward || !progressBar || !controls) return;

    // Play/Pause toggle
    playPause.addEventListener("click", () => {
        if (video.paused) {
            video.play();
            playPause.innerHTML = `<i class="fa-solid fa-pause"></i>`;
        } else {
            video.pause();
            playPause.innerHTML = `<i class="fa-solid fa-play"></i>`;
        }
    });

    video.addEventListener("waiting", function() {
        showPreloader(99999999);
    });
    
    video.addEventListener("playing", function() {
        showPreloader();
    });

    video.addEventListener("click", function() {
        if (video.paused) {
            video.play();
            playPause.innerHTML = `<i class="fa-solid fa-pause"></i>`;
        } else {
            video.pause();
            playPause.innerHTML = `<i class="fa-solid fa-play"></i>`;
        }
    });

    // Seek backward 5 seconds
    rewind.addEventListener("click", () => {
        video.currentTime -= 5;
    });

    // Seek forward 5 seconds
    forward.addEventListener("click", () => {
        video.currentTime += 5;
    });

    // Update progress bar while playing
    video.addEventListener("timeupdate", () => {
        progressBar.value = (video.currentTime / video.duration) * 100;
        timestamp.textContent = formatTime(video.currentTime) + " / " + formatTime(video.duration);
    });

    const hideControls = () => {
        controls.style.opacity = "0";
        controls.style.pointerEvents = "none";
        controls.style.cursor = "none";
        video.style.cursor = "none";
    };

    const showControls = () => {
        controls.style.opacity = "1";
        controls.style.pointerEvents = "auto";
        video.style.cursor = "unset";
        clearTimeout(hideControlsTimeout);
        controls.style.cursor = "unset";
        hideControlsTimeout = setTimeout(hideControls, 3000);
    };

    document.addEventListener("mousemove", showControls);
    document.addEventListener("keydown", showControls);
    video.onplay = showControls;
    video.onpause = showControls;

    // Seek manually using progress bar
    progressBar.addEventListener("input", () => {
        video.currentTime = (progressBar.value / 100) * video.duration;
    });

    // Adjust playback speed
    if (speedControl) {
        speedControl.addEventListener("change", () => {
            video.playbackRate = speedControl.value;
        });
    }

    // Enable PiP mode
    if (pipMode) {
        pipMode.addEventListener("click", () => {
            if (document.pictureInPictureEnabled) {
                video.requestPictureInPicture();
            }
        });
    }

    // Mute toggle
    if (muteToggle) {
        muteToggle.addEventListener("click", () => {
            video.muted = !video.muted;
            muteToggle.innerHTML = video.muted
                ? `<i class="fa-solid fa-volume-high"></i>`
                : `<i class="fa-solid fa-volume-xmark"></i>`;
        });
    }

    // Volume control
    if (volumeControl) {
        volumeControl.addEventListener("input", () => {
            video.volume = volumeControl.value;
        });
    }

    // Fullscreen toggle
    if (fullscreen) {
        fullscreen.addEventListener("click", () => {
            if (!document.fullscreenElement) {
                video.parentElement.requestFullscreen();
                fullscreen.innerHTML = `<i class="fa-solid fa-compress"></i>`;
            } else {
                document.exitFullscreen();
                fullscreen.innerHTML = `<i class="fa-solid fa-expand"></i>`;
            }
        });
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function showPreloader(seconds = 1000) {
    const preloader = document.querySelector('preloader');
    if (preloader) {
        preloader.style.display = 'flex';
        setTimeout(() => {
            preloader.style.display = 'none';
        }, seconds);
    }
}

function showGreeter(messageContainer) {
    const messages = ["Hello", "Hi", "Greetings", "What's up?", "Hey"];
    const container = document.getElementById(messageContainer);
    if (container) {
        container.innerHTML = messages[Math.floor(Math.random() * messages.length)];
    }
}

function loadFromParams() {
    if (currentUrl.searchParams.get('fileName') && 
        currentUrl.searchParams.get('fileType') && 
        currentUrl.searchParams.get('fileContent')) {
            loadContent(
                currentUrl.searchParams.get('fileType'),
                currentUrl.searchParams.get('fileContent'),
                currentUrl.searchParams.get('fileName')
            );
    }
}
