// -- Fullscreen exit detection --
document.addEventListener('keydown', function(event) {
    if (event.key.toLowerCase() === 'e') {
        document.getElementById('front').classList.remove('full-screen-mode');
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
    }
});
document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
        document.getElementById('front').classList.remove('full-screen-mode');
    }
});

// -- Main app functionality --
  const fileInput = document.getElementById("fileInput");
  const storyContainer = document.querySelector(".story-container");
  const progressContainer = document.querySelector(".progress-bar-container");
  const managerPopup = document.getElementById("managerPopup");
  const managerContainer = document.querySelector(".media-manager");
  const openManagerBtn = document.getElementById("openManager");
  const closeManagerBtn = document.getElementById("closeManager");
  const pauseBtn = document.getElementById("pauseBtn");
  const muteBtn = document.getElementById("muteBtn");
document.addEventListener('DOMContentLoaded', function() {

    let stories = [];         // Array of media elements
    let mediaData = [];       // Array of media info objects for URL (type and base64 for images)
    let managerItems = [];    // Thumbnails
    let currentIndex = 0;
    let transitionDuration = 5000;
    let interval;
    let isPaused = false;
    let isMuted = true; // default muted for videos
    
    // Check URL params for media
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("media")) {
        try {
            const savedMedia = JSON.parse(decodeURIComponent(urlParams.get("media")));
            // Load saved media into the gallery (only for images in base64, videos not restored)
            if (Array.isArray(savedMedia)) {
                savedMedia.forEach((item) => {
                    // Create element based on type; here we treat type "image" only
                    if (item.type === "image") {
                        const img = document.createElement("img");
                        img.src = item.data; // base64 string
                        img.classList.add("story-item");
                        storyContainer.appendChild(img);
                        stories.push(img);
                        // Create a simple thumbnail
                        const thumb = document.createElement("div");
                        thumb.classList.add("manager-item");
                        const thumbImg = document.createElement("img");
                        thumbImg.src = item.data;
                        thumb.appendChild(thumbImg);
                        // Remove button in manager
                        const removeBtn = document.createElement("button");
                        removeBtn.classList.add("remove-btn");
                        removeBtn.textContent = "×";
                        removeBtn.addEventListener("click", (e) => {
                            e.stopPropagation();
                            removeMedia(managerItems.indexOf(thumb));
                        });
                        thumb.appendChild(removeBtn);
                        thumb.addEventListener("click", () => {
                            currentIndex = managerItems.indexOf(thumb);
                            showStory(currentIndex);
                        });
                        managerContainer.appendChild(thumb);
                        managerItems.push(thumb);
                    }
                });
                if (stories.length > 0) {
                    currentIndex = 0;
                    startPlayback();
                }
            }
        } catch (err) {
            console.error("Error parsing media from URL:", err);
        }
    }
    
    // File uploads and drag-drop
    fileInput.addEventListener("change", (event) => handleUpload(event.target.files));
    window.handleDrop = (event) => {
        event.preventDefault();
        handleUpload(event.dataTransfer.files);
    };
    
    // Manager popup controls
    openManagerBtn.addEventListener("click", () => {
        managerPopup.style.zIndex = '1000';
        managerPopup.style.opacity = '1';
        managerPopup.style.transform = 'scale(1)';
    });
    closeManagerBtn.addEventListener("click", () => {
        managerPopup.style.zIndex = '-10';
        managerPopup.style.opacity = '0';
        managerPopup.style.transform = 'scale(0.8)';
    });
    
    // Pause and Mute button functionality
    pauseBtn.addEventListener("click", () => {
        if (isPaused) {
            resumePlayback();
            pauseBtn.innerHTML = "<span>⏯</span>";
        } else {
            pausePlayback();
            pauseBtn.innerHTML = "<span>⏸</span>";
        }
        isPaused = !isPaused;
    });
    muteBtn.addEventListener("click", () => {
        isMuted = !isMuted;
        muteBtn.innerHTML = isMuted ? "<span>🔇</span>" : "<span>🔊</span>";
        stories.forEach(media => {
            if (media.tagName === "VIDEO") {
                media.muted = isMuted;
            }
        });
    });
    
    // Utility: Convert a file to a Base64 promise
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    }
    
    // Upload handler: create story items and manager thumbnails
    async function handleUpload(files) {
        // Clear out previous media
        stories = [];
        managerItems = [];
        mediaData = [];
        storyContainer.innerHTML = "";
        progressContainer.innerHTML = "";
        managerContainer.innerHTML = "";
        
        // Process all uploaded files
        for (const file of Array.from(files)) {
            let mediaElement;
            let mediaInfo = { type: "", data: "" };
            if (file.type.startsWith("video")) {
                mediaElement = document.createElement("video");
                mediaElement.src = URL.createObjectURL(file);
                mediaElement.setAttribute("muted", "true");
                mediaElement.setAttribute("playsinline", "true");
                mediaElement.autoplay = false;
                mediaElement.pause();
                mediaInfo.type = "video";
                // For videos, we won’t convert to base64—use the URL instead.
                mediaInfo.data = mediaElement.src;
            } else {
                mediaElement = document.createElement("img");
                // Convert image to base64
                try {
                    const base64Data = await fileToBase64(file);
                    mediaElement.src = base64Data;
                    mediaInfo.type = "image";
                    mediaInfo.data = base64Data;
                } catch (err) {
                    console.error("Error converting file:", err);
                    continue;
                }
            }
            mediaElement.classList.add("story-item");
            storyContainer.appendChild(mediaElement);
            stories.push(mediaElement);
            mediaData.push(mediaInfo);
            
            // Create manager thumbnail item
            const thumb = document.createElement("div");
            thumb.classList.add("manager-item");
            const thumbMedia = document.createElement("img");
            thumbMedia.src = mediaElement.src;
            thumb.appendChild(thumbMedia);
            // Remove Button
            const removeBtn = document.createElement("button");
            removeBtn.classList.add("remove-btn");
            removeBtn.textContent = "×";
            removeBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                removeMedia(managerItems.indexOf(thumb));
            });
            thumb.appendChild(removeBtn);
            // Clicking thumbnail jumps to that media
            thumb.addEventListener("click", () => {
                currentIndex = managerItems.indexOf(thumb);
                showStory(currentIndex);
            });
            managerContainer.appendChild(thumb);
            managerItems.push(thumb);
            
            // Create progress bar segment
            const progressSegment = document.createElement("div");
            progressSegment.classList.add("progress-segment");
            const activeSegment = document.createElement("div");
            activeSegment.classList.add("active-segment");
            progressSegment.appendChild(activeSegment);
            progressContainer.appendChild(progressSegment);
        }
        // Save media array (as JSON) into URL params (base64 encoded)
        saveMediaToURL();
        
        if (stories.length > 0) {
            currentIndex = 0;
            startPlayback();
        }
    }
    
    // Save mediaData array in URL parameters as JSON
    function saveMediaToURL() {
        try {
            const mediaJSON = encodeURIComponent(JSON.stringify(mediaData));
            const params = new URLSearchParams(window.location.search);
            params.set("media", mediaJSON);
            // window.history.replaceState(null, "", "?" + params.toString());
        } catch (err) {
            console.error("Error saving media to URL:", err);
        }
    }
    
    // Remove a media item from the manager and update playback
    function removeMedia(index) {
        stories.splice(index, 1);
        managerItems.splice(index, 1);
        mediaData.splice(index, 1);
        rebuildStories();
        rebuildManager();
        rebuildProgress();
        saveMediaToURL(); // update URL
        
        if (stories.length > 0) {
            if (currentIndex >= stories.length) currentIndex = 0;
            showStory(currentIndex);
        } else {
            clearInterval(interval);
            storyContainer.innerHTML = "";
            progressContainer.innerHTML = "";
            managerContainer.innerHTML = "";
        }
    }
    
    function rebuildStories() {
        storyContainer.innerHTML = "";
        stories.forEach(media => storyContainer.appendChild(media));
    }
    function rebuildManager() {
        managerContainer.innerHTML = "";
        managerItems.forEach((item, idx) => {
            item.onclick = () => {
                currentIndex = idx;
                showStory(currentIndex);
            };
            managerContainer.appendChild(item);
        });
    }
    function rebuildProgress() {
        progressContainer.innerHTML = "";
        stories.forEach(() => {
            const progressSegment = document.createElement("div");
            progressSegment.classList.add("progress-segment");
            const activeSegment = document.createElement("div");
            activeSegment.classList.add("active-segment");
            progressSegment.appendChild(activeSegment);
            progressContainer.appendChild(progressSegment);
        });
    }
    
    // Start playback of stories, and set the transitionDuration from video duration (capped at 90 sec)
    function startPlayback() {
        const activeStory = stories[currentIndex];
        if (activeStory.tagName === "VIDEO") {
            if (!activeStory.duration || isNaN(activeStory.duration)) {
                activeStory.addEventListener("loadedmetadata", function onLoaded() {
                    activeStory.removeEventListener("loadedmetadata", onLoaded);
                    transitionDuration = Math.min(
                        activeStory.duration * 1000,
                        document.getElementById('maxVidB').value * 1000
                    );
                    
                    showStory(currentIndex);
                });
            } else {
                transitionDuration = Math.min(activeStory.duration * 1000, 90000);
                showStory(currentIndex);
            }
        } else {
            transitionDuration = 5000;
            showStory(currentIndex);
        }
    }
    
    // Show a story at the given index and update progress bar animations
    function showStory(index) {
        // Pause and reset all videos
        stories.forEach((story, i) => {
            if (story.tagName === "VIDEO") {
                story.pause();
                story.currentTime = 0;
            }
            story.classList.toggle("active", i === index);
        });
        
        const activeStory = stories[index];
        if (activeStory.tagName === "VIDEO") {
            activeStory.currentTime = 0;
            activeStory.play();
            if (activeStory.duration && !isNaN(activeStory.duration)) {
                transitionDuration = Math.min(activeStory.duration * 1000, 90000);
            } else {
                transitionDuration = 7000;
            }
        } else {
            transitionDuration = 5000;
        }
        
        // Reset and animate progress bar for the active segment
        const activeSegments = progressContainer.querySelectorAll(".active-segment");
        activeSegments.forEach((bar) => {
            bar.style.transition = "none";
            bar.style.width = "0%";
        });
        void progressContainer.offsetWidth;
        if (activeSegments[index]) {
            activeSegments[index].style.transition = `width ${transitionDuration}ms linear`;
            activeSegments[index].style.width = "100%";
        }
        restartPlayback();
    }
    
    // Restart the auto-play interval
    function restartPlayback() {
        clearInterval(interval);
        interval = setInterval(() => nextStory(), transitionDuration);
    }
    
    function nextStory() {
        if (stories.length > 0) {
            currentIndex = (currentIndex + 1) % stories.length;
            if (currentIndex === 0) {
                // Reset progress bars when looping back
                const activeSegments = progressContainer.querySelectorAll(".active-segment");
                activeSegments.forEach(bar => {
                    bar.style.transition = "none";
                    bar.style.width = "0%";
                });
            }
            showStory(currentIndex);
        }
    }
    
    function pausePlayback() {
        clearInterval(interval);
        const activeStory = stories[currentIndex];
        if (activeStory && activeStory.tagName === "VIDEO") {
            activeStory.pause();
        }
    }
    
    function resumePlayback() {
        restartPlayback();
        const activeStory = stories[currentIndex];
        if (activeStory && activeStory.tagName === "VIDEO") {
            activeStory.play();
        }
    }
});

setInterval(loadStyle, 1000)
    
    function loadStyle() {
        document.querySelector('style').innerHTML = `
        .story-container {
            background: ${document.getElementById('bgColorB').value}
            }
            .progress-segment {
        background: ${document.getElementById('progressColorB').value}
    }
    .active-segment {
        background: ${document.getElementById('activeColorB').value}
    }
    `
}

// Fullscreen helper functions
function openFullscreen(element) {
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) { // Safari
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) { // IE11
        element.msRequestFullscreen();
    }
    element.classList.add('full-screen-mode');
}

function closeFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { // Safari
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { // IE11
        document.msExitFullscreen();
    }
}

const detailsElements = document.querySelectorAll("details");

  detailsElements.forEach((detail) => {
    // Listen for changes in the open attribute
    detail.addEventListener("toggle", () => {
      // When this detail opens, close all the others
      if (detail.open) {
        detailsElements.forEach((otherDetail) => {
          if (otherDetail !== detail && otherDetail.open) {
            otherDetail.removeAttribute("open");
          }
        });
      }
    });
});

function openDetail(element, query) {
    const detailsList = document.querySelectorAll(element);
    
    detailsList.forEach((one, index) => {
        one.open = index === query;
    });
}

function openNew() {
    var url = window.location.href
    console.log(`${url}?preview-only=true`)
    window.open(`${url}?preview-only=true`, '_blank')
}

// Example usage:
openVideo("https://www.example.com/video.mp4");