let db;
let portalSettings

function loadLocalStorage(name, fallback) {
	try {
		const raw = localStorage.getItem(name);
		if (raw == null) return fallback;
		const parsed = JSON.parse(raw);
		return parsed ?? raw ?? fallback;
	} catch {
		return fallback;
	}
}

setTimeout(function () {
	updateAppList()
}, 3000)

function loadCategoryOptions(mode = 'select') {
	const raw = localStorage.getItem('portalCategories');
	let categoryStorage = [];

	try {
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed)) {
			categoryStorage = parsed
				.filter(item => typeof item.catLogo === 'string' && typeof item.catName === 'string')
				.map(item => ({
					value: item.catLogo.trim(),
					label: item.catName.trim()
				}));
		}
	} catch {
		categoryStorage = [];
	}

	if (categoryStorage.length === 0) {
		categoryStorage = [{ value: '', label: 'None Saved.' }];
	}

	if (mode === 'select') {
		return categoryStorage.map(({ value, label }) =>
			`<option value="${escapeHtml(label)}">${escapeHtml(label)}</option>`
		);
	}

	if (mode === 'json') {
		return categoryStorage;
	}
}

function addNewCat(selectElement) {
	const html = `
    <form id="adCatF">
        <h1>Add New Category</h1>
        <p>Keep in mind that it cannot contain special characters. (ex. &, @, #, ), etc. Especially {, })</p>
        <div class="inputField">
            <i class="material-symbols-rounded">code</i>
            <input id="addCategoryLogoP" placeholder="Category Logo Path" required>
        </div>
        <div class="inputField">
            <i class="material-symbols-rounded">category_search</i>
            <input id="addCategoryName" placeholder="Category Name" required>
        </div>
        <p>* Keep in mind that this cannot be edited in the future. You will have to delete if you want to edit.</p>
        <div class="bottom-btns">
            <button type="reset" id="cancelAdd"><i class="material-symbols-rounded">cancel</i> Cancel</button>
            <button type="submit"><i class="material-symbols-rounded">save</i> Save</button>
        </div>
    </form>
    `;

	const { contextMenu } = setUpAndOpenContextMenu('custom-html', selectElement, { html });
	contextMenu.classList.add('form-on-context');

	const form = contextMenu.querySelector('form');

	form.addEventListener('submit', (event) => {
		event.preventDefault();

		const catLogoInput = document.getElementById('addCategoryLogoP');
		const catNameInput = document.getElementById('addCategoryName');

		// Sanitize input (optional enhancement)
		const sanitize = str => str.replace(/[&@#{}()]/g, '').trim();

		const catLogo = sanitize(catLogoInput.value);
		const catName = sanitize(catNameInput.value);

		const key = 'portalCategories';
		const newItem = { catLogo, catName };

		let existing;
		try {
			existing = JSON.parse(localStorage.getItem(key));
			if (!Array.isArray(existing)) {
				localStorage.setItem(key, JSON.stringify([]));
				existing = [];
			}
		} catch {
			existing = [];
		}

		const alreadyExists = existing.some(item =>
			item.catLogo === newItem.catLogo && item.catName === newItem.catName
		);

		if (alreadyExists) {
			displayNotification('This category already exists.', `<i class="fa-solid fa-circle-exclamation"></i>`);
			return;
		}

		existing.push(newItem);
		localStorage.setItem(key, JSON.stringify(existing));
		displayNotification('Category Added to Sidebar', `<i class="fa-solid fa-check"></i>`);
		removeOpenC(contextMenu, true);
	});

	form.addEventListener('reset', () => {
		removeOpenC(contextMenu, true);
	});

	buildSidebar()
}

function escapeHtml(str) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function generateRandomID(length = 6) {
	let id = '';
	for (let i = 0; i < length; i++) id += Math.floor(Math.random() * 10);
	return id;
}

function setParam(name, value) {
	const url = new URL(window.location.href);
	url.searchParams.set(name, value);
	history.pushState({}, '', `${url.pathname}?${url.searchParams.toString()}${url.hash}`);
}

function removeParam(name) {
	const url = new URL(window.location.href);
	url.searchParams.delete(name);
	history.pushState({}, '', `${url.pathname}?${url.searchParams.toString()}${url.hash}`);
}

function readParam(name) {
	const url = new URL(window.location.href);
	return url.searchParams.get(name);
}

function openDatabase(callback) {
	const user = loadLocalStorage('currentUser');
	let dbName
	if (readParam('db')) {
		dbName = `${readParam('db')}`
	} else {
		dbName = `${user?.username || 'guest'}AppsDB`
	}

	const request = indexedDB.open(dbName, 1);

	request.onerror = () => {
		console.error('IndexedDB error:', request.error);
	};

	request.onsuccess = () => {
		db = request.result;
		// Handle version changes gracefully
		db.onversionchange = () => {
			db.close();
			console.warn('Database is outdated, please reload the page.');
		};
		console.log('Database opened successfully');
		if (callback) callback();
	};

	request.onupgradeneeded = (event) => {
		db = event.target.result;
		if (!db.objectStoreNames.contains('apps')) {
			const objectStore = db.createObjectStore('apps', { keyPath: 'id' });
			objectStore.createIndex('name', 'name', { unique: false });
			objectStore.createIndex('url', 'url', { unique: true });
			objectStore.createIndex('logoName', 'logoName', { unique: false });
		}
	};
}

function getDbData(premisions = 'readwrite') {
	const tx = db.transaction(['apps'], premisions);
	const store = tx.objectStore('apps');
	return store
}

function saveApp(app) {
	if (!db) {
		console.warn('Database not ready.');
		return;
	}
	const objectStore = getDbData()
	const request = objectStore.add(app);

	request.onsuccess = () => {
		console.log('App added successfully');
		updateAppList();
	};
	request.onerror = () => {
		displayNotification('An error has occurred. Try again or change values.', 5000, `<i class="fa-solid fa-triangle-exclamation"></i>`);
		console.error('Error adding app:', request.error);
	};
}

function updateAppInDB(appData) {
	if (!db) {
		console.warn('Database not ready.');
		return;
	}
	const objectStore = getDbData();
	const request = objectStore.put(appData);

	request.onsuccess = () => {
		displayNotification(`"${appData.name}" updated successfully.`, `<i class="fa-solid fa-clipboard-check"></i>`, 3000);
		updateAppList();
	};
	request.onerror = () => {
		alert('Failed to update app. Please try again.');
		console.error('Error updating app:', request.error);
	};
}

// Optional: delete helper (kept tidy)
function deleteApp(id) {
	if (!db) {
		alert('Database not available.');
		return;
	}
	const tx = db.transaction(['apps'], 'readwrite');
	const store = tx.objectStore('apps');
	const req = store.get(id);

	req.onsuccess = (e) => {
		const app = e.target.result;
		var popup = openPopup('removeApp', { app })
		if (!app) {
			displayNotification(`App with ID ${id} not found.`, `<i class="fa-solid fa-ban"></i>`, 3000);
			return;
		}
		const confirmed = confirm(`Are you sure you want to delete "${app.name}"?`);
		if (!confirmed) return;

		const delReq = store.delete(id);
		delReq.onsuccess = () => {
			console.log('App deleted');
			displayNotification(`"${app.name}" deleted.`, `<i class="fa-solid fa-trash"></i>`, 3000);
			updateAppList();
		};
		delReq.onerror = () => {
			alert('Failed to delete app. Please try again.');
		};
	};

	req.onerror = () => {
		alert('Error retrieving app for deletion.');
	};
}

function updateAppList() {
	const appList = document.getElementById('apps');
	if (!db || !appList) {
		console.warn('Database or app container not ready');
		return;
	}

	appList.innerHTML = '';
	document.querySelectorAll('.app-section').forEach(one => {
		one.innerHTML = ``
	})

	const transaction = db.transaction(['apps'], 'readonly');
	const objectStore = transaction.objectStore('apps');
	const request = objectStore.getAll();

	request.onsuccess = (event) => {
		const apps = event.target.result || [];
		const sortedApps = sortApps(apps);
		for (const app of sortedApps) {
			const appCont = createAppElement(app);
			appList.appendChild(appCont);
		}
		if (appList.innerHTML == '') {
			appList.innerHTML = `
        <div style="text-align: center; display: block; width: 100%;">
        <h1 style="font-size: 8rem; margin: 0; padding: 0; color: orange" class="material-symbols-rounded">add_alert</h1>
        <h1>App Apps!</h1>
        <p>Customize it even more with your own apps. Click the plus button to get started.</p>
        </div>`
		}
	};

	request.onerror = (event) => {
		console.error('Failed to fetch apps:', event.target.error);
	};
}

function createAppElement(app) {
	const appCont = document.createElement('div');
	appCont.classList.add('app');
	appCont.dataset.id = app.id;

	const logoSpan = document.createElement('span');
	logoSpan.className = 'logo';
	logoSpan.innerHTML = app.logoName || `<i class="material-symbols-rounded">apps</i>`;
	appCont.appendChild(logoSpan);

	const nameSpan = document.createElement('span');
	nameSpan.className = 'name';
	nameSpan.textContent = app.name;
	appCont.appendChild(nameSpan);

	const actionRow = document.createElement('span');
	actionRow.style.display = 'flex';
	actionRow.style.marginTop = '10px';

	const link = document.createElement('a');
	link.href = app.url;
	link.title = app.name;
	link.target = loadLocalStorage('portalSettings').openInNewTab ? '_blank' : '_top';
	link.rel = 'noopener';
	link.innerHTML = `Open App <span translate="no" class="material-symbols-rounded">open_in_new</span>`;
	actionRow.appendChild(link);

	const moreBtn = document.createElement('button');
	moreBtn.className = 'more';
	moreBtn.id = `more-app-act-${app.id}`;
	moreBtn.innerHTML = `<i class="material-symbols-rounded">more_vert</i>`;
	actionRow.appendChild(moreBtn);

	appCont.appendChild(actionRow);

	moreBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		setUpAndOpenContextMenu('more-action', moreBtn, { app });
	});

	appCont.addEventListener('click', (event) => {
		if (event.target.closest('a, button')) return;
		link.click();
	});

	const category = app.category?.trim() || 'uncategorized';
	const sectionId = `app-section-${category.toLowerCase().replace(/\s+/g, '-')}`;

	let section = document.getElementById(sectionId);
	if (!section) {
		section = document.createElement('section');
		section.id = sectionId;
		section.classList.add('app-section');
		const header = document.createElement('h2');
		header.className = 'category-header';
		header.innerHTML = category === 'uncategorized' ? '' : category;
		section.appendChild(header);

		document.getElementById('main-cont-for-apps').appendChild(section);
	}

	section.innerHTML += `
	<div class="app" data-id="${app.id}">
		<span class="logo">
			${app.logoName}
		</span>
		<span class="name">${app.name}</span>
		<span style="display: flex; margin-top: 10px;">
			<a href="${app.url}" title="${app.name}" target="${loadLocalStorage('portalSettings').openInNewTab ? '_blank' : '_top'}" rel="noopener">Open App <span translate="no" class="material-symbols-rounded">open_in_new</span></a>
			<button class="more" id="more-app-act-${app.id}"><i class="material-symbols-rounded">more_vert</i></button>
		</span>
	</div>
	`

	if (section.querySelector('h2')) {
		section.innerHTML = `<h2>${app.category}</h2>`
	}

	return appCont;
}

function sortApps(apps) {
	const sortOrder = 'a-z';
	if (sortOrder === 'a-z') return [...apps].sort((a, b) => a.name.localeCompare(b.name));
	if (sortOrder === 'z-a') return [...apps].sort((a, b) => b.name.localeCompare(a.name));
	return apps;
}

// —————————————————————————————————————————————————————————————
// DB copy helper (schema-aware for this app)
// —————————————————————————————————————————————————————————————
function copyDatabase(sourceName, targetName, version = 1) {
	const sourceRequest = indexedDB.open(sourceName, version);
	const targetRequest = indexedDB.open(targetName, version);

	let sourceDB, targetDB;

	sourceRequest.onerror = () => console.error('Error opening source DB:', sourceRequest.error);
	targetRequest.onerror = () => console.error('Error opening target DB:', targetRequest.error);

	targetRequest.onupgradeneeded = (e) => {
		const tdb = e.target.result;
		if (!tdb.objectStoreNames.contains('apps')) {
			const store = tdb.createObjectStore('apps', { keyPath: 'id' });
			store.createIndex('name', 'name', { unique: false });
			store.createIndex('url', 'url', { unique: true });
			store.createIndex('logoName', 'logoName', { unique: false });
		}
	};

	sourceRequest.onsuccess = () => {
		sourceDB = sourceRequest.result;
		if (targetDB) startCopy();
	};
	targetRequest.onsuccess = () => {
		targetDB = targetRequest.result;
		if (sourceDB) startCopy();
	};

	function startCopy() {
		const sourceTx = sourceDB.transaction(['apps'], 'readonly');
		const sourceStore = sourceTx.objectStore('apps');

		const targetTx = targetDB.transaction(['apps'], 'readwrite');
		const targetStore = targetTx.objectStore('apps');

		const cursorRequest = sourceStore.openCursor();
		cursorRequest.onsuccess = (e) => {
			const cursor = e.target.result;
			if (cursor) {
				targetStore.put(cursor.value);
				cursor.continue();
			}
		};
		cursorRequest.onerror = () => console.error('Error reading from source during copy:', cursorRequest.error);
	}
}

function openPopup(type = '', passThru = {}, close = false) {
	const popup = document.getElementById('popup');
	if (!popup) return 'No Pop Found';

	let content = '';

	if (type === 'removeApp') {
		const appName = passThru?.app?.name ?? 'this app';

		content = `
      <h1>Remove ${appName}?</h1>
      <p>You may add this app again later if you choose to.</p>
      <div class="bottom-btns">
        <button id="cancelBtn">No</button>
        <button id="yesBtnDele">Yes</button>
      </div>
    `;
	} else {
		content = `Nothing Found`
	}

	popup.innerHTML = content;
	popup.classList.add('open');

	//   if (close) {
	//     popup.innerHTML = '';
	//     popup.classList.remove('open');
	//     return;
	//   }
}

function openFromNavPopup(popup, passThru = {}) {
	console.log(passThru)
	const popupElem = document.getElementById('from-nav-pop');
	popupElem.innerHTML = `
    <nav>
      <h1>${popup}</h1>
      <button type="button" class="close-pop" onclick="document.getElementById('from-nav-pop').classList.remove('open')"><i class="material-symbols-rounded">close</i></button>
    </nav>
  `;

	// Top-right close button
	const closeBtn = popupElem.querySelector('.close-pop');
	if (closeBtn) closeBtn.addEventListener('click', () => popupElem.classList.remove('open'));

	if (popup === 'Add App' || popup === 'Edit App') {
		const form = document.createElement('form');
		form.id = popup === 'Add App' ? 'addAppForm' : 'editAppForm';

		form.innerHTML = `
      <div class="inputField">
        <i class="material-symbols-rounded">badge</i>
        <input id="appName" placeholder="App Name" required>
      </div>
      <div class="inputField">
        <i class="material-symbols-rounded">link</i>
        <input id="appUrl" type="url" placeholder="App URL" required>
      </div>
      <div class="inputField">
        <i class="material-symbols-rounded">code</i>
        <input id="appLogo" placeholder="App Logo" required>
      </div>
      <div class="inputField">
        <i class="material-symbols-rounded">call_split</i>
        <select id="appCatagory" placeholder="App Category" required>
            <option selected value="uncategorized">Uncategorized</option>
			${loadCategoryOptions()}
            <option value="addCat2910">Add New Category..</option>
        </select>
      </div>
    <p>All catagories from other users on this device shows here</p>
      <section class="bottom-btns">
        <button type="button" class="btn-close-inline">
          <i class="material-symbols-rounded">close</i> Close
        </button>
        <button type="submit">
          <i class="material-symbols-rounded">${popup === 'Add App' ? 'add' : 'save'}</i> ${popup === 'Add App' ? 'Add' : 'Save'}
        </button>
      </section>
      <p>* In App Logo, it can be anything. If you're putting an image from the web, use &lt;img src="//Link here///"&gt;</p>
    `;

		popupElem.appendChild(form);

		// Inline close button
		const inlineClose = form.querySelector('.btn-close-inline');
		if (inlineClose) inlineClose.addEventListener('click', () => popupElem.classList.remove('open'), { once: true });

		// Cache inputs from this form (avoids any cross-form ID collisions)
		const nameInput = form.querySelector('#appName');
		const urlInput = form.querySelector('#appUrl');
		const logoInput = form.querySelector('#appLogo');
		const categoryInput = form.querySelector('#appCatagory');

		categoryInput.addEventListener('change', function (event) {
			if (categoryInput.value == 'addCat2910') {
				categoryInput.value = 'uncategorized'
				addNewCat(document.body)
			}
		})

		if (popup === 'Add App') {
			form.addEventListener('submit', (event) => {
				event.preventDefault();

				const name = nameInput.value.trim();
				const logo = logoInput.value.trim();
				const url = urlInput.value.trim();
				const category = categoryInput.value.trim();

				if (name && logo && url) {
					const app = {
						id: generateRandomID(6), // keep as string to preserve leading zeros
						name,
						logoName: logo,
						url,
						category,
						developer: '',
						description: '',
						usersAllowed: '',
						favorite: false,
						addedUser: loadLocalStorage('currentUser').username
					};
					saveApp(app);
					popupElem.classList.remove('open');
				}
			}, { once: true });
		}
	} else if (popup == 'Settings') {
		const settings = loadLocalStorage('portalSettings')
		popupElem.innerHTML += `
	<h2>Customization</h2>
	<div class="sCont">
		<h3>Theme Color</h3>
		<input type="color" value="${settings.bgColor || '#292929'}" onchange="saveToStorage('portalSettings', 'bgColor', this.value)">
	</div>
	<div class="sCont">
		<h3>Text Color</h3>
		<input type="color" value="${settings.txtColor || '#ffffffff'}" onchange="saveToStorage('portalSettings', 'txtColor', this.value)">
	</div>
	<div class="sCont">
		<span>
			<h3>Background Brightness</h3>
			<p>Only applies when using color as the background. Determines how dark the background is to not blend in to other elements</p>
		</span>
		<span>
			<input type="number" value="${settings.bgBright || '100'}" max="200" min="0" step="10" onchange="saveToStorage('portalSettings', 'bgBright', this.value)">%
		</span>
	</div>
	<h2>Links</h2>
	<div class="sCont">
		<h3>Link Color</h3>
		<input type="color" value="${settings.linkColor || '#00e1ffff'}" onchange="saveToStorage('portalSettings', 'linkColor', this.value)">
	</div>
	<div class="sCont">
		<span>
			<h3>Open in New Tab</h3>
			<p>* Requires Refresh.</p>
		</span>
		<label class="switch"><input type="checkbox" onchange="saveToStorage('portalSettings', 'openInNewTab', this.checked)" ${settings.openInNewTab ? 'checked' : ''}><span class="slider"></span></label>
	</div>

	<p>Last Loaded Settings: ${settings.bgColor}</p>
	`
	}

	if (!popupElem.classList.contains('open')) {
		popupElem.classList.add('open');
	}
}

function saveToStorage(storageKey, name, value) {
	try {
		const existing = JSON.parse(localStorage.getItem(storageKey)) || {};
		existing[name] = value;
		localStorage.setItem(storageKey, JSON.stringify(existing));
		displayNotification('Setting Saved. They should be applies automatically.', `<span class="material-symbols-rounded">sync_saved_locally</span>`, 2000)
	} catch (e) {
		displayNotification('Cannot save settings. Try again later.', `<span class="material-symbols-rounded">emergency_home</span>`, 2000)
	}
	loadUserSettings()
}


document.addEventListener('DOMContentLoaded', () => {
	preloader()
	openDatabase(updateAppList);
	if (!localStorage.getItem('portalCategories')) {
		const startCat = {
			'apps': 'Uncategorized Apps',
		};
		localStorage.setItem('portalCategories', JSON.stringify(startCat))
	}
	buildSidebar()

	const isChecked = readParam('db') === 'myAppsDB' ? 'checked' : '';

	document.getElementById('app-navbar').innerHTML = `
    <h1>Hi ${JSON.parse(localStorage.getItem('currentUser'))?.username || 'Guest'}!</h1>
    <span style="display: flex; align-items: center; gap: 10px;">
        <i class="material-symbols-rounded">account_circle</i>
        <label class="switch"><input type="checkbox" id="db-toggle" ${isChecked}><span class="slider"></span></label>
        <i class="material-symbols-rounded">computer</i>
    </span>
    `
	document.getElementById('db-toggle').addEventListener('change', function () {
		let toHref
		if (document.getElementById('db-toggle').checked) {
			toHref = 'myAppsDB'
		} else {
			toHref = `${JSON.parse(localStorage.getItem('currentUser'))?.username || 'guest'}AppsDB`
		}
		var aLink = document.createElement('a')
		aLink.href = `?db=${toHref}`
		document.body.appendChild(aLink)
		aLink.click()
		console.log(toHref)
	})
	document.getElementById('showAllAppsBtn').addEventListener('click', function () {
		document.querySelectorAll('.app-section').forEach(sect => {
			sect.classList.remove('open');
		});
		document.getElementById('apps').classList.add('open');

		document.querySelectorAll('.app-section').forEach(sect => {
			sect.classList.remove('open');
		});

		document.getElementById('app-cats').querySelectorAll('a').forEach(b => b.classList.remove('active'));
		document.getElementById('showAllAppsBtn').classList.add('active');
	})
	loadUserSettings()

	if (readParam('app-category')) {

	}
});

function loadUserSettings() {
	var pSet = loadLocalStorage('portalSettings', { bgColor: 'navy', txtColor: '#fffff', linkColor: 'cyan' })
	const rootElement = document.documentElement
	rootElement.style.setProperty('--mColor', pSet.bgColor);
	rootElement.style.setProperty('--tColor', pSet.txtColor);
	rootElement.style.setProperty('--linkColor', pSet.linkColor || 'cyan');
	document.body.style.backdropFilter = `brightness(${pSet.bgBright || '100'}%)`
}

const searchInput = document.getElementById('search-port');

let noResults = document.createElement('div');
noResults.classList.add('no-results');
noResults.innerHTML = `
  <h1 style="font-size: 6rem"><i class="fa-solid fa-triangle-exclamation"></i></h1>
  <p>No Results Found</p>
`;

searchInput.addEventListener('keyup', (event) => {
	if (event.ctrlKey && event.key === 'f') {
		closeSearch()
	}
	a

	if (matchCount === 0) {
		if (!container.contains(noResults)) {
			container.appendChild(noResults);
		}
	} else {
		if (container.contains(noResults)) {
			noResults.remove();
		}
	}
});

function closeSearch() {
	document.getElementById('search-dialogue').classList.remove('open');
	document.getElementById('search-port').value = '';

	const event = new Event('input');
	document.getElementById('search-port').dispatchEvent(event);
}

function buildSidebar() {
	const raw = localStorage.getItem('portalCategories');
	if (!raw) return;

	let storage;
	try {
		storage = JSON.parse(raw);
		if (!Array.isArray(storage)) throw new Error('Expected array');
	} catch {
		console.warn('Invalid portalCategories JSON');
		return;
	}

	const sidebar = document.getElementById('app-cats');
	sidebar.innerHTML = '';
	const container = document.getElementById('app-cat-cont');

	storage.forEach(({ catLogo, catName }) => {
		if (typeof catLogo !== 'string' || typeof catName !== 'string') return;

		const label = catName.trim();
		const button = document.createElement('a');
		button.title = label;
		button.href = `#`;
		button.innerHTML = `<i class="material-symbols-rounded">${catLogo}</i>`;
		button.addEventListener('click', function () {
			if (!label || typeof label !== 'string') return;

			const category = label.toLowerCase().replace(/\s+/g, '-');

			const target = document.getElementById(`app-section-${category}`);
			const appsContainer = document.getElementById('apps');

			if (target) {
				document.querySelectorAll('.app-section').forEach(sect => {
					sect.classList.remove('open');
				});

				setParam('app-category', category);

				appsContainer.classList.remove('open');
				target.classList.add('open');

				container.querySelectorAll('a').forEach(b => b.classList.remove('active'));
				button.classList.add('active');
			} else {
				displayNotification(
					'No Apps in that Category.',
					`<span class="material-symbols-rounded">apps_outage</span>`,
					1500
				);
			}
		});
		button.addEventListener('contextmenu', function (e) {
			e.preventDefault()
			setUpAndOpenContextMenu('category-cmenu', e.target, { label })
		})
		sidebar.appendChild(button);
	});
}

// Modular update function
function updateAppInDB(appData) {
	const transaction = db.transaction(['apps'], 'readwrite');
	const objectStore = transaction.objectStore('apps');
	const request = objectStore.put(appData);

	request.onsuccess = () => {
		displayNotification(`"${appData.name}" updated successfully.`, `<i class="fa-solid fa-square-check"></i>`, 3000);
		updateAppList();
	};

	request.onerror = () => {
		alert('Failed to update app. Please try again.');
	};
}

window.onload = () => {
	preloader(document.body, true)
	openDatabase(updateAppList);
}

function setUpAndOpenContextMenu(type, elementClicked, passThru = {}, closeWhenClickOnMenu = false) {
	// Remove any existing menu
	document.querySelectorAll('.context-menu').forEach(m => m.remove());

	// Create menu container
	const contextMenu = document.createElement('div');
	contextMenu.classList.add('context-menu');

	// Generate menu content
	let content = '';
	if (type === 'more-action') {
		const appId = passThru.app?.id ?? '';
		content = `
      <ul class="ul-opt">
        <li class="cMB" data-action="edit-app" data-id="${appId}">Edit App</li>
        <li class="cMB" data-action="delete-app" data-id="${appId}">Delete App</li>
      </ul>
    `;
	} else if (type === 'account') {
		content = `
      <ul class="ul-opt">
        <li><a href="../website/account/dashboard/index.html" class="cMB">View Account Dashboard</a></li>
        <li><a href="#" onclick="logInOrSwitchUserUi()" class="cMB">Switch Accounts</a></li>
      </ul>
    `;
	} else if (type === 'addItem') {
		content = `
	<ul class="ul-opt">
		<li class="cMB" data-action="add-app">Add App</li>
        <li class="cMB" data-action="add-category">Add Sidebar Category</li>
    </ul>
	  `
	} else if (type == 'category-cmenu') {
		content = `
		<ul class="ul-opt">
			<li class="cMB" data-action="delete-category">Delete Category</li>
		</ul>
	`
	}

	else if (type === 'custom-html') {
		content = passThru.html ?? '';
	}

	contextMenu.innerHTML = content;
	document.body.appendChild(contextMenu);

	// Hook up menu item actions
	contextMenu.querySelectorAll('.cMB').forEach(item => {
		const action = item.dataset.action;

		item.addEventListener('click', e => {
			e.stopPropagation();
			if (action === 'edit-app' && passThru.app) {
				editAppPopup(elementClicked, passThru.app);
			} else if (action === 'delete-app') {
				deleteAppPopup(elementClicked, passThru?.app)
			} else if (action === 'add-app') {
				openFromNavPopup('Add App')
			} else if (action === 'add-category') {
				addNewCat(elementClicked)
			} else if (action === 'delete-category') {
				let apps = JSON.parse(localStorage.getItem('portalCategories')) || [];
				apps = apps.filter(app => app.catName.toLowerCase() !== passThru?.label.toLowerCase());
				localStorage.setItem('portalCategories', JSON.stringify(apps));
				buildSidebar()
				displayNotification('Category Removed', `<i class="fa-solid fa-trash"></i>`)
			}
			removeOpenC(contextMenu, true)
		});
	});

	// Position after rendering to get real size
	requestAnimationFrame(() => {
		const rect = elementClicked.getBoundingClientRect();
		const menuRect = contextMenu.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const scrollX = window.scrollX;
		const scrollY = window.scrollY;

		let top = rect.bottom + scrollY;
		let left = rect.left + scrollX;

		// Flip vertically if overflowing bottom
		if (top + menuRect.height > scrollY + viewportHeight) {
			top = rect.top + scrollY - menuRect.height;
		}
		// Flip horizontally if overflowing right
		if (left + menuRect.width > scrollX + viewportWidth) {
			left = rect.right + scrollX - menuRect.width;
		}

		// Clamp inside viewport
		top = Math.max(scrollY, Math.min(top, scrollY + viewportHeight - menuRect.height));
		left = Math.max(scrollX, Math.min(left, scrollX + viewportWidth - menuRect.width));

		// Apply positioning
		contextMenu.style.position = 'absolute';
		contextMenu.style.top = `${top}px`;
		contextMenu.style.left = `${left}px`;
		contextMenu.classList.add('open');
	});

	// One-time global click handler
	setTimeout(() => {
		document.addEventListener('click', event => {
			const inside = event.target.closest('.context-menu');
			if (!inside || closeWhenClickOnMenu) {
				removeOpenC(contextMenu, true)
			}
		}, { once: true });
	}, 0);

	return { contextMenu };
}

function removeOpenC(element = document.body, remove) {
	element.classList.remove('open')
	if (remove) {
		setTimeout(function () {
			element.remove()
		}, 5000)
	}
}

function editAppPopup(buttonClicked, appData = {}) {
	const appId = appData.id;
	if (!appId || !db) {
		displayNotification('App ID or database missing.', `<i class="fa-solid fa-ban"></i>`, 3000);
		return;
	}

	const request = db.transaction(['apps'], 'readonly')
		.objectStore('apps')
		.get(appId);

	request.onsuccess = event => {
		const app = event.target.result;
		if (!app) {
			displayNotification('App not found.', `<i class="fa-solid fa-ban"></i>`, 3000);
			return;
		}

		const formHTML = `
    <h1>Edit ${app.name}</h1>
      <form id="editAppForm" class="edit-form-menu">
        <div class="inputField">
            <i class="material-symbols-rounded">badge</i>
            <input id="appName" placeholder="App Name" value="${app.name}" required>
        </div>
        <div class="inputField">
            <i class="material-symbols-rounded">link</i>
            <input id="appUrl" type="url" placeholder="App URL" value="${app.url}" required>
        </div>
        <div class="inputField">
            <i class="material-symbols-rounded">call_split</i>
            <select id="appCategory" placeholder="App Category" value="${app.category || ''}" required>
                <option selected value="uncategorized">Uncategorized</option>
                ${loadCategoryOptions()}
                <option>Add New Category..</option>
            </select>
        </div>
        <div class="bottom-btns">
          <button type="button" id="cancelEdit"><i class="material-symbols-rounded">cancel</i> Cancel</button>
          <button type="submit"><i class="material-symbols-rounded">save</i> Save</button>
        </div>
      </form>
    `;

		const { contextMenu } = setUpAndOpenContextMenu(
			'custom-html',
			buttonClicked,
			{ html: formHTML },
			false
		);

		document.getElementById('appCategory').value = app.category;

		contextMenu.classList.add('form-on-context')

		const form = contextMenu.querySelector('#editAppForm');

		form.addEventListener('submit', e => {
			e.preventDefault();
			const updatedApp = {
				id: app.id,
				name: form.querySelector('#appName').value.trim(),
				logoName: app.logoName,
				url: form.querySelector('#appUrl').value.trim(),
				category: form.querySelector('#appCategory').value.trim(),
				developer: app.developer || '',
				description: app.description || '',
				usersAllowed: app.usersAllowed || '',
				favorite: app.favorite || false
			};
			updateAppInDB(updatedApp);
			removeOpenC(contextMenu, true)
		});

		form.querySelector('#cancelEdit').addEventListener('click', () => {
			contextMenu.classList.remove('open')
			removeOpenC(contextMenu, true)
		});
	};


	request.onerror = () => {
		displayNotification('Error loading app for editing.', `<i class="fa-solid fa-ban"></i>`, 3000);
	};
}

function deleteAppPopup(buttonClicked, appData) {
	const appId = appData?.id;
	const appName = appData?.name ?? 'this app';

	if (!appId || !db) {
		displayNotification('App ID or database missing.', `<i class="fa-solid fa-ban"></i>`, 3000);
		return;
	}

	const html = `
  	<span style="display: flex; align-items: center; gap: 20px;">
  		<span class="appLogoS">${appData?.logoName}</span>
	  	<h1>Remove ${appName}?</h1>
	</span>
    <p>You may add this app again later if you choose to.</p>
    <div class="bottom-btns">
      <button id="cancelBtn"><i class="material-symbols-rounded">cancel</i> No</button>
      <button id="yesBtnDele"><i class="material-symbols-rounded">delete</i> Delete App</button>
    </div>
  `;

	const { contextMenu } = setUpAndOpenContextMenu('custom-html', buttonClicked, { html });
	contextMenu.classList.add('form-on-context')

	contextMenu.querySelector('#cancelBtn')?.addEventListener('click', () => {
		removeOpenC(contextMenu, true)
	});

	contextMenu.querySelector('#yesBtnDele')?.addEventListener('click', async () => {
		let verified = await authWith('secretID')
		console.log(verified)
		const tx = db.transaction(['apps'], 'readwrite');
		const store = tx.objectStore('apps');
		const req = store.get(appId);

		if (verified && appData.addedUser == loadLocalStorage('currentUser').username) {
			req.onsuccess = (e) => {
				const app = e.target.result;
				if (!app) {
					displayNotification(`App with ID ${appId} not found.`, `<i class="fa-solid fa-ban"></i>`, 3000);
					return;
				}
				const delReq = store.delete(appId);
				delReq.onsuccess = () => {
					displayNotification(`"${app.name}" deleted.`, `<i class="fa-solid fa-trash"></i>`, 3000);
					updateAppList();
					removeOpenC(contextMenu, true)
				};
				delReq.onerror = () => {
					alert('Failed to delete app. Please try again.');
				};
			};

			req.onerror = () => {
				alert('Error retrieving app for deletion.');
			};
		} else {
			displayNotification('Failed Verification')
		}
	});

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