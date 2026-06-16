// Create the custom cursor element
const cursor = document.createElement("div");
cursor.style.position = "absolute";
cursor.style.width = "4rem"; // Adjust size
cursor.style.height = "4rem";
cursor.style.pointerEvents = "none"; // Prevent interaction
cursor.style.background = "url('image/cursor.png') no-repeat center";
cursor.style.backgroundSize = "contain"; // Ensure proper scaling
cursor.style.zIndex = "9999"; // Ensure it's always on top
cursor.style.transform = "translate(-50%, -50%)"; // Center alignment
document.body.appendChild(cursor);

// Move cursor with mouse
document.addEventListener("mousemove", (event) => {
  if (event.target.tag === 'A' || event.target.tag === 'BUTTON') {
    cursor.style.background = "blue";
  }
    cursor.style.left = `calc(${event.clientX}px + 10px)`;
    cursor.style.top = `calc(${event.clientY}px + 10px)`;
});


// Portal App Intergration
const dbName = 'myAppsDB';
const dbVersion = 1;

let db;

// Open or create the database
const openDatabase = () => {
    const request = indexedDB.open(dbName, dbVersion);
    request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        // Fallback to localStorage
        loadFromLocalStorage();
    };
    request.onsuccess = (event) => {
        db = event.target.result;
        console.log('IndexedDB opened successfully');
        updateAppList();
    };
    request.onupgradeneeded = (event) => {
        db = event.target.result;
        const objectStore = db.createObjectStore('apps', {
            keyPath: 'id'
        });
        objectStore.createIndex('name', 'name', {
            unique: false
        });
        objectStore.createIndex('developer', 'developer', {
            unique: false
        });
        objectStore.createIndex('description', 'description', {
            unique: false
        });
        objectStore.createIndex('url', 'url', {
            unique: true
        });
        objectStore.createIndex('appFor', 'appFor', {
            unique: true
        });
        objectStore.createIndex('logoName', 'logoName', {
            unique: false
        });
    };
};

openDatabase()

const updateAppList = () => {
    if (db) {
        const transaction = db.transaction(['apps'], 'readonly');
        const objectStore = transaction.objectStore('apps');
        const request = objectStore.getAll();
        request.onsuccess = (event) => {
            const apps = event.target.result;
            renderAppList(apps);
        };
    } else {
        // Fallback to localStorage
        loadFromLocalStorage();
    }
};


const renderAppList = (apps) => {
    const appList = document.getElementById('app-list');
    appList.innerHTML = '';
    apps.forEach(app => {
        var appElement = document.createElement('div');
        appElement.setAttribute('translate', 'no');
        appElement.classList.add('app')
        appElement.setAttribute('data-id', app.id);
        appElement.innerHTML += `
                            ${app.logoName}
                            <br>
                            <p class="name">${app.name}</p>`;
        appElement.addEventListener('click', function() {
            openPortalApp(app.id, app.url, app.name, app.logoName);
        })
        appList.appendChild(appElement);
    });
};

function openPortalApp(id, url, name, logoName) {
    openWindow(
        id,
        `<iframe src="${url}"></iframe>`,
        '80%',
        '80%',
        '--var(primary)',
        'transparent',
        name,
        'block',
        logoName
    );
}


// Settings
var settings = localStorage.getItem('OSsettings');

if (settings) {
    settings = JSON.parse(settings);
} else {
    settings = {};
}

var currentUser = localStorage.getItem('currentUser');
if (currentUser) {
    currentUser = JSON.parse(currentUser);
} else {
    currentUser = {};
}

setInterval(setUpNewTooltips, 1000)

document.addEventListener('DOMContentLoaded', loadSettings());

window.addEventListener('DOMContentLoaded', () => {
    setUpLockScreen();
    checkForUpdates();
    setUpNewTooltips();
});

function getDeviceType() {
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) {
        return 'Mobile';
    }
    if (/tablet/i.test(ua)) {
        return 'Tablet';
    }
    if (/iPad|Android|Touch/i.test(ua)) {
        return 'Tablet';
    }
    return 'Desktop';
}

var currentDevice = getDeviceType();
console.log(currentDevice);

document.getElementById('startMenuButton').addEventListener('click', function() {
    togglePopup('startMenu');
});

document.getElementById('closeStartMenu').addEventListener('click', function() {
    togglePopup('startMenu', true)
});

let windowCount = 0; // Counter for the number of windows
let headerCounter = {}; // Object to keep track of header name counts

function setUpUserContainer() {
    let userContainer = document.getElementById('account-container')

    userContainer.innerHTML = `
  <section>
    <h3>${currentUser['username']}</h3>
  </section>
  <section>
    <button class="tooltip-element" action="Account Dashboard" onclick="openAccountSwitcher()"><i class="fa-solid fa-table-columns"></i></button>
    <button class="tooltip-element" action="Switch Users" onclick="openAccountSwitcher()"><i class="fa-solid fa-users"></i></button>
    <button class="tooltip-element" action="Log Out ${currentUser['username']}" onclick="logOutUser()"><i class="fa-solid fa-right-from-bracket"></i></button>
  </section>
  `
}

function logOutUser() {
    if (confirm(`${currentUser['username']}, log out of Inspire and go to the lockscreen? You'll need to log in again through the account manager, but your profile is still there.`)) {
        document.getElementById('password-lock').value = '';
        sessionStorage.removeItem('osUnlocked')
        setUpLockScreen();
    }
}

function openAccountSwitcher() {
    openWindow('accSwitcher', `<h2>Switch Accounts</h2><p>You might have to reload when finished</p><iframe style="height: calc(96% - 100px)" src="../website/account/index.html"></iframe>`, '70%', "70%", 'var(--accent)', '', 'Switch Accounts', 'block', `<i class="fa-solid fa-users"></i>`)
}

function openWindow(baseId, content = '', width = '400px', height = '400px', headerBgColor = '#333', bodyBgColor = '#fff', headerName = '', resizeFullscreen = 'block', icon = `<i class="fa-solid fa-grip"></i>`) {
    windowCount++; // Increment the window counter
    let uniqueHeaderName = headerName;

    // Check if a window with the same headerName is already open
    const existingWindows = document.querySelectorAll('.window-header span');
    let isHeaderNameTaken = false;

    existingWindows.forEach(windowHeader => {
        if (windowHeader.textContent === headerName) {
            isHeaderNameTaken = true;
        }
    });

    if (isHeaderNameTaken) {
        // Increment the counter for the headerName
        if (headerCounter[headerName]) {
            headerCounter[headerName]++;
        } else {
            headerCounter[headerName] = 1;
        }
        uniqueHeaderName = `${headerName} ${headerCounter[headerName]}`;
    }

    const id = `${baseId}-${windowCount}`; // Create a unique ID by adding the counter to the baseId

    const windowsContainer = document.getElementById('windowsContainer');
    const newWindow = document.createElement('div');
    newWindow.classList.add('window', 'open');
    newWindow.setAttribute('id', id);
    newWindow.style.width = width;
    newWindow.style.height = height;
    newWindow.style.left = '100px'; // Default position
    newWindow.style.top = '100px'; // Default position
    if (resizeFullscreen == 'block') {
        if (settings['DblClickAction'] == 'fit') {
            newWindow.addEventListener('dblclick', function() {
                resizeWindow(id, 'fit');
            });
        } else if (settings['DblClickAction'] == 'maximize') {
            newWindow.addEventListener('dblclick', maximizeCurrentWindow);
        } else if (settings['DblClickAction'] == 'showActions') {
            newWindow.addEventListener('dblclick', function() {
                toggleResizePopup(id);
            });
        } else if (settings['DblClickAction'] == 'minimize') {
            newWindow.addEventListener('dblclick', minimizeCurrentWindow)
        } else if (settings['DblClickAction'] == 'close') {
            newWindow.addEventListener('dblclick', closeCurrentWindow)
        }
    }

    newWindow.dataset.maximized = 'false'; // Track maximized state
    newWindow.dataset.minimized = 'false'; // Track minimized state
    newWindow.dataset.originalWidth = width;
    newWindow.dataset.originalHeight = height;
    newWindow.dataset.originalLeft = '100px'; // Default position
    newWindow.dataset.originalTop = '100px'; // Default position
    newWindow.classList.add('active');

    // Add a header with controls
    const windowHeader = document.createElement('div');
    windowHeader.classList.add('window-header');
    windowHeader.style.backgroundColor = headerBgColor; // Set the background color of the header
    windowHeader.innerHTML = `
    <div class="window-controls">
      <button style="display: ${resizeFullscreen}" id="resizeWindow-${id}" onclick="toggleResizePopup('${id}')" class="tooltip-element" action="Resize"><span translate="no" class="material-symbols-rounded">resize</span></button>
      <button style="display: ${resizeFullscreen}" class="maximize-btn tooltip-element" action="Toggle Full Screen" onclick="toggleFullScreen('${id}')"><i class="fa-solid fa-maximize"></i></button>
      <button><span class="material-symbols-rounded" onclick="toggleMenu('${id}')">more_horiz</span></button>
      <button onclick="minimizeWindow('${id}', '${uniqueHeaderName}')" class="tooltip-element" action="Minimize"><i class="fa-solid fa-minus"></i></button>
      <button class="tooltip-element" action="Close" onclick="closeWindow('${id}')"><i class="fa-solid fa-xmark"></i></button>
    </div>
  `;
  newWindow.appendChild(windowHeader);

  // Make the window draggable
  makeDraggable(newWindow);

  // Add a body with content
  const windowBody = document.createElement('div');
  windowBody.classList.add('window-body');
  windowBody.style.backgroundColor = bodyBgColor; // Set the background color of the body
  windowBody.innerHTML = content; // Use innerHTML for content
  newWindow.appendChild(windowBody);
  if (resizeFullscreen == "none") {
    newWindow.style.resize = 'none';
  }

  windowsContainer.appendChild(newWindow);

  // Add resize options popup 
  const resizePopup = document.createElement('div'); 
  resizePopup.classList.add('resize-popup'); 
  resizePopup.setAttribute('id', `resizePopup-${id}`); 
  resizePopup.innerHTML = ` 
  <ul>
  <li onclick="resizeWindow('${id}', 'original')">Original</li>
  <li onclick="resizeWindow('${id}', 'fit')">Fit to Screen</li>
  <li onclick="resizeWindow('${id}', 'top-left')">Top Left</li> 
  <li onclick="resizeWindow('${id}', 'top-right')">Top Right</li> 
  <li onclick="resizeWindow('${id}', 'bottom-left')">Bottom Left</li> 
  <li onclick="resizeWindow('${id}', 'bottom-right')">Bottom Right</li> 
  <li onclick="resizeWindow('${id}', 'left')"><i class="fa-solid fa-arrow-left"></i> Left</li> 
  <li onclick="resizeWindow('${id}', 'right')"><i class="fa-solid fa-arrow-right"></i> Right</li> 
  <li onclick="resizeWindow('${id}', 'top')"><i class="fa-solid fa-arrow-up"></i> Top</li> 
  <li onclick="resizeWindow('${id}', 'bottom')"><i class="fa-solid fa-arrow-down"></i> Bottom</li> 
  </ul> `; 
  newWindow.appendChild(resizePopup);

    // Add resize options popup 
    const morePopup = document.createElement('div'); 
    morePopup.classList.add('more-popup'); 
    morePopup.setAttribute('id', `more-${id}`); 
    morePopup.innerHTML = ` 
    <ul>
    <li onclick="resizeWindow('${id}', 'original')">Original</li>
    <li onclick="resizeWindow('${id}', 'fit')">Fit to Screen</li>
    <li onclick="resizeWindow('${id}', 'top-left')">Top Left</li> 
    <li onclick="resizeWindow('${id}', 'top-right')">Top Right</li> 
    <li onclick="resizeWindow('${id}', 'bottom-left')">Bottom Left</li> 
    <li onclick="resizeWindow('${id}', 'bottom-right')">Bottom Right</li> 
    <li onclick="resizeWindow('${id}', 'left')"><i class="fa-solid fa-arrow-left"></i> Left</li> 
    <li onclick="resizeWindow('${id}', 'right')"><i class="fa-solid fa-arrow-right"></i> Right</li> 
    <li onclick="resizeWindow('${id}', 'top')"><i class="fa-solid fa-arrow-up"></i> Top</li> 
    <li onclick="resizeWindow('${id}', 'bottom')"><i class="fa-solid fa-arrow-down"></i> Bottom</li> 
    </ul> `; 
    newWindow.appendChild(morePopup);

  addAppToTaskbar(id, icon, headerName);

  // Remove the open class after the animation completes
  setTimeout(() => newWindow.classList.remove('open'), 300);

  // Add to start menu
  addStartMenuItem(id, uniqueHeaderName);

  setUpNewTooltips();

  if (document.getElementById('taskList')) {
    updateTaskManager();
  }
}

function addAppToTaskbar(id, icon, headerName) {
  var appSection = document.getElementById('open-apps');
  var appButton = document.createElement('button')

  appButton.setAttribute('id', `app-icon-${id}`);
  appButton.setAttribute('action', headerName);
  appButton.classList.add('tooltip-element')
  appButton.innerHTML = icon;
  appButton.addEventListener('click', function() {
    restoreWindow(id);
    setWindowActive(id);
  });
  appSection.appendChild(appButton);
}

function showError(title, message) {
  openWindow(`Error: ${title}`, `${message}<br><button onclick="closeWindow('Error: ${title}')">Close</button>`, 'fit-content', 'fit-content', 'orange', 'var(--primary)', title, 'none');
  document.getElementById('error-sound').currentTime = 0;
  document.getElementById('error-sound').play()
  console.log(`${title} occured in the OS with message: ${message}`);
}

function addStartMenuItem(id, headerName) {
  const minimizedSection = document.getElementById('openedAppsSection');
  const startMenuItem = document.createElement('li');
  startMenuItem.classList.add('start-menu-item');
  startMenuItem.setAttribute('id', `start-menu-item-${id}`);
  startMenuItem.textContent = headerName || `Window ${id}`;
  startMenuItem.addEventListener('click', () => {
    restoreWindow(id);
  });
  minimizedSection.appendChild(startMenuItem);
}

function restoreWindow(id) {
  const window = document.getElementById(id);
  if (window) {
    window.style.display = 'block';
    window.dataset.minimized = 'false';
  }
}


function toggleResizePopup(id) {
  const popup = document.getElementById(`resizePopup-${id}`);
  popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
}

function toggleMenu(id) {
  const popup = document.getElementById(`more-${id}`);
  popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
}

// Function to resize and move the window based on the selected option
function resizeWindow(id, position) {
  const window = document.getElementById(id);
  if (!window) return;

  const screenWidth = 100; // As percentages, use whole numbers
  const screenHeight = 100 - 5;

  let newWidth, newHeight, newLeft, newTop;

  window.style.transition = 'width 0.3s ease, height 0.3s ease, top 0.3s ease, left 0.3s ease';

  setTimeout(function() {
    window.style.transition = 'none';
  }, 300);

  switch (position) {
    case 'original':
      newWidth = window.dataset.originalWidth;
      newHeight = window.dataset.originalHeight;
      newLeft = window.dataset.originalLeft;
      newTop = window.dataset.originalTop;
      console.log(window.dataset.originalWidth)
      window.style.width = newWidth;
      window.style.height = newHeight;
      window.style.left = newLeft;
      window.style.top = newTop;
      break;
    case 'fit':
      newWidth = screenWidth;
      newHeight = screenHeight;
      newLeft = 0;
      newTop = 0;
      break;
    case 'top-left':
      newWidth = screenWidth / 2;
      newHeight = screenHeight / 2;
      newLeft = 0;
      newTop = 0;
      break;
    case 'top-right':
      newWidth = screenWidth / 2;
      newHeight = screenHeight / 2;
      newLeft = screenWidth / 2;
      newTop = 0;
      break;
    case 'bottom-left':
      newWidth = screenWidth / 2;
      newHeight = screenHeight / 2;
      newLeft = 0;
      newTop = screenHeight / 2;
      break;
    case 'bottom-right':
      newWidth = screenWidth / 2;
      newHeight = screenHeight / 2;
      newLeft = screenWidth / 2;
      newTop = screenHeight / 2;
      break;
    case 'left':
      newWidth = screenWidth / 2;
      newHeight = screenHeight;
      newLeft = 0;
      newTop = 0;
      break;
    case 'right':
      newWidth = screenWidth / 2;
      newHeight = screenHeight;
      newLeft = screenWidth / 2;
      newTop = 0;
      break;
    case 'top':
      newWidth = screenWidth;
      newHeight = screenHeight / 2;
      newLeft = 0;
      newTop = 0;
      break;
    case 'bottom':
      newWidth = screenWidth;
      newHeight = screenHeight / 2;
      newLeft = 0;
      newTop = screenHeight / 2;
      break;
    default:
      return;
  }

  // Ensure the window stays within screen bounds
  if (newLeft + newWidth > screenWidth) newLeft = 100 - newWidth;
  if (newTop + newHeight > screenHeight) newTop = 100 - newHeight;
  if (newLeft < 0) newLeft = 0;
  if (newTop < 0) newTop = 0;

  window.style.width = `${newWidth}%`;
  window.style.height = `${newHeight}%`;
  window.style.left = `${newLeft}%`;
  window.style.top = `${newTop}%`;

  // Hide the popup after resizing
  const popup = document.getElementById(`resizePopup-${id}`);
  if (popup) {
    popup.style.display = 'none';
  }
}


function closeWindow(id) {
  document.getElementById('taskbar').classList.remove('full-screen-window')
  const window = document.getElementById(id);
  window.classList.add('close');
  setTimeout(() => {
    window.parentNode.removeChild(window);
    // Clear app name if no windows are open
    const windowsContainer = document.getElementById('windowsContainer');
    if (windowsContainer.children.length === 0) {
      document.getElementById('appName').textContent = 'No App Open';
    }
  }, 300);
  document.getElementById('taskbar').classList.remove('hiding-taskbar');
  const startMenuItem = document.getElementById(`start-menu-item-${id}`);
  if (startMenuItem) {
    startMenuItem.remove();
  }
  const taskbarItem = document.getElementById(`app-icon-${id}`);

  if (taskbarItem) {
    taskbarItem.remove();
  }
  if (document.getElementById('taskList')) {
    updateTaskManager();
  }
}

function minimizeWindow(id, headerName) { 
  document.getElementById('taskbar').classList.remove('hiding-taskbar');
  const window = document.getElementById(id); 

  if (window.dataset.minimized === 'true') { 
    // Restore the window 
    window.style.display = 'block'; 
    window.dataset.minimized = 'false'; 
    document.getElementById('appName').textContent = headerName || `Window ${id}`; 
    const minimizedItem = document.getElementById(`minimized-${id}`); 
    if (minimizedItem) { 
      minimizedItem.remove();
    } 
  } else { 
    // Minimize the window 
    window.classList.add('minimize'); 
    setTimeout(() => { 
      window.style.display = 'none'; 
      window.dataset.minimized = 'true'; 
      window.classList.remove('minimize'); 

      // Check if the minimized item already exists
      if (!document.getElementById(`minimized-${id}`)) { 
        const minimizedItem = document.createElement('li'); 
        minimizedItem.textContent = headerName || `Window ${id}`; 
        minimizedItem.id = `minimized-${id}`; 
        minimizedItem.addEventListener('click', () => {
          minimizeWindow(id, headerName);
          minimizedItem.remove(); // Ensure the item is removed when restored
        }); 
        minimizedSection.appendChild(minimizedItem);
      }
    }, 300); 
  }
}

function toggleFullScreen(id) {
  const window = document.getElementById(id);
  const isMaximized = window.dataset.maximized === 'true';

  if (isMaximized) {
    // Restore to original size and position
    window.style.width = window.dataset.originalWidth;
    window.style.height = window.dataset.originalHeight;
    window.style.left = window.dataset.originalLeft;
    window.style.top = window.dataset.originalTop;
    window.dataset.draggable = false;
    window.classList.add('maximize');
    window.classList.remove('full-screen-window');
    window.querySelectorAll('.maximize-btn').forEach(button => {
      button.innerHTML = `<i class="fa-solid fa-maximize"></i>`
    });
    window.querySelectorAll('.window-header').forEach(header => {
      header.classList.remove('hiding-header');
    });
    document.getElementById(`resizeWindow-${id}`).style.display = 'block';
    setTimeout(() => window.classList.remove('maximize'), 300);
  } else {
    resizeWindow(id, 'original')
    // Save current size and position
    window.dataset.originalWidth = window.style.width;
    window.dataset.originalHeight = window.style.height;
    window.dataset.originalLeft = window.style.left;
    window.dataset.originalTop = window.style.top;
    window.dataset.draggable = true;

    // Maximize the window
    window.style.width = '100%';
    window.style.height = '100%';
    window.style.top = '0';
    window.style.left = '0';
    window.classList.add('maximize');
    window.classList.add('full-screen-window');
    window.querySelectorAll('.maximize-btn').forEach(button => {
      button.innerHTML = `<i class="fa-solid fa-minimize"></i>`
    });
    window.querySelectorAll('.window-header').forEach(header => {
      header.classList.add('hiding-header');
    });
    document.getElementById(`resizeWindow-${id}`).style.display = 'none';
    setTimeout(() => window.classList.remove('maximize'), 300);
  }

  window.dataset.maximized = !isMaximized; // Toggle maximized state

  var objectsinFull = document.querySelectorAll('.full-screen-window');
  console.log(objectsinFull.length);

  if (objectsinFull.length > 0) {
    taskbar.classList.add('hiding-taskbar');
  }
  else {
    taskbar.classList.remove('hiding-taskbar');
  }
}

function makeDraggable(element) {
  let isMouseDown = false;
  let offsetX, offsetY;

  const header = element.querySelector('.window-header');
  if (header) {
    header.addEventListener('mousedown', function(event) {
      isMouseDown = true;
      offsetX = event.clientX - element.getBoundingClientRect().left;
      offsetY = event.clientY - element.getBoundingClientRect().top;
    });

    document.addEventListener('mousemove', function(event) {
      if (element.dataset.maximized) {
        if (isMouseDown) {
        let newLeft = event.clientX - offsetX;
        let newTop = event.clientY - offsetY;

        // Constrain the left position within the screen boundaries
        if (newLeft < 0) newLeft = 0;
        if (newLeft + element.clientWidth > window.innerWidth) newLeft = window.innerWidth - element.clientWidth;

        // Constrain the top position within the screen boundaries
        if (newTop < 0) newTop = 0;
        if (newTop + header.clientHeight > window.innerHeight) newTop = window.innerHeight - header.clientHeight;

        element.style.left = `${newLeft}px`;
        element.style.top = `${newTop}px`;
      }
      }
    });

    document.addEventListener('mouseup', function() {
      isMouseDown = false;
    });
  }
}

// Function to update the current time in the toolbar
function updateCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  document.getElementById('currentTime').textContent = `${hours}:${minutes}:${seconds}`;
}

// Update the time every second
if (settings['showClock']) {
  setInterval(updateCurrentTime, 1000);
}

function toggleFullscreen() {
  const elem = document.documentElement;

  if (!document.fullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { // Firefox
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { // Chrome, Safari, and Opera
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { // Internet Explorer/Edge
      elem.msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) { // Firefox
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) { // Chrome, Safari, and Opera
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { // Internet Explorer/Edge
      document.msExitFullscreen();
    }
  }
}

var settings = localStorage.getItem('OSsettings');
if (settings) {
  settings = JSON.parse(settings);
} else {
  settings = {};
}
document.addEventListener("DOMContentLoaded", function() {
  document.getElementById('version').innerHTML = `Version ${settings['version'] || '1.0'}<br>Build: ${settings['buildNumber'] || '00001'}`;
  document.getElementById('theme').value = settings['theme'];
  document.getElementById('showClockSetting').checked = settings['showClock'];
  document.getElementById('dblWindowHead').value = settings['DblClickAction'];
  document.getElementById('buttonPos').value = settings['buttonPosition'];
  document.getElementById('titleCen').value = settings['titleCenter'];
  document.getElementById('tkr-align').value = settings['taskbarAlign'];
})

function updateSettings(element, setting) {
  let value = document.getElementById(element).value;

  settings[setting] = value;

  localStorage.setItem('OSsettings', JSON.stringify(settings));
  loadSettings();
}
function googleTranslateElementInit() {
new google.translate.TranslateElement({pageLanguage: 'en'}, 'google_translate_element');
}

function loadSettings() {
  var settings = localStorage.getItem('OSsettings');
  if (settings) {
      try {
          settings = JSON.parse(settings);
          console.log("Settings loaded:", settings);
      } catch (e) {
          console.error("Error parsing JSON from localStorage:", e);
          settings = {};
      }
  } else {
      settings = {};
  }
  var taskbar = document.getElementById('taskbar');
  if (settings['taskbarAlign']) {
    taskbar.style.justifyContent = settings['taskbarAlign'];
  }
  if (settings['theme']) {
    // Remove existing theme classes if any
    document.body.classList.remove('light', 'dark', 'custom-theme'); // Add your theme class names here
    // Add the new theme class
    document.body.classList.add(settings['theme']);
    console.log("Theme applied:", settings['theme']);
  } else {
    console.log("No theme setting found.");
  }
  if (!settings['showClock']) {
    document.getElementById('currentTime').style.display = 'none';
  } 
}

// Function to close the current window
function closeCurrentWindow() {
  const activeWindow = document.querySelector('.window.active');
  if (activeWindow) {
    closeWindow(activeWindow.id);
  } else {
    console.log('No active window to close');
  }
}

// Function to minimize the current window
function minimizeCurrentWindow() {
  const activeWindow = document.querySelector('.window.active');
  if (activeWindow) {
    const headerName = activeWindow.querySelector('.window-header span').textContent;
    minimizeWindow(activeWindow.id, headerName);
  } else {
    console.log('No active window to minimize');
  }
}

// Function to minimize the current window
function maximizeCurrentWindow() {
  const activeWindow = document.querySelector('.window.active');
  if (activeWindow) {
    const headerName = activeWindow.querySelector('.window-header span').textContent;
    toggleFullScreen(activeWindow.id, headerName);
  } else {
    console.log('No active window to minimize');
  }
}

function keyboardShortcuts() {
  openWindow('keyShortcuts', `
    <h1>Keyboard Shortcuts</h1>
    <table>
    <td>4</td>
    </table>
    `, '', '', 'gray', '#eee', 'Shortcuts', 'none')
}

document.addEventListener('click', function(event) {
  const windows = document.querySelectorAll('.window');
  windows.forEach(window => window.classList.remove('active'));

  const targetWindow = event.target.closest('.window');
  if (targetWindow) {
    targetWindow.classList.add('active');
  }
  document.getElementById('tooltip').style.display = 'none';
});

function setWindowActive(id) {
  const windows = document.querySelectorAll('.window');
  windows.forEach(window => window.classList.remove('active'));
  setTimeout(function() {
    document.getElementById(id).classList.add('active');
    console.log(id)
  }, 100)

  document.getElementById('tooltip').style.display = 'none';
}

document.addEventListener('keydown', function(event) {
  // Define your keyboard shortcuts
  const key = event.key;
  const ctrlKey = event.ctrlKey;
  const shiftKey = event.shiftKey;

  if (ctrlKey && key === 'n') { // Ctrl + N
    event.preventDefault()
    openWindow();
  } else if (ctrlKey && key === 'l') { // Alt + F
    event.preventDefault()
    toggleFullscreen();
  } else if (ctrlKey && key === 'w') { // Ctrl + W to close the current window
    event.preventDefault()
    closeCurrentWindow();
  } else if (ctrlKey && key === 'm') { // Ctrl + M to minimize the current window
    event.preventDefault()
    minimizeCurrentWindow();
  } else if (ctrlKey && key === 'f') {
    event.preventDefault()
    maximizeCurrentWindow()
  } else if (ctrlKey && key === 't') {
    event.preventDefault()
    taskbarToggle()
  }
});

function taskbarToggle() {
  if (document.getElementById('taskbar').classList.contains('hiding-taskbar')) {
    document.getElementById('taskbar').classList.remove('hiding-taskbar');
  } else {
    document.getElementById('taskbar').classList.add('hiding-taskbar');
  }
}

// Apps

// File App

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();

    // Handle different file types
    reader.onload = (e) => {
      const fileType = file.type;
      const fileContent = e.target.result;

      // Open a new window to display the file
      openFileDisplayWindow(file.name, fileType, fileContent);
    };

    // Read the file as text or data URL based on type
    if (file.type.startsWith('text/') || file.type === 'application/json') {
      reader.readAsText(file);
    } else if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      alert('Unsupported file type');
    }
  }
}

function openFileDisplayWindow(fileName, fileType, fileContent) {
  openWindow(fileName, `${getFileContentHTML(fileType, fileContent)}`, '600px', '400px', '#007bff', 'white')
  const displayWindow = document.createElement('div');
  displayWindow.classList.add('window');
  displayWindow.style.width = '600px';
  displayWindow.style.height = '400px';
  displayWindow.style.left = '200px';
  displayWindow.style.top = '100px';

  displayWindow.innerHTML = `
    <div class="window-header">
      <span>${fileName}</span>
      <div class="window-controls">
        <button onclick="closeWindow('${fileName.replace(/[^a-zA-Z0-9]/g, '')}')">X</button>
        <button onclick="minimizeWindow('${fileName.replace(/[^a-zA-Z0-9]/g, '')}', '${fileName}')">_</button>
        <button onclick="toggleFullScreen('${fileName.replace(/[^a-zA-Z0-9]/g, '')}')">⬜</button>
      </div>
    </div>
    <div class="window-body">
      ${getFileContentHTML(fileType, fileContent)}
    </div>
  `;

  displayWindow.setAttribute('id', fileName.replace(/[^a-zA-Z0-9]/g, ''));
  document.getElementById('windowsContainer').appendChild(displayWindow);
}

function getFileContentHTML(fileType, fileContent) {
  if (fileType.startsWith('text/') || fileType === 'application/json') {
    return `<pre>${fileContent}</pre>`;
  } else if (fileType.startsWith('image/')) {
    return `<img src="${fileContent}" style="width: 100%; height: 100%;">`;
  }
  return `<p>Unsupported file type</p>`;
}

document.addEventListener('DOMContentLoaded', function() {
  const contextMenu = document.getElementById('contextMenu');

  document.addEventListener('contextmenu', function(event) {
    event.preventDefault();
    const posX = event.clientX;
    const posY = event.clientY;
    contextMenu.style.top = `${posY}px`;
    contextMenu.style.left = `${posX}px`;
    contextMenu.style.display = 'block';
  });

  document.addEventListener('click', function() {
    contextMenu.style.display = 'none';
  });
});

function googleTranslateElementInit() {
  new google.translate.TranslateElement({pageLanguage: 'en'}, 'google_translate_element');
}

// Task Manager

function openTaskManager() {
  openWindow('taskManager', `<ul id="taskList"></ul><br><button onclick="refreshTashManager()">Refresh</button>`, '', '', 'var(--secondary)', 'var(--background)', 'Task Manager', 'none');
  updateTaskManager();
}

function updateTaskManager() {
  const taskList = document.getElementById('taskList');
  taskList.innerHTML = ''; // Clear the current list

  const windows = document.querySelectorAll('.window');

  windows.forEach(window => {
      const id = window.getAttribute('id');
      const headerName = window.querySelector('.window-header span').textContent;

      const listItem = document.createElement('li');
      listItem.textContent = headerName;

      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close';
      closeButton.addEventListener('click', () => closeWindow(id));

      listItem.appendChild(closeButton);
      taskList.appendChild(listItem);
  });
}

function refreshTaskManager() {
  updateTaskManager();
}

// Ensure task manager is updated when a window is opened or closed
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('taskList')) {
    updateTaskManager();
  }

  const observer = new MutationObserver(updateTaskManager);
  observer.observe(document.getElementById('windowsContainer'), { childList: true });
});

function setUpLockScreen() {
  document.getElementById('taskbar').style.display = 'none';
  document.getElementById('lockscreen').style.display = 'flex';
  if (!currentUser) {
    openAccountSwitcher()
  }
  if (sessionStorage.getItem('osUnlocked')) {
    document.getElementById('taskbar').style.display = 'flex';
    document.getElementById('password-lock').value = currentUser['password'];
    checkPassword();
  }

  document.getElementById('user-preview').innerHTML = `
  To continue, log in using the password of this user:
  <br>
  <img src="${currentUser['profileImage']}">Profile Image</img>
  <h3>
    ${currentUser['username']}
  </h3>
  <h4>${currentUser['userID']}</h4>
  `
}

function checkPassword() {
  if (document.getElementById('password-lock').value == currentUser['password']) {
    document.getElementById('password-lock').value = '';
    document.getElementById('lockscreen').style.display = 'none';
    document.getElementById('taskbar').style.display = 'flex';
    setUpUserContainer();
    sessionStorage.setItem('osUnlocked', true);
    addNotification('welcomeUser', `Welcome ${currentUser['username']}!`, 'Your logged in.', 'User Management');
  }
  else {
    showError('Password incorrect', 'Incorrect password for this user.')
  }
}

function togglePopup(elementId) {
  document.querySelectorAll('.popup').forEach(popup => {
      if (popup.id === elementId) {
          popup.classList.toggle('open'); // Toggles only the target popup
      } else {
          popup.classList.remove('open'); // Ensures other popups close
      }
  });
}

var notiCenter = document.getElementById('notificationCenter')

function addNotification(id, title, message, from = 'unknown', actions = '', actionName = '') {
  notiCenter.innerHTML = `
  ${notiCenter.innerHTML}
  <br>
  <div id="noti-${id}">
  <h2>${title}</h2>
  <p>${message}</p>
  <br>
  <button onclick="${actions}">${actionName}</button>
  <span>${from}</span>
  </div>
  <hr>
  `
  displayNotification(`<h2>${title}</h2><p>${message}</p><br><span>${from}</span`)
}

function showNotiPanel(show) {
  if (show) {
    togglePopup('notificationCenter')
  }
  else {
    togglePopup('notificationCenter', true)
  }
  setUpNewTooltips()
}


function displayNotification(message, timeout = 5000, backgroundColor = 'var(--primary)') {
  var container = document.getElementById('notification');

  togglePopup('notification', false);

  container.innerHTML = message;

  setTimeout(function() {
      container.innerHTML = '';
      togglePopup('notification');
  }, timeout)
  setUpNewTooltips()
}

let latestVersion = '3.066 Pre-Final Release 1/3';
let latestBuildNum = '623BDFR1.3';

function checkForUpdates() {
  let version = settings['version'];

  if (version != latestVersion) {
    console.log(`Update Avaiable. Version ${latestVersion} is ready and your running ${settings['version']}.`)
    addNotification('updateAvaiable', 'Update Avaiable', `The latest version (${latestVersion}) is avaiable to use. Your on ${version}.`, 'System Updates', 'startUpdate()', 'Update Now.')
  }
}

function startUpdate() {
  alert("Ready to Update now. Unsaved work won't be saved.")
  document.getElementById('updateScreen').style.display = 'flex';
  const intervalId = setInterval(function() {
    const progressElement = document.getElementById('updateProgress');
    progressElement.value = progressElement.value + 1;
    document.getElementById('updateProgressNum').innerText = progressElement.value;
    document.getElementById('tabTitle').innerText = `Updating OS: ${progressElement.value} / 100`;
    if (progressElement.value == 100) {
        clearInterval(intervalId);
        settings['version'] = latestVersion;
        settings['buildNumber'] = latestBuildNum;
        localStorage.setItem('OSsettings', JSON.stringify(settings));
        progressElement.value = 0;
        location.reload()
    }
}, 100);
}


navigator.getBattery().then(function(battery) {
  function updateBatteryIcon() {
      const batteryLevelElement = document.getElementById('batteryLevel');
      const batteryPercentage = document.getElementById('batteryPercentage')
      // const batteryStatusElement = document.getElementById('batteryStatus');

      const level = battery.level * 100;
      batteryLevelElement.style.width = level + '%';
      batteryPercentage.innerHTML = level + '%'
      // batteryStatusElement.innerText = `${level}%`;

      if (battery.charging) {
          batteryLevelElement.style.backgroundColor = 'cyan';
      } else if (level == 100) {
        batteryLevelElement.style.backgroundColor = 'white';
        addNotification('fullBattery', '🔋 Full Battery', 'You may want to disconnect the cable.', 'Battery', '', '')
      } else if (level > 50) {
        batteryLevelElement.style.backgroundColor = 'lime';
      }
       else if (level > 20) {
          batteryLevelElement.style.backgroundColor = 'yellow';
      }else {
          batteryLevelElement.style.backgroundColor = 'red';
          addNotification('lowBattery', ' 🪫 Low Battery', 'Charge your device.', 'Battery', '', '');
      }
      var batteryInfo = {
        'Charging': (battery.charging ? "Yes" : "No"),
        'Level': (battery.level * 100 + "%"),
        'Charging Time': battery.chargingTime + " seconds",
        'Discharging Time': battery.dischargingTime + " seconds"
      };

      document.getElementById('battery-status-container').setAttribute('action', `Current battery level: ${batteryInfo['Level']}`)

      document.getElementById('quickbar').innerHTML = `
      <button class="close tooltip-element" action="Close Panel" onclick="togglePopup('quickbar')"><i class="fa-solid fa-arrow-left"></i></button>
      <h1>Actions</h1>
      <button onclick="location.reload()">Reload</button>
      <button onclick="toggleFullscreen()">Full Screen</button>
      <button onclick="window.close()">Shut Down</button>
      <h1>Battery</h1>
      <p>Charging: ${batteryInfo['Charging']}</p>
      <p>Level: ${batteryInfo['Level']}</p>
      <p>Charging Time: ${batteryInfo['Charging Time']}</p>
      <p>Discharging: ${batteryInfo['Discharging Time']}</p>
      `
  }


  // Initial battery status
  updateBatteryIcon();

  // Listen for battery status changes
  battery.addEventListener('chargingchange', updateBatteryIcon);
  battery.addEventListener('levelchange', updateBatteryIcon);
});

// Tooltip

function setUpNewTooltips() {
  const buttons = document.querySelectorAll('*');
  const tooltip = document.getElementById('tooltip');
  let tooltipTimeout;
  let hideTooltipTimeout;

  buttons.forEach(button => {
      button.addEventListener('mouseover', function(event) {
          tooltipTimeout = setTimeout(() => {
              const customAttr = button.getAttribute('action');
              if (customAttr) {
                  tooltip.innerText = customAttr;
                  tooltip.style.display = 'block';
                  
                  // Calculate tooltip position
                  const tooltipHeight = tooltip.offsetHeight;
                  const tooltipWidth = tooltip.offsetWidth;
                  const spaceBelow = window.innerHeight - event.clientY;
                  const spaceRight = window.innerWidth - event.clientX;

                  if (spaceBelow < tooltipHeight + 10) {
                      // Not enough space below, position above the mouse
                      tooltip.style.top = (event.pageY - tooltipHeight - 10) + 'px';
                  } else {
                      // Position below the mouse
                      tooltip.style.top = (event.pageY + 10) + 'px';
                  }

                  if (spaceRight < tooltipWidth + 10) {
                      // Not enough space on the right, position to the left of the mouse
                      tooltip.style.left = (event.pageX - tooltipWidth - 10) + 'px';
                  } else {
                      // Position to the right of the mouse
                      tooltip.style.left = (event.pageX + 10) + 'px';
                  }

                  // Set timeout to hide tooltip after 3 seconds
                  hideTooltipTimeout = setTimeout(() => {
                      tooltip.style.display = 'none';
                  }, 4000); // 3-second delay
              }
          }, 200); // 1-second delay for initial display
      });

      button.addEventListener('mousemove', function(event) {
          if (tooltip.style.display === 'block') {
              const tooltipHeight = tooltip.offsetHeight;
              const tooltipWidth = tooltip.offsetWidth;
              const spaceBelow = window.innerHeight - event.clientY;
              const spaceRight = window.innerWidth - event.clientX;

              if (spaceBelow < tooltipHeight + 10) {
                  tooltip.style.top = (event.pageY - tooltipHeight - 10) + 'px';
              } else {
                  tooltip.style.top = (event.pageY + 10) + 'px';
              }

              if (spaceRight < tooltipWidth + 10) {
                  tooltip.style.left = (event.pageX - tooltipWidth - 10) + 'px';
              } else {
                  tooltip.style.left = (event.pageX + 10) + 'px';
              }
          }
      });

      button.addEventListener('mouseout', function() {
          clearTimeout(tooltipTimeout);
          clearTimeout(hideTooltipTimeout);
          tooltip.style.display = 'none';
      });
  });
};