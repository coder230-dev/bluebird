const useFS = 'showOpenFilePicker' in window;
let lastActiveTabID = null;
let entries = [];
const openTabsMap = new Map();
let saveIntervals = new Map();
const pulsewriteInfo = {
	'version': 'v2.3.0',
	'lastUpdated': '8/7/25',
	'buildNumber': 'a7F-9z_',
	'sessionNumber': genRandomId(10),
}

let settings
let beforeUnloadPrompt
let ids = []
let idsHiddenFromSidebar = []


setInterval(function() {
	loadStorage('pulsewriteSettings', { })
}, 1000)

window.addEventListener('keydown', e => {
    const isMac = navigator.userAgent.includes('Mac');
    const isShortcutPressed = isMac ? e.metaKey : e.ctrlKey;

    const tabIndex = parseInt(e.key, 10) - 1;
    const tabKeys = Array.from(openTabsMap.keys());
  
    if (isShortcutPressed && e.key === ',') {
      e.preventDefault();
        openMenu('settings')
    } else if (isShortcutPressed && e.key == 'o') {
        e.preventDefault()
        handleUploadFiles()
    } else if (isShortcutPressed && e.shiftKey && e.key == 'O') {
        e.preventDefault()
        handleUploadFolder()
    } else if (isShortcutPressed && e.key == '/') {
        e.preventDefault()
		openMenu('about')
	} else if (e.altKey && e.key == String(tabIndex)) { {
        e.preventDefault()
        alert('Clicked')
    }
        if (tabIndex < tabKeys.length) {
            const tabId = tabKeys[tabIndex];
            const { section } = openTabsMap.get(tabId);

            document.querySelectorAll('.editor-tab').forEach(s => s.style.display = 'none');
            document.querySelectorAll('.tab').forEach(s => s.classList.remove('active'));
            activateTab(tabId);
            section.style.display = 'block';
            section.__editor?.layout();
        }
        return;
    }
});

function loadStorage(name, fallback = null) {
    try {
        const raw = localStorage.getItem(name);
        return raw ? JSON.parse(raw) : fallback ?? { };
    } catch (e) {
        console.warn(`Failed to parse localStorage item "${name}":`, e);
        return fallback ?? { error: 'Invalid JSON format' };
    }
}

function saveSettings(key, name, value) {
    try {
        const data = loadStorage(key) || {};

        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
            throw new Error("Invalid settings object");
        }

        data[name] = value;
        localStorage.setItem(key, JSON.stringify(data));
        displayNotification("Settings Saved.", `<i class="fa-solid fa-gear"></i>`, 2000);
    } catch (e) {
        console.error("Save failed:", e);
        displayNotification(
            "Couldn't save your settings. Try again later or contact owner if this might be a mistake.",
            `<i class="fa-solid fa-circle-exclamation"></i>`
        );
    }
}

document.addEventListener('DOMContentLoaded', () => {
  preloader()
  const welcomeTabContent = document.createElement('div');
  welcomeTabContent.classList.add('welcome-page');
  welcomeTabContent.innerHTML = `
    <img src="https://bing.com/th/id/BCO.6355e1b5-cb70-4368-a053-5d43c3357421.png">
    <h1>Welcome to PulseWrite, Bluebirds Code Editor!</h1>
    <p>Edit your files, like any other code editor. Files can be saved after a set number of seconds, on text editor blur, CMD/CTRL + S (as always), and before closing (and as always). More updates, allowing this, coming soon.</p>
    <h3>Get Started</h3>
    <div style="display: flex; justify-content: center; gap: 10px;">
      <button id="uploadFilesBtn" onclick="handleUploadFiles()"><i class="fa-solid fa-file"></i> Upload File(s)</button>
      <p>or</p>
      <button id="uploadFolderBtn" onclick="handleUploadFolder()"><i class="fa-solid fa-folder"></i> Upload Folder</button>
    </div>
  `;
  if (navigator.userAgent.includes('Macintosh') || navigator.userAgent.includes('Mac OS X')) {
	document.getElementById('context-menu').classList.add('mac-action');
  }  
  openNewTab('Welcome Back!', `<i class="fa-solid fa-door-open"></i>`, welcomeTabContent, 'welcome-screen');
});

window.onload = () => {
  preloader(document.body, true)
}

function getLangFromName(filename) {
  let ext
  if (filename.split('.').pop().toLowerCase()) {
    ext = filename.split('.').pop().toLowerCase();
  } else {
    ext = filename
  }
  return {
    js: 'javascript',
    ts: 'typescript',
    html: 'html',
    css: 'css',
    json: 'json',
    md: 'markdown',
    txt: 'plaintext',
    py: 'python',
    cpp: 'cpp',
    java: 'java'
  }[ext] || 'plaintext';
}

function getIconFromExtension(filename) {
	if (typeof filename !== 'string') return `<i class="fa-solid fa-file"></i>`;
	
	const ext = filename.split('.').pop().toLowerCase();
  
	switch (ext) {
	  case 'js':    return `<i class="fa-brands fa-square-js"></i>`;
	  case 'html':  return `<i class="fa-brands fa-html5"></i>`;
	  case 'css':   return `<i class="fa-brands fa-css3-alt"></i>`;
	  case 'json':  return `<i class="fa-solid fa-arrow-right-to-bracket"></i>`;
	  case 'txt':   return `<i class="fa-solid fa-file-lines"></i>`;
	  case 'py':    return `<i class="fa-brands fa-python"></i>`;
	  case 'java':  return `<i class="fa-brands fa-java"></i>`;
	  default:      return `<i class="fa-solid fa-file"></i>`;
	}
  }
	

function makeId() {
	const genId = Date.now() + '-' + Math.random().toString(36).slice(2);
	if (ids.includes(genId)) {
	  return makeId();
	}
	return genId;
}  

function openNewTab(name, icon, contentNode, tabId) {
  const entry = entries.find(e => e.name === name);
  if (entry) entry.id = tabId;

  // 🧱 Create tab content
  const section = document.createElement('section');
  section.id = tabId;
  section.className = 'editor-tab';
  section.appendChild(contentNode);
  document.getElementById('main-content').appendChild(section);

  // 🖱️ Create tab button
  const btn = document.createElement('div');
  btn.id = `${tabId}-nav`;
  btn.className = 'tab';
  btn.draggable = true;
  btn.innerHTML = `${icon} <span>${name}</span><span class="close">×</span>`;
  btn.style.cssText = 'display:inline-block;cursor:pointer;user-select:none';

  // 🧩 Context menu
  btn.addEventListener('contextmenu', e => {
    e.preventDefault();
    setUpAndOpenContextMenu('tab-menu', e.target, { btn, section, openTabsMap, tabId });
  });

  // ✨ Activate tab on click
  btn.addEventListener('click', () => {
    activateTab(tabId)
    section.__editor?.layout();
  });

  btn.querySelector('.close').addEventListener('click', () => {
	closeTab(tabId);
  });  

  // 🔄 Drag-n-drop tab reordering
  btn.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', btn.id);
    btn.classList.add('dragging');
  });
  btn.addEventListener('dragend', () => btn.classList.remove('dragging'));

  btn.addEventListener('dragover', e => {
    e.preventDefault();
    btn.classList.add('drag-over');
  });
  btn.addEventListener('dragleave', () => btn.classList.remove('drag-over'));

  btn.addEventListener('drop', e => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    const dragged = document.getElementById(draggedId);
    document.getElementById('navbar').insertBefore(dragged, btn.nextSibling);
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('drag-over'));
  });

  document.getElementById('navbar').appendChild(btn);
  btn.click();

  return { section, btn, id: tabId };
}


function activateTab(tabID) {
	document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
	document.querySelectorAll('.editor-tab').forEach(t => t.style.display = 'none');
  
	const tabButton = document.getElementById(tabID + '-nav');
	const tabContent = document.getElementById(tabID);
  
	if (tabButton && tabContent) {
	  tabButton.classList.add('active');
	  tabContent.style.display = 'block';
	  const label = tabButton.querySelector('span')?.innerHTML || tabID;
	  document.title = `${label} - PulseWrite`;
	  
	  lastActiveTabID = tabID;
	}
  }  

function closeTab(tabId, userCEditor) {
	const tabButton = document.getElementById(`${tabId}-nav`);
	const tabContent = document.getElementById(tabId);
  
	// Dispose editor if present
	const editor = tabContent?.__editor;
	if (editor) {
	  editor.dispose();
	} else {
        console.log('No Editor Found')
    }
  
	// Remove from openTabsMap
	if (openTabsMap.has(tabId)) {
	  openTabsMap.delete(tabId);
	}
  
	// Clear autosave interval
	if (saveIntervals.has(tabId)) {
	  clearInterval(saveIntervals.get(tabId));
	  saveIntervals.delete(tabId);
	}
  
	// Remove tab button and content
	tabButton?.remove();
	tabContent?.remove();
  
  
	// Activate fallback tab or show empty screen
	const remainingTabs = Array.from(document.querySelectorAll('.editor-tab'));
	if (remainingTabs.length) {
	  const fallbackTabId = remainingTabs[0].id;
	  activateTab(fallbackTabId);
	} else {
	  lastActiveTabID = null;
	  const welcomeTabContent = document.createElement('div');
  	welcomeTabContent.classList.add('welcome-page');
  	welcomeTabContent.innerHTML = `
    	<img src="https://bing.com/th/id/BCO.6355e1b5-cb70-4368-a053-5d43c3357421.png">
    	<h1>Welcome to PulseWrite, Bluebirds Code Editor!</h1>
    	<p>Edit your files, like any other code editor. Files can be saved after a set number of seconds, on text editor blur, CMD/CTRL + S (as always), and before closing (and as always). More updates, allowing this, coming soon.</p>
    	<h3>Get Started</h3>
    	<div style="display: flex; justify-content: center; gap: 10px;">
      		<button id="uploadFilesBtn" onclick="handleUploadFiles()"><i class="fa-solid fa-file"></i> Upload File(s)</button>
      		<p>or</p>
      		<button id="uploadFolderBtn" onclick="handleUploadFolder()"><i class="fa-solid fa-folder"></i> Upload Folder</button>
    	</div>
  		`;
  		if (navigator.userAgent.includes('Macintosh') || navigator.userAgent.includes('Mac OS X')) {
			document.getElementById('context-menu').classList.add('mac-action');
  		}  
  		openNewTab('Start a New Project!', `<i class="fa-solid fa-door-open"></i>`, welcomeTabContent, 'welcome-screen');
	}
}  

async function openFile(name, handle, pulseWriteFileID, openIn, language = getLangFromName(name) || 'plaintext') {
  const tabId = `tab-${pulseWriteFileID}`;

  // 🧭 Reuse tab if already open
  if (openTabsMap.has(tabId)) {
    const { section, btn } = openTabsMap.get(tabId);
    document.querySelectorAll('.editor-tab').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.tab').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    btn.dataset.tab = 'tab-' + pulseWriteFileID
    section.style.display = 'block';
    section.__editor?.layout();
    return;
  }
  // 🧱 Create editor container
  const editorDiv = document.createElement('div');
  editorDiv.style.width = '100%';
  editorDiv.style.height = 'calc(100vh - 120px)';

  const { section, btn } = openNewTab(
    name,
    getIconFromExtension(name),
    editorDiv,
    tabId
  );

  const topBar = document.createElement('div');
  topBar.classList.add('editor-topbar')
  topBar.innerHTML = `
      <span>
      </span>
      <span>
        <button data-action="find"><i class="fa-solid fa-magnifying-glass"></i></button>
        <button data-action="save"><i class="fa-solid fa-floppy-disk"></i></button>
        <button onclick="setUpAndOpenContextMenu('editor-more-menu', this)" data-action="more"><i class="fa-solid fa-bars"></i></button>
      </span>
        `
  section.insertBefore(topBar, section.firstChild);


  openTabsMap.set(tabId, { section, btn, pulseWriteFileID });

  // 🧠 Load Monaco
  require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs' } });
  require(['vs/editor/editor.main'], async () => {
    try {
      const settings = loadStorage('pulsewriteSettings', { vsColorTheme: 'vs-dark' });
      monaco.editor.setTheme(settings.vsColorTheme);

      const file = await handle.getFile();
      const content = await file.text();
      const uri = monaco.Uri.file(`/pulsewrite/${name}`);

      let model = monaco.editor.getModel(uri);
      if (!model) {
        model = monaco.editor.createModel(content, language, uri);
      } else {
        model.setValue(content);
        monaco.editor.setModelLanguage(model, language);
      }

      const editor = monaco.editor.create(editorDiv, {
        model,
        automaticLayout: true,
        minimap: { enabled: true },
        quickSuggestions: true,
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        suggestSelection: 'first',
        wordBasedSuggestions: true,
        snippetSuggestions: 'inline',
        parameterHints: { enabled: true },
        matchBrackets: 'always',
        wordWrap: settings.editorTextWrap,
        folding: true,
        fixedOverflowWidgets: true
      });

      section.__editor = editor;
      section.__fileContent = () => editor.getValue();
      section.__saveHandle = handle;
      section.__isDirty = false;

      const entry = entries.find(e => e.handle === handle && e.name === name);
      if (entry) {
        entry.__fileContent = section.__fileContent;
        entry.path = handle?.path || name;
        entry.folderPath = getFolderPathFromParts(entry.parts);
        saveFile(entry);				
        
      const searchBtn = topBar.querySelector('[data-action="find"]');
          searchBtn.addEventListener('click', () => {
          editor.getAction('actions.find').run();
      });

      const saveBtn = topBar.querySelector('[data-action="save"]')
      saveBtn.addEventListener('click', () => {
        downloadFile(entry)
        section.__isDirty = false;
        const icon = btn.querySelector('.need-save');
        if (icon) icon.remove();
      })

        // ⌨️ Keyboard shortcuts
        function handleKeyboardShortcuts(event) {
          const isMac = navigator.userAgent.includes('Mac');
          const isShortcutPressed = isMac ? event.metaKey : event.ctrlKey;

          if (isShortcutPressed && event.key === 's') {
            event.preventDefault();
            downloadFile(entry);
            section.__isDirty = false;

            const icon = btn.querySelector('.need-save');
            if (icon) icon.remove();
          } else if (isShortcutPressed && event.altKey && event.key === 's') {
            event.preventDefault();
            downloadFile(entry);
            const icon = btn.querySelector('.need-save');
            if (icon) icon.remove();
            section.__isDirty = false;
          } else if (event.altKey && event.code === 'Space') {
            event.preventDefault();
            editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
          }
        }

        window.addEventListener('keydown', handleKeyboardShortcuts);
        editor.onDidDispose(() => window.removeEventListener('keydown', handleKeyboardShortcuts));
        editor.onDidBlurEditorWidget(() => editor.focus());

        // 🧠 Dirty state detection
        editor.onDidChangeModelContent(() => {
          if (!section.__isDirty) {
            section.__isDirty = true;

            if (!btn.querySelector('.need-save')) {
              const needSaveIcon = document.createElement('span');
              needSaveIcon.classList.add('need-save');
              needSaveIcon.innerHTML = `<i class="fas fa-save"></i>`;
              needSaveIcon.title = 'File Needs Saving';
              btn.appendChild(needSaveIcon);
            }
          }
        });
      }

      console.log('Opening tabId:', tabId);
      console.log('Existing tabs:', [...openTabsMap.keys()]);
    } catch (err) {
      console.error('Failed to initialize Monaco editor:', err);
    }
  });
}

function saveFile(entry) {
  if (!useFS) {
    fallbackSaveFile(entry);
    return;
  }
  if (saveIntervals.has(entry.id)) return;

  const intervalID = setInterval(() => {
    (async () => {
      try {
        await saveViaFS(entry);
      } catch {
        fallbackSaveFile(entry);
      }
    })();
  }, 5000);

  saveIntervals.set(entry.id, intervalID);
  console.log('Saved.')
  
  clearInterval(intervalID)
}

function extractFolder(fullPath) {
	if (!fullPath) return '';
	const parts = fullPath.split('/');
	parts.pop();
	return parts.join('/');
  }

  function getFolderPathFromParts(parts) {
	if (!Array.isArray(parts) || parts.length < 2) return '';
	return parts.slice(0, -1).join('/');
  }
  

async function saveViaFS(entry) {
	console.log(entry);
  const writable = await entry.handle.createWritable();
  await writable.write(entry.__fileContent());
  await writable.close();
  displayNotification(
    `${entry.name} has been saved.`,
    `<i class="fa-solid fa-download"></i>`,
    5000, 
    2
  );
}

function fallbackSaveFile(entry) {
  displayNotification(
    `Choose where to save ${entry.name}`,
    `<i class="fa-solid fa-hard-drive"></i>`
  );
  const input = document.createElement('input');
  input.type = 'file';
  input.title = `Replace: ${entry.name}`;
  input.onchange = () => {
    const target = input.files[0];
    const blob = new Blob(
      [entry.__fileContent?.() || ''],
      { type: 'text/plain' }
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = target.name;
    a.click();
  };
  input.click();
}

function saveAllTabs() {
  try {
    let savedCount = 0;

    for (const entry of entries) {
      const section = entry.section || openTabsMap.get(`tab-${entry.pulseWriteFileID}`)?.section;

      if (!section || typeof section.__editor?.getValue !== 'function') {
        continue; // Skip if no editor is attached
      }

      if (section.__isDirty) {
        entry.__fileContent = section.__fileContent;
        saveFile(entry);
        section.__isDirty = false;

        const icon = document.querySelector(`.tab .need-save`);
        if (icon) icon.remove();

        savedCount++;
      }
    }

    if (savedCount > 0) {
      displayNotification(`${savedCount} file(s) saved successfully.`);
    }
  } catch (e) {
    displayNotification('Error while saving files. See console for details.');
    console.error('saveAllTabs error:', e);
  }
} 

function downloadFile(entry) {
  if (useFS && entry.handle) {
    return saveViaFS(entry);
  } else {
    return fallbackSaveFile(entry);
  }
}

async function downloadZip() {
  const zip = new JSZip();
  entries.forEach(e => {
    const path = e.parts.join('/');
    zip.file(path, e.__fileContent?.() || '');
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'pulsewrite.zip';
  a.click();
}

async function handleUploadFiles() {
	preloader(document.getElementById('sidebar'))
    try {
        return useFS ? uploadFiles() : fallbackUploadFiles();
    } catch (e) {
        displayNotification("Couldn't open prompt. Full log in console.")
    }
}

async function handleUploadFolder() {
    try {
        return useFS ? uploadFolder() : fallbackUploadFolder();
    } catch (e) {
        displayNotification("Couldn't open prompt. Full log in console.")
    }
}

async function uploadFiles() {
	preloader(document.getElementById('sidebar'))
  if (!window.showOpenFilePicker) { preloader(document.getElementById('sidebar'), true); return alert('No File API'); }
  try {
	  const handles = await showOpenFilePicker({ multiple: true });
	  const batch = await Promise.all(handles.map(async h => {
		  const file = await h.getFile();
		  return {
			  id: makeId(),
			  handle: h,
			  name: file.name,
			  parts: [file.name],
			  file,
			  __fileContent: () => file.text()
			};
		}));
		entries.push(...batch);
		buildSidebar();
	} catch (e) {
		preloader(document.getElementById('sidebar'), true)
		displayNotification("Couldn't Upload File(s). Try again later.", `<i class="fa-solid fa-file-circle-xmark"></i>`)
	}
}

async function uploadFolder() {
	preloader(document.getElementById('sidebar'));
	const batch = [];
  
	function makeId() {
	  return Math.random().toString(36).substr(2, 9);
	}
  
	function normalizeParts(parts) {
	  return parts.join('/').replace(/\\/g, '/');
	}
  
	// Modern browser API
	if (window.showDirectoryPicker) {
	  try {
		const root = await showDirectoryPicker();
  
		async function walk(dir, path = []) {
		  for await (const [name, child] of dir) {
			if (child.kind === 'file') {
			  const file = await child.getFile();
			  batch.push({
				id: makeId(),
				handle: child,
				name: file.name,
				parts: [...path, file.name],
				file,
				__fileContent: () => file.text()
			  });
			} else {
			  await walk(child, [...path, child.name]);
			}
		  }
		}
  
		await walk(root, [root.name]);
	  } catch (err) {
		console.error('Directory picker failed:', err);
		displayNotification('Failed to open folder. Try again later.', `<i class="fa-solid fa-folder-closed"></i>`);
		preloader(document.getElementById('sidebar'), true);
		return;
	  }
	} else {
	  // Electron fallback
	  const { dialog } = require('electron').remote || require('@electron/remote');
	  const fs = require('fs');
	  const path = require('path');
  
	  const result = await dialog.showOpenDialog({
		properties: ['openDirectory']
	  });
  
	  if (result.canceled || !result.filePaths.length) {
		alert('No folder selected.');
		return;
	  }
  
	  const folderPath = result.filePaths[0];
  
	  function walkLocal(dirPath, pathParts = []) {
		const entriesInDir = fs.readdirSync(dirPath, { withFileTypes: true });
		for (const entry of entriesInDir) {
		  const fullPath = path.join(dirPath, entry.name);
		  if (entry.isFile()) {
			const fileContent = fs.readFileSync(fullPath, 'utf-8');
			batch.push({
			  id: makeId(),
			  name: entry.name,
			  parts: [...pathParts, entry.name],
			  file: {
				name: entry.name,
				path: fullPath,
				text: () => Promise.resolve(fileContent)
			  },
			  __fileContent: () => Promise.resolve(fileContent)
			});
		  } else if (entry.isDirectory()) {
			walkLocal(fullPath, [...pathParts, entry.name]);
		  }
		}
	  }
  
	  walkLocal(folderPath, [path.basename(folderPath)]);
	}
  
	// 🔍 Prevent duplicate folder upload
	const folderName = batch[0]?.parts[0];
	const folderAlreadyExists = entries.some(e => e.parts[0] === folderName);
  
	if (folderAlreadyExists) {
	  displayNotification(`Folder "${folderName}" already uploaded. Check your hidden list. If not, reload or open a new window.`, `<i class="fa-solid fa-folder-open"></i>`);
	  preloader(document.getElementById('sidebar'), true);
	  return;
	}
  
	// 🧹 Deduplicate files by normalized path
	const existingPaths = new Set(entries.map(e => normalizeParts(e.parts)));
	const dedupedBatch = batch.filter(e => {
	  const path = normalizeParts(e.parts);
	  return !existingPaths.has(path);
	});
  
	entries.push(...dedupedBatch);
	buildSidebar();
  }  

function fallbackUploadFiles() {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async () => {
      const newEntries = Array.from(input.files).map(file => ({
        id: makeId(),
        name: file.name,
        parts: [file.name],
        file,
        __fileContent: () => file.text()
      }));
      entries.push(...newEntries);
      buildSidebar();
      resolve(newEntries);
    };
    input.click();
  });
}

function fallbackUploadFolder() {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.multiple = true;

    input.onchange = async () => {
      const newEntries = Array.from(input.files).map(file => {
        const parts = file.webkitRelativePath.split('/');
        return {
          id: makeId(),
          name: file.name,
          parts,
          file,
          mime: file.type,
          __fileContent: () => file.text()
        };
      });

      entries.push(...newEntries);
      buildSidebar();
      resolve(newEntries);
    };

    input.click();
  });
}

function buildSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = '';
  sidebar.innerHTML = `
  <div class="sidebar-nav">
		<button onclick="setUpAndOpenContextMenu('add-items', this)">+</button>
		<button onclick="setUpAndOpenContextMenu('more-sidebar-items', this)"><i class="fa-solid fa-bars"></i></button>
	</div>`

  sidebar.addEventListener('dragover', e => e.preventDefault());
  sidebar.addEventListener('drop', e => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (data.type === 'file') {
      const entry = entries.find(x => x.id === data.id);
      entry.parts = [entry.name];
    } else if (data.type === 'folder') {
      const oldPath = data.path.split('/');
      entries.forEach(x => {
        if (x.parts.slice(0, oldPath.length).join('/') === data.path) {
          x.parts = [x.name];
        }
      });
    }
    buildSidebar();
  });

  // Build nested tree
  const tree = {};
  for (const entry of entries) {
    let node = tree;
    for (let i = 0; i < entry.parts.length; i++) {
      const part = entry.parts[i];
      if (i === entry.parts.length - 1) {
        (node._files ||= []).push(entry);
      } else {
        node[part] ||= {};
        node = node[part];
      }
    }
  }

  function render(node, container, path = []) {
    // Files
    for (const file of node._files || []) {
		const folderName = path[path.length - 1] || '/';
		const el = document.createElement('div');
		el.classList.add('file-in-sidebar');
		el.id = file.id;
		const icon = getIconFromExtension(file.name);
		el.innerHTML = `${icon} ${file.name}`;	  

      el.draggable = true;

      el.addEventListener('click', async () => {
        openFile(file.name, file.handle, `${folderName}-${file.name} `);
      });

      el.addEventListener('contextmenu', function(event) {
        event.preventDefault()
		var fileHandle = file.handle
        setUpAndOpenContextMenu('file', el, { file, folderName, fileHandle, el })
      })

      el.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'file', id: file.id }));
      });

      container.appendChild(el);
    }

    // Folders
    for (const folder of Object.keys(node).filter(k => k !== '_files').sort()) {
	const pulid = makeId()
      const header = document.createElement('div');
	  header.classList.add('folder-in-sidebar')
	  header.id = `${folder}-${randomId}`
      header.innerHTML = '📁 ' + folder + `<i class="material-symbols-rounded">arrow_right</i>`;
      header.style.fontWeight = 'bold';

      var randomId = Math.floor(Math.random() * 10000)
      const subContainer = document.createElement('div');
	  subContainer.classList.add('sub-container');
		subContainer.id = `${folder}-${randomId}`
      subContainer.style.display = 'none';
      subContainer.style.paddingLeft = '12px';

      header.addEventListener('click', () => {
        subContainer.style.display =
          subContainer.style.display === 'none' ? 'block' : 'none';
		  if (header.classList.contains('open')) {
			header.classList.remove('open')
		  } else {
			header.classList.add('open')
		  }
      });
	  header.addEventListener('contextmenu', (e) => {
		e.preventDefault()
		setUpAndOpenContextMenu('folder-sidebar', header, { header })
	  })

      header.draggable = true;
      header.addEventListener('dragstart', e => {
        e.dataTransfer.setData(
          'text/plain',
          JSON.stringify({ type: 'folder', path: [...path, folder].join('/') })
        );
      });
      header.addEventListener('dragover', e => e.preventDefault());
      header.addEventListener('drop', e => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        if (data.type === 'file') {
          const entry = entries.find(x => x.id === data.id);
          entry.parts = [...path, folder, entry.name];
        } else if (data.type === 'folder') {
          const oldPath = data.path.split('/');
          const newPath = [...path, folder, oldPath.at(-1)];
          entries.forEach(x => {
            if (x.parts.slice(0, oldPath.length).join('/') === data.path) {
              x.parts = [...newPath, ...x.parts.slice(oldPath.length)];
            }
          });
        }
        buildSidebar();
      });

      container.appendChild(header);
      container.appendChild(subContainer);
      render(node[folder], subContainer, [...path, folder]);
    }
  }

  render(tree, sidebar);
  displayNotification('Loaded Files', `<i class="fa-solid fa-file-circle-check"></i>`, 5000, 10, true);
}

function hideFromSidebar(id) {
	const elements = document.querySelectorAll('#' + id);
	elements.forEach(el => el.classList.add('hidden-from-sidebar'));
	idsHiddenFromSidebar.push(id)
  
	displayNotification(`Removed from Sidebar.`, `<i class="fa-solid fa-square-minus"></i>`);
  }  

const notificationQueue = [];
let isDisplaying = false;
let currentTimeout = ''

function displayNotification(message, icon = '', timeout = 5000, priority = 1) {
  const newNote = { message, icon, timeout, priority };
  notificationQueue.push(newNote);
  processQueue();
}

function processQueue() {
  if (isDisplaying || notificationQueue.length === 0) return;

  const next = notificationQueue.shift();
  const { message, icon, timeout } = next;

  const notification = document.getElementById('notification');
  notification.innerHTML = icon + message;
  notification.style.transform = 'translate(-50%, -10px)';
  notification.style.transition = 'transform 0.3s';

  isDisplaying = true;

  currentTimeout = setTimeout(() => {
    notification.style.transform = 'translate(-50%, 100%)';
    setTimeout(() => {
      isDisplaying = false;
      processQueue();
    }, 300);
  }, timeout);
}

function preloader(element = document.body, remove = false) {
	const existing = element.querySelector('.preloader');
  
	if (remove) {
	  if (existing) existing.remove();
	  return;
	}
  
	if (existing) return;
  
	const newPreloader = document.createElement('div');
	newPreloader.classList.add('preloader');
	newPreloader.innerHTML = `
	<div>
	  <svg viewBox="25 25 50 50" class="spinner">
		<circle r="20" cy="50" cx="50"></circle>
	  </svg>
	</div>
	`;
	element.appendChild(newPreloader);
}  

  function showNoTabScreen() {
    const welcome = document.createElement('div');
    welcome.className = 'welcome-page';
    welcome.innerHTML = `
      <h1>👋 Need to Upload Another File?</h1>
      <p>Edit code, preview outputs, upload files, or open folders.</p>
      <button onclick="handleUploadFiles()">Upload File</button>
      <button onclick="handleUploadFolder()">Upload Folder</button>
    `;
    document.getElementById('main-content').appendChild(welcome);
  }
  
  function updatePreview(folderPath) {
	// Use fetch to get files from the folder
	Promise.all([
	  fetch(`${folderPath}/index.html`).then(res => res.text()),
	  fetch(`${folderPath}/style.css`).then(res => res.ok ? res.text() : ''),
	  fetch(`${folderPath}/script.js`).then(res => res.ok ? res.text() : '')
	]).then(([html, css, js]) => {
	  const previewContent = `
		<!DOCTYPE html>
		<html>
		  <head><style>${css}</style></head>
		  <body>
			${html}
			<script>${js}<\/script>
		  </body>
		</html>
	  `;
	  const frame = document.getElementById('preview-frame');
	  if (frame) frame.srcdoc = previewContent;
	}).catch(err => console.error('Preview error:', err));
  }
  
function setUpAndOpenContextMenu(type, elementClicked, passThru = undefined) {
  const contextMenu = document.getElementById('context-menu');
  let content

  if (type === 'file-menu' || !type) {
    content = `
      <ul class="ul-opt">
	  	<li class="cMB" onclick="window.open(window.location.href, '', 'width=600,height=600,left=200,top=200')">New Window</li>
		<br>
        <li class="cMB" onclick="handleUploadFiles()">Upload Files...</li>
        <li class="cMB" onclick="handleUploadFolder()">Upload Folder...</li>
        <br>
        <li class="cMB" onclick="openMenu('settings')">Settings</li>
        <li class="cMB" onclick="openMenu('about')">About PulseWrite</li>
        <br>
        <li class="cMB" onclick="if (confirm('Reload and Reset the Editor?')) { location.reload() }">Reset Editor</li>
      </ul>
    `;
  } else if (type == 'tab-menu') {
    content = `
    <ul class="ul-opt">
        <li class="cMB" onclick="activateTab('${passThru?.tabId}')">Open Tab</li>
        <li class="cMB" onclick="closeTab('${passThru?.tabId}')">Close Tab</li>
    </ul>
    `
  } else if (type == 'file') {
    content = `
	<ul class="ul-opt">
  		<li class="cMB open-file-btn">Open File</li>
  		<li class="cMB open-file-btn-in-new-tab">Open in New Tab</li>
		  <li class="cMB" onclick="hideFromSidebar('${passThru?.el.id}')">Hide Folder from Editor</li>
  		<br>
	</ul>
	`;
  } else if (type == 'folder-sidebar') {
	content = `
	<ul class="ul-opt">
		<li class="cMB" onclick="hideFromSidebar('${passThru?.tabID}')">Hide Folder from Editor</li>
	</ul>
	`
  } else if (type == 'add-items') {
	content = `
	<ul class="ul-opt">
		<li class="cMB" onclick="handleUploadFiles()">Upload Files...</li>
		<li class="cMB" onclick="handleUploadFolder()">Upload Folder...</li>
	</ul>`
  } else if (type == 'more-sidebar-items') {
    content = `
    <ul class="ul-opt">
		  <li class="cMB" onclick="if (confirm('Heads up! If you restore all files to regular state, you will not be able to hide the files you hidden before this. Continue?')) { buildSidebar() }">Show All Files</li>
      <li class="cMB" onclick="openMenu('settings', 'editor')">Open Editor Settings</li>
	  </ul>
    `
  } else if (type == 'editor-more-menu') {
    content = `
    <ul class="ul-opt">
      <li class="cMB" onclick="openMenu('settings', 'editor')">Open Editor Settings</li>
      <li class="cMB" style="opacity: 0.4; border: 1px solid red;" onclick="openMenu('shortcuts', 'editor')">Keyboard Shortcuts</li>
	  </ul>
    `
  }

  contextMenu.innerHTML = content
  if (contextMenu.querySelector('.open-file-btn')) {
    contextMenu.querySelector('.open-file-btn').addEventListener('click', () => {
      openFile(
        passThru?.file.name,
			  passThru?.fileHandle,
			  passThru?.folderName + passThru?.file.name
			);
		});
	}
  if (contextMenu.querySelector('.open-file-btn-in-new-tab')) {
    contextMenu.querySelector('.open-file-btn-in-new-tab').addEventListener('click', () => {
      openFile(
        passThru?.file.name, 
        passThru?.fileHandle, 
        passThru?.folderName + passThru?.file.name, 'new-window')
    })
  }

  const rect = elementClicked.getBoundingClientRect();
    const menuWidth = contextMenu.offsetWidth || 200; // estimate if not rendered yet
    const menuHeight = contextMenu.offsetHeight || 150;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = rect.bottom;
    let left = rect.left;

    if (top + menuHeight > viewportHeight) {
        top = rect.top - menuHeight;
    }

    if (left + menuWidth > viewportWidth) {
        left = rect.left - menuWidth;
    }

    contextMenu.style.position = 'absolute';
    contextMenu.style.top = `${top}px`;
    contextMenu.style.left = `${left}px`;
    contextMenu.classList.add('open');


  setTimeout(function() {
    document.addEventListener('click', () => {
    contextMenu.classList.remove('open');
	setTimeout(function() {
		contextMenu.innerHTML = '';
	}, 400) 
  }, { once: true });
  }, 400)
}

function renderMenu(menu) {
  if (menu == 'settings') {
	let allUsers
	if (loadStorage('users').forEach) {
		loadStorage('users').forEach(one => {
			allUsers += `
			<div class="item-f">
				<span style="display: flex; align-items: center; gap: 10px;">
					<span>${one.avatarPath || `<i class="fa-solid fa-users-between-lines"></i>`}</span>
					<span>${one.username}</span>
				</span>
				<a href="../website/account/index.html?name=${one.username}">Switch</a>
			</div>` 
		})
	}
  const settings = loadStorage('pulsewriteSettings', { 'oPopinNewW': false })
  return `
    <button class="popup-close-btn">
      <i class="fa-solid fa-xmark"></i>
    </button>

    <div class="sidebar-settings">
      <h2>Settings</h2>

      <button value="general" class="active"><i class="fa-solid fa-gear"></i> General</button>
      <button value="editor"><i class="fa-solid fa-window-restore"></i> Editor</button>
      <button value="personalization"><i class="fa-solid fa-fill-drip"></i> Personalization</button>
      <button value="apps"><i class="fa-solid fa-gear"></i> Apps</button>
      <button value="accounts"><i class="fa-solid fa-users"></i> Accounts</button>
      <button value="windows"><i class="fa-solid fa-window-restore"></i> Windows</button>
    </div>

    <div class="main-settings" id="main-settings">
      <section id="general-setting-m">
	  	  <div class="item-f">
          <h3>Save Files..</h3>
          <select id="themeSelector" onchange="saveSettings('pulsewriteSettings', 'save', this.value)">
  				  <option value="vs-dark" ${settings.save === 'manually' ? 'selected' : ''}>Manually</option>
  				  <option value="vs" ${settings.save === 'vs' ? 'onLoseFocus' : ''}>When Lose Focus</option>
  				  <option value="hc-black" ${settings.save === 'automatically' ? 'selected' : ''}>Automatically</option>
			    </select>
        </div>
	  	  <div class="item-f">
          <h3>Show Notifications When Each File Is Saved</h3>
        <label class="switch"><input type="checkbox" onchange="saveSettings('pulsewriteSettings', 'sNotiWSaved', this.checked)" ${settings.sNotiWSaved ? 'checked' : ''}><span class="slider"></span></label>
        </div>
	    </section>
      <section id="personalization-setting-m" style="display:none;">
	  	<div class="item-f">
			<h3>Editor Theme</h3>
				<select id="themeSelector" onchange="saveSettings('pulsewriteSettings', 'vsColorTheme', this.value)">
  				<option value="vs-dark" ${settings.vsColorTheme === 'vs-dark' ? 'selected' : ''}>Dark</option>
  				<option value="vs" ${settings.vsColorTheme === 'vs' ? 'selected' : ''}>Light</option>
  				<option value="hc-black" ${settings.vsColorTheme === 'hc-black' ? 'selected' : ''}>High Contrast</option>
			</select>
		</div>
		<p>* Theme applies to newly opened tabs or after tab reload.</p>
		<div class="item-f">
			<h3>Tab Active Color</h3>
			<input type="color" value="${settings.tabAColor || '#00009d'}">
		</div>
	  </section>
      <section id="apps-setting-m" style="display:none;">
	  	<p>Shows your current apps downloaded to IndexedDB storage for 'Inspire'. Control all your apps, here.</p>
		<h3>Feature coming soon.</h3>
	  </section>
      <section id="accounts-setting-m" style="display:none;">
	  	<div>
	  		<a style="padding: 12px; color: white; border-radius: 20px; border: 1px solid white; margin-top: 10px" href="../website/account/register.html">Add a New User</a>
	  		<a style="padding: 12px; color: white; border-radius: 20px; border: 1px solid white; margin-top: 10px" href="../website/account/dashboard/index.html">Go to Dashboard</a>
  		</div>
	  	<div class="item-f">
	  		<p>Currently Logged in User</p>
			<span style="display: flex; align-items: center; gap: 10px;">
				<span>${loadStorage('currentUser', { name: 'Currently not signed in.' }).avatarPath || `<i class="fa-solid fa-laptop-code"></i>`}</span>
				<span>${loadStorage('currentUser', { name: 'Currently not signed in.' }).username || 'Currently not signed in'}</span>
			</span>
		</div>
		<h3>Other Users Signed In</h3>
		${allUsers}
	  </section>
      <section id="windows-setting-m" style="display:none;">
	  	<div class="item-f">
	  		<h3>Open Popup in New Window</h3>
        <label class="switch"><input type="checkbox" onchange="saveSettings('pulsewriteSettings', 'oPopinNewW', this.checked)" ${settings.oPopinNewW ? 'checked' : ''}><span class="slider"></span></label>
		</div>
	  </section>
    <section id="editor-setting-m" style="display:none;">
      <p>Customize the editor, your way. Theme can be changed in <a href="javascript:changeSettingsMenu('personalization')">personalization</a> settings.</p>
      <div class="item-f">
        <h3>Text Wrap</h3>
			  <label class="switch"><input type="checkbox" onchange="saveSettings('pulsewriteSettings', 'editorTextWrap', this.checked)" ${settings.editorTextWrap ? 'checked' : ''}><span class="slider"></span></label>
      </div>
      <div class="item-f">
        <h3>Show Scroll Map</h3>
			  <label class="switch"><input type="checkbox" onchange="saveSettings('pulsewriteSettings', 'sScrollMap', this.checked)" ${settings.sScrollMap ? 'checked' : ''}><span class="slider"></span></label>
      </div>
      <div class="item-f">
        <h3>Suggestions</h3>
			  <label class="switch"><input type="checkbox" onchange="saveSettings('pulsewriteSettings', 'wordSuggestions', this.checked)" ${settings.wordSuggestions ? 'checked' : ''}><span class="slider"></span></label>
      </div>
    </section>
    </div>
  `;
	} else if (menu == 'about') {
		let aboutCard = ``
		Object.entries(pulsewriteInfo).forEach(([key, value]) => {
			aboutCard += `
				<div class="item-f">
					<p>${key}</p>
					<p>${value}</p>
				</div>
			`
		  });		  
		return `
			<button class="popup-close-btn">
      			<i class="fa-solid fa-xmark"></i>
    		</button>
			<img src="https://bing.com/th/id/BCO.6355e1b5-cb70-4368-a053-5d43c3357421.png" style="width: 35%; border-radius: 90px;"></img>
		  	<h2>Bluebird PulseWrite</h2>
			${aboutCard}
		`
	}
}

/* 2️⃣  Core toggle logic (main window)  */
function changeSettingsMenu(menuName, doc = document) {
  const container = doc.getElementById('main-settings');
  if (!container) return;

  /* hide / show sections */
  container.querySelectorAll('section').forEach(sec => {
    sec.style.display = 'none';
  });
  const target = doc.getElementById(`${menuName}-setting-m`);
  if (target) target.style.display = 'unset';

  /* set active button */
  doc.querySelectorAll('.sidebar-settings button').forEach(btn => {
    btn.classList.toggle('active', btn.value === menuName);
  });
}

/* 3️⃣  Universal listener-binder (works for both windows)  */
function wireSidebarButtons(doc = document) {
  doc.querySelectorAll('.sidebar-settings button').forEach(btn => {
    btn.addEventListener('click', () => changeSettingsMenu(btn.value, doc));
  });
}

function openMenu(menu, openSection = 'general') {
	if (!loadStorage('pulsewriteSettings').oPopinNewW) {

		const overlay = document.getElementById('bg-overlay');
		const popup   = document.getElementById('popup-w-overlay-menu');
		popup.innerHTML  = renderMenu(menu);
		overlay.className = `open ${menu}-menu-app`;
		
		const mainClose = popup.querySelector('.popup-close-btn');
		if (mainClose) mainClose.addEventListener('click', () => overlay.className = '');
		
		wireSidebarButtons();
		changeSettingsMenu(openSection);
	} else {

		const win = window.open('', '', 'width=800,height=550,left=200,top=200');
		const base = location.origin + location.pathname.replace(/\/[^\/]*$/, '/')
		
		/* basic shell first */
		win.document.write(`
			<!DOCTYPE html>
			<html>
			<head>
				<title>${menu} – PulseWrite</title>
				<link rel="stylesheet" href="${base}style.css">
				<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.css">
				<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded">
			</head>
			<body>
				<div id="notification"></div>
				<div id="bg-overlay" class="open ${menu}-menu-app">
				<div id="popup-w-overlay-menu">${renderMenu(menu)}</div>
				</div>
				<script src="${base}script.js"></script>
			</body>
			</html>
			`);
			
			win.changeSettingsMenu = (name) => changeSettingsMenu(name, win.document);
			wireSidebarButtons(win.document);
			win.changeSettingsMenu('general');
			win.document.querySelector('.popup-close-btn').remove()
		}
	};
		
const request = indexedDB.open("pulseWriteApps", 1);
	request.onupgradeneeded = event => {
		const db = event.target.result;
		db.createObjectStore("apps", { keyPath: "name" });
};
		
const addNewApp = (appName, appContent) => {
  	const transaction = db.transaction("users", "readwrite");
  	const store = transaction.objectStore("users");
  	store.add({ name: appName, name: appContent });
	displayNotification('App Added and Ready to Run!', `<span class="material-symbols-rounded">app_registration</span>`, 5000)
}

function genRandomId(length = 6) { 
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.';
	let result = '';
	for (let i = 0; i < length; i++) {
	  result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}