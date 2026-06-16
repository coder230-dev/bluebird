const defaultFeeds = [
  'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
  'https://feeds.bbci.co.uk/news/rss.xml',
  'https://www.theguardian.com/world/rss'
];
const PROXY = 'https://api.allorigins.win/raw?url=';
const AUTO_REFRESH_MS = 15 * 60 * 1000; // 15 minutes

// ——————————————————————
//  ENTRY POINT
// ——————————————————————
document.addEventListener('DOMContentLoaded', () => {
  initUser();
  buildModal();
  initDarkMode();
  attachUIEvents();
  loadFeedListUI();
  loadBookmarksUI();
  refreshFeeds();
  preloader(document.body, true, true)
  setInterval(refreshFeeds, AUTO_REFRESH_MS);
  var currentUser = JSON.parse(localStorage.getItem('currentUser'))
  if (currentUser) {
	document.getElementById('profile-pic-nav').innerHTML = currentUser.avatarPath || `<i class="material-symbols-rounded">account_circle</i>`
  }
});

window.onload = () => {
	setTimeout(preloader, 1500)
}
window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
        document.querySelector('nav').classList.add('past-scroll')
    } else {
        document.querySelector('nav').classList.remove('past-scroll')
	}
});

// ——————————————————————
//  USER & STORAGE HELPERS
// ——————————————————————
function initUser() {
  const cu = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (!cu.username) {
    alert("No user logged in. Please set currentUser in localStorage.");
    return;
  }
  let users = JSON.parse(localStorage.getItem('users') || '[]');
  if (!users.some(u => u.username === cu.username)) {
    users.push({
      username: cu.username,
      rssFeeds: [],
      bookmarks: [],
      settings: { autoRefresh: AUTO_REFRESH_MS }
    });
    localStorage.setItem('users', JSON.stringify(users));
  }
}

function getUserData() {
  const { username } = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  return users.find(u => u.username === username) || {};
}

function saveUserData(updated) {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const idx = users.findIndex(u => u.username === updated.username);
  if (idx > -1) users[idx] = updated;
  localStorage.setItem('users', JSON.stringify(users));
}

// ——————————————————————
//  DARK MODE
// ——————————————————————
function initDarkMode() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  document.documentElement.classList.toggle('dark', isDark);
  const btn = document.getElementById('dark-mode-toggle');
  if (btn) btn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
}

function toggleDarkMode() {
  const btn = document.getElementById('dark-mode-toggle');
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('darkMode', isDark);
  if (btn) btn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
}

// ——————————————————————
//  UI EVENT HOOKS
// ——————————————————————
function attachUIEvents() {
  document.getElementById('add-feed')?.addEventListener('click', () => addFeed());
  document.getElementById('refresh-all')?.addEventListener('click', refreshFeeds);
  document.getElementById('dark-mode-toggle')?.addEventListener('click', toggleDarkMode);
  document.getElementById('search-input')?.addEventListener('input', handleSearchInput);
}

function toggleOpenClass(toElement) {
	if (!toElement.includes('document')) {
		var toElement = document.getElementById(toElement)
	}
	if (!toElement.classList.contains('open')) {
		toElement.classList.add('open')
	} else {
		toElement.classList.remove('open')
	}
}

// ——————————————————————
//  ADD / LOAD / REORDER FEEDS
// ——————————————————————
function addFeed(urlParam) {
  const input = document.getElementById('new-feed-url');
  const url = urlParam || input?.value.trim();
  if (!url) return;
  const user = getUserData();
  user.rssFeeds = user.rssFeeds || [];
  if (!user.rssFeeds.includes(url)) {
    user.rssFeeds.push(String(url));
    saveUserData(user);
  } else {
    alert("That feed is already added.");
  }
  if (input) input.value = '';
  loadFeedListUI();
  refreshFeeds();
}

function loadFeedListUI() {
	const user = getUserData();
	const feeds = Array.isArray(user.rssFeeds) && user.rssFeeds.length > 0
	  ? user.rssFeeds.filter(f => typeof f === 'string')
	  : [];
	const ul = document.getElementById('feed-list');
	if (!ul) return;
	ul.innerHTML = '';
  
	if (feeds.length === 0) {
	  const hint = document.createElement('li');
	  hint.textContent = 'No custom feeds yet. Import defaults or add your own:';
	  hint.style.fontStyle = 'italic';
	  ul.appendChild(hint);
  
	  defaultFeeds.forEach(url => {
		const li = document.createElement('li');
		li.innerHTML = `
		  <span class="feed-url">${url}</span>
		  <button class="btn-add" title="Add">➕</button>
		`;
		li.querySelector('button').addEventListener('click', () => addFeed(url));
		ul.appendChild(li);
	  });
	  return;
	}
  
	feeds.forEach(url => {
	  const li = document.createElement('li');
	  li.draggable = true;
	  li.dataset.url = url;
	  li.innerHTML = `
		<span class="feed-url">${url}</span>
		<button class="btn-remove" title="Remove"><span class="material-symbols-rounded">delete</span></button>
	  `;
	  li.querySelector('.btn-remove').addEventListener('click', () => {
		user.rssFeeds = user.rssFeeds.filter(f => f !== url);
		saveUserData(user);
		loadFeedListUI();
		refreshFeeds();
	  });
  
	  li.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', url));
	  li.addEventListener('dragover', e => e.preventDefault());
	  li.addEventListener('drop', e => {
		const dragged = e.dataTransfer.getData('text/plain');
		const from = user.rssFeeds.indexOf(dragged);
		const to = user.rssFeeds.indexOf(url);
		user.rssFeeds.splice(from, 1);
		user.rssFeeds.splice(to, 0, dragged);
		saveUserData(user);
		loadFeedListUI();
	  });
  
	  ul.appendChild(li);
	});
  }
  
// ——————————————————————
//  FETCH & RENDER FEEDS
// ——————————————————————
async function refreshFeeds() {
	const user = getUserData();
	const feeds = Array.isArray(user.rssFeeds) && user.rssFeeds.length > 0
	  ? user.rssFeeds
	  : defaultFeeds;
  
	const feedsContainer = document.getElementById('feed-articles');
	const forYouContainer = document.getElementById('for-you-articles');
	if (feedsContainer) feedsContainer.innerHTML = '';
	if (forYouContainer) forYouContainer.innerHTML = '';
  
	if (!feeds.length) {
	  feedsContainer.innerHTML = `<p class="hint">No feeds available.</p>`;
	  forYouContainer.innerHTML = `<p class="hint">For You is empty.</p>`;
	  return;
	}
  
	let allItems = [];
  
	for (let url of feeds) {
	  try {
		const res = await fetch(PROXY + encodeURIComponent(url));
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const xmlText = await res.text();
  
		const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
		if (doc.querySelector('parsererror')) throw new Error('Invalid XML');
  
		const title = doc.querySelector('channel > title')?.textContent
		  || doc.querySelector('feed > title')?.textContent
		  || url;
  
		const favicon = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`;
		const items = Array.from(doc.querySelectorAll('item, entry'))
		  .map(el => parseItem(el, favicon))
		  .filter(item => item?.title && item?.link);
  
		if (items.length > 0) {
		  renderFeedSection(title, items, favicon);
		  allItems = allItems.concat(items);
		} else {
		  console.warn(`[Feed Warning] No items from`, url);
		}
	  } catch (e) {
		markFeedInvalid(url);
		console.warn(`[Feed Error] ${url}`, e);
	  }
	}
  
	renderForYouSection(allItems);
	applySearch('all');
  }
  
  function parseItem(el, favicon) {
	const get = tag => el.querySelector(tag)?.textContent || '';
	const rawDesc = get('description') || get('summary') || '';
	const descText = rawDesc.replace(/<[^>]+>/g, '').slice(0, 200) + '…';
	const imgMatch = rawDesc.match(/<img[^>]+src="([^">]+)"/);
  
	const enclosure = el.querySelector('enclosure');
	const media = el.querySelector('media\\:content, content');
	const thumbnail = enclosure?.getAttribute('url')
	  || media?.getAttribute('url')
	  || imgMatch?.[1]
	  || '';
  
	const categories = Array.from(el.querySelectorAll('category'))
	  .map(c => c.textContent?.toLowerCase());
  
	return {
	  title: get('title'),
	  link: get('link') || el.querySelector('id')?.textContent,
	  description: descText,
	  date: new Date(get('pubDate') || get('updated') || Date.now()),
	  categories,
	  thumbnail,
	  favicon
	};
  }  

  function markFeedInvalid(url) {
	const li = document.querySelector(`#feed-list li[data-url="${url}"]`);
	if (li && !li.classList.contains('invalid')) {
	  li.classList.add('invalid');
	  li.title = 'Failed to load — check this URL in your settings';
	}
  }  

// ——————————————————————
//  RENDER SECTIONS & CARDS
// ——————————————————————
function renderFeedSection(title, items, favicon) {
  const sec = document.createElement('section');
  sec.innerHTML = `
    <h2>
      <img src="${favicon}" class="favicon"> ${title}
    </h2>
  `;
  const grid = document.createElement('div');
  grid.className = 'articles-grid';
  items.forEach(i => grid.appendChild(buildCard(i)));
  sec.appendChild(grid);
  document.getElementById('feed-articles')?.appendChild(sec);
}

function renderForYouSection(items) {
  const grid = document.getElementById('for-you-articles');
  if (!grid) return;
  grid.innerHTML = '';
  items
    .sort((a, b) => b.date - a.date)
    .slice(0, 20)
    .forEach(i => grid.appendChild(buildCard(i)));
}

function buildCard(item) {
  const user = getUserData();
  const starBtnSymbol = user.bookmarks?.some(b => b.link === item.link) ? '★' : '☆';
  const card = document.createElement('div');
  card.className = 'article-card';
  card.dataset.title = item.title.toLowerCase();
  card.dataset.desc  = item.description.toLowerCase();
  card.dataset.cats  = item.categories.join(',');

  const cats  = item.categories.map(c => `<span class="category-label">${c}</span>`).join('');
  const thumb = item.thumbnail
                ? `<img src="${item.thumbnail}" class="thumb">`
                : '';

  card.innerHTML = `
    ${thumb}
    <span>
    <h3><a href="#" class="headline">${item.title}</a></h3>
    <p>${item.description}</p>
    <div class="meta">
      <img src="${item.favicon}" class="favicon">
      ${cats} ${item.date.toLocaleDateString()}
      <button class="star">${starBtnSymbol}</button>
    </div>
    </span>
  `;

  card.querySelector('.star').onclick = e => {
    e.stopPropagation();
    toggleBookmark(item, e.target);
  };
  card.querySelector('.headline').onclick = e => {
    e.preventDefault();
    showArticleModal(item.link);
  };

  return card;
}

// ——————————————————————
//  FULL-ARTICLE MODAL
// ——————————————————————
// ------------------------------
// BUILD THE MODAL STRUCTURE
// ------------------------------
function buildModal() {
  const overlay = document.createElement('div');
  overlay.id = 'modal-overlay';
  overlay.style.cssText = `
    overflow-y: auto;
	z-index: -1;
  `;

  const modal = document.createElement('div');
  modal.id = 'modal-content';

  modal.innerHTML = `
    <div id="modal-header">
      <button id="modal-close" style="font-size:1.2rem;border:none;background:none;cursor:pointer;"><i class="fa-solid fa-arrow-left"></i></button>
      <img id="modal-thumb" src="" style="width:100px;height:60px;object-fit:cover;margin-right:16px;border-radius:4px;display:none;">
      <div style="flex:1;">
        <h2 id="modal-title" style="margin:0 0 4px;font-size:1.5rem;"></h2>
        <p id="modal-author" style="margin:0;font-size:0.9rem;color:#555;"></p>
        <p id="modal-date" style="margin:4px 0 0;font-size:0.8rem;color:#888;"></p>
      </div>
	  <div style="gap: 20px;">
      	<button style="font-size:1.2rem;border:none;background:none;cursor:pointer;">Share</button>
	  </div>
    </div>
    <div id="modal-news-main-welcome-title"></div>
    <div id="modal-body" style="padding:16px;font-size:1rem;line-height:1.6;color:#333;"></div>
    <div id="modal-footer" style="height:48px;display:flex;justify-content:space-between;align-items:center;position:sticky;bottom:0;margin-bottom:10px;">
		<span>
			<button onclick="togglePlayPause(); restartSpeech()"><i translate="no" class="material-symbols-rounded">text_to_speech</i></button>
		</span>
		<span>
			<button id="shareArticle"><i class="fa-solid fa-share-from-square"></i></button>
			<a href="#" target="_blank" id="openArtNew"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>
			<button id="more-art-btn" onclick="setUpContextMenuFor('newsArticle')"><i class="fa-solid fa-ellipsis"></i></button>
		</span>
    </div>
  `;

  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.getElementById('modal-close').onclick = () => { overlay.classList.remove('open'); document.querySelector('.main-cont-for-news').classList.add('open')}
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open') 
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') overlay.classList.remove('open')
  });
}

async function showArticleModal(url) {
  const overlay = document.getElementById('modal-overlay');
  const modalContent = document.getElementById('modal-content');
  const thumbEl = document.getElementById('modal-thumb');
  const titleEl = document.getElementById('modal-title');
  const authorEl = document.getElementById('modal-author');
  const dateEl = document.getElementById('modal-date');
  const bodyEl = document.getElementById('modal-body');
  const weclomeTitle = document.getElementById('modal-news-main-welcome-title');

  document.querySelector('.main-cont-for-news').classList.remove('open')
  overlay.classList.add('open');

  // Show preloader
  preloader(modalContent, true, false, 'transparent');

  // Reset modal content
  thumbEl.src = '';
  thumbEl.style.display = 'none';
  titleEl.textContent = '';
  authorEl.textContent = '';
  dateEl.textContent = '';
  bodyEl.textContent = '';


  try {
    const html = await fetch(PROXY + encodeURIComponent(url)).then(r => r.text());
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // Extract metadata
    const title = doc.querySelector('title')?.textContent || 'Article';
    const author = doc.querySelector('author')?.textContent
      || doc.querySelector('dc\\:creator')?.textContent
      || '';
    const pubDate = doc.querySelector('pubDate')?.textContent || '';
    const imageUrl = doc.querySelector('meta[property="og:image"]')?.content
      || doc.querySelector('meta[name="twitter:image"]')?.content
      || '';

    titleEl.textContent = title;
    if (author) authorEl.textContent = `By ${author}`;
    if (pubDate) dateEl.textContent = new Date(pubDate).toLocaleDateString();
    if (imageUrl) {
      thumbEl.src = imageUrl;
      thumbEl.style.display = 'block';
    }

    weclomeTitle.innerHTML = `
    <img src="${imageUrl}></img>
    <h1>${title}</h1>"
    `

    // Choose content block
    let content = doc.querySelector('article') || doc.querySelector('main') || doc.body;

    // Remove distractions
    content.querySelectorAll('script, style, noscript, header, footer, aside, nav, button, input, .ad, .ads, .sponsored, .promo, .transcript, .ad-label')
      .forEach(e => e.remove());

    // Remove unsafe links
    content.querySelectorAll('a').forEach(a => {
      const href = a.getAttribute('href');
      if (!href || !href.startsWith('https://')) {
        a.remove(); // Remove broken or unsafe link
      }
    });

    // Remove unsupported iframes
    content.querySelectorAll('iframe').forEach(frame => {
      const src = frame.getAttribute('src') || '';
      if (!/youtube|vimeo|embed|player/.test(src)) frame.remove();
    });

    // Style images
    content.querySelectorAll('img').forEach(img => {
      if (img.complete && img.naturalWidth > 0) {
        img.style.maxWidth = '100%';
        img.style.borderRadius = '6px';
        img.style.margin = '12px 0';
      } else {
        // img.remove(); // Remove broken image
      }
    });

    // Style videos
    content.querySelectorAll('video').forEach(video => {
      video.controls = true;
      video.style.maxWidth = '100%';
      video.style.margin = '16px 0';
    });

	document.getElementById('shareArticle').addEventListener('click', function() {
		share()
	})

	document.getElementById('openArtNew').href = url

    bodyEl.innerHTML = content.innerHTML;
  } catch (err) {
    bodyEl.innerHTML = `
    <div class="centered-flex">
    	<h1>Failed to load article.</h1>
		<p>Try Again or open link.</p>
		<button onclick="showArticleModal('${url}')">Try Loading Again</button>
    </div>`;
    console.error('Modal error:', err);
  }

  // Remove preloader
  preloader(modalContent, false);
}


// ——————————————————————
//  BOOKMARKS
// ——————————————————————
function toggleBookmark(item, btn) {
  const user = getUserData();
  user.bookmarks = user.bookmarks || [];
  const idx = user.bookmarks.findIndex(b => b.link === item.link);
  if (idx >= 0) {
    user.bookmarks.splice(idx, 1);
    btn.textContent = '☆';
  } else {
    user.bookmarks.push(item);
    btn.textContent = '★';
  }
  saveUserData(user);
  loadBookmarksUI();
}

function loadBookmarksUI() {
  const grid = document.getElementById('bookmark-articles');
  if (!grid) return;
  grid.innerHTML = '';
  (getUserData().bookmarks || []).forEach(i => grid.appendChild(buildCard(i)));
}

// ——————————————————————
//  SEARCH WITH SCOPE
// ——————————————————————
function handleSearchInput() {
  const term = document.getElementById('search-input')?.value.trim();
  const dd   = document.getElementById('search-dropdown');
  if (!dd) return applySearch('all');
  dd.style.display = term ? 'block' : 'none';
  ['all','foryou','feeds'].forEach(scope => {
    dd.querySelector(`[data-scope="${scope}"]`)
      .onclick = () => { dd.style.display = 'none'; applySearch(scope); };
  });
}

function applySearch(scope = 'all') {
  const term = document.getElementById('search-input')?.value.toLowerCase() || '';
  document.querySelectorAll('.article-card').forEach(card => {
    const text = `${card.dataset.title} ${card.dataset.desc} ${card.dataset.cats}`;
    const inScope = (
      scope === 'all' ||
      (scope === 'foryou' && card.closest('#for-you-articles')) ||
      (scope === 'feeds'  && card.closest('#feed-articles'))
    );
    card.style.display = inScope && text.includes(term) ? '' : 'none';
  });
}

function preloader(toElement, display, fixed, backColor) {
  if (display) {
    var newPreloader = document.createElement('section')

	newPreloader.classList.add('preloader')
	newPreloader.innerHTML = `
	<div id="wifi-loader">
    	<svg class="circle-outer" viewBox="0 0 86 86">
    	    <circle class="back" cx="43" cy="43" r="40"></circle>
    	    <circle class="front" cx="43" cy="43" r="40"></circle>
    	    <circle class="new" cx="43" cy="43" r="40"></circle>
    	</svg>
    	<svg class="circle-middle" viewBox="0 0 60 60">
    	    <circle class="back" cx="30" cy="30" r="27"></circle>
    	    <circle class="front" cx="30" cy="30" r="27"></circle>
    	</svg>
    	<svg class="circle-inner" viewBox="0 0 34 34">
        	<circle class="back" cx="17" cy="17" r="14"></circle>
        	<circle class="front" cx="17" cy="17" r="14"></circle>
    	</svg>
    	<div class="text" data-text="loading"></div>
	</div>
	`
  newPreloader.style.background =  backColor
	if (fixed) {
		newPreloader.style.position = 'fixed';
	}
	toElement.appendChild(newPreloader)
  } else {
    document.querySelectorAll('.preloader').forEach(one => {
		one.remove()
	})
  }
}

function setUpContextMenuFor(type) {
	console.log('Code Running')
  const contextMenu = document.getElementById('contextMenu');
  if (!contextMenu) return;

  // Reset content and make visible
  contextMenu.innerHTML = `
    <button onclick="document.getElementById('contextMenu').classList.remove('open')">x</button>
  `;

  if (type === 'newsArticle') {
    contextMenu.innerHTML += `
      <h3 style="margin-top:0;">Article Settings</h3>
      <context-m-cont-2>
        <h4>Font Family</h4>
        <select id="fontSelect" onchange="saveNewsSettings({ fontFamily: this.value })">
            <option value="Arial">Arial</option>
            <option value="News Cycle">News Cycle</option>
            <option value="Noticia Text">Noticia Text</option>
            <option value="Open Sans">Open Sans</option>
            <option value="Poppins">Poppins</option>
            <option value="Roboto">Roboto</option>
        </select>
    </context-m-cont-2>
	  <h3>Font Size</h3>
	  <context-m-cont-2><input type="range" min="1" max="2" step="0.1" value="${loadNewsSettings().fontSize}" onchange="saveNewsSettings({fontSize: this.value})"></context-m-cont-2>
	  <context-m-cont-2>
	  <h3>Full Screen Article</h3>
        <label class="switch"><input type="checkbox" onchange="saveNewsSettings({fullScreenArticle: this.checked})" ${loadNewsSettings().fullScreenArticle ? 'checked' : ''}><span class="slider"></span></label>
    </context-m-cont-2>
    `;
	document.getElementById('fontSelect').value = loadNewsSettings().fontFamily;
  }
  
  contextMenu.classList.add('open');
}

function loadNewsSettings() {
  const user = getUserData();
  // Ensure there's always a settings object
  user.settings = user.settings || {
    theme: 'light',
    fontFamily: 'Poppins',
	fontSize: '1',
	fullScreenArticle: false,
  };
  return user.settings;
}

setInterval(function() {
	var settings = loadNewsSettings();

	document.getElementById('modal-body').style.fontSize = settings.fontSize + 'rem'
	document.getElementById('modal-body').style.fontFamily = settings.fontFamily
	if (settings.fullScreenArticle) {
		document.getElementById('modal-content').classList.add('fit-screen');
	} else {
		document.getElementById('modal-content').classList.remove('fit-screen');
	}

}, 1000)

function saveNewsSettings(updates) {
  const user = getUserData();
  user.settings = Object.assign({}, user.settings, updates);
  saveUserData(user);
}

let speechUtterance = null;
let voices = [];
let progressTimer = null;
let totalDuration = 0;
let elapsedTime = 0;

function populateVoices() {
  voices = speechSynthesis.getVoices();
  const select = document.getElementById('voiceSelect');
  select.innerHTML = '';
  voices.forEach((v, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${v.name} (${v.lang})`;
    select.appendChild(opt);
  });
}
speechSynthesis.onvoiceschanged = populateVoices;

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function updateSeekUI() {
  const slider = document.getElementById('seekSlider');
  slider.max = totalDuration;
  slider.value = elapsedTime;
  document.getElementById('seekLabel').textContent =
    `${formatTime(elapsedTime)} / ${formatTime(totalDuration)}`;
}

function startProgressTimer() {
  clearInterval(progressTimer);
  progressTimer = setInterval(() => {
    elapsedTime++;
    updateSeekUI();
    if (elapsedTime >= totalDuration) {
      clearInterval(progressTimer);
    }
  }, 1000);
  document.getElementById('speech-article-title').innerHTML = document.getElementById('modal-title').innerText;
  document.getElementById('speech-bar').classList.add('open')
}

function togglePlayPause() {
  const btn = document.getElementById('playPauseBtn');
  const text = document.getElementById('modal-body')?.innerText || '';
  const speed = parseFloat(document.getElementById('speedSlider').value);
  const voiceIndex = parseInt(document.getElementById('voiceSelect').value, 10);

  if (!speechSynthesis.speaking) {
    // Fresh playback
    const wordCount = text.split(/\s+/).length;
    totalDuration = Math.ceil((wordCount / 2) / speed);
    elapsedTime = 0;

    speechUtterance = new SpeechSynthesisUtterance(text);
    speechUtterance.rate = speed;
    speechUtterance.voice = voices[voiceIndex];
    speechUtterance.onend = () => {
      clearInterval(progressTimer);
      elapsedTime = totalDuration;
      updateSeekUI();
      btn.innerHTML = '▶️';
    };

    speechSynthesis.cancel();
    speechSynthesis.speak(speechUtterance);
    updateSeekUI();
    startProgressTimer();
    btn.innerHTML = '⏸️';
  } else if (speechSynthesis.paused) {
    speechSynthesis.resume();
    startProgressTimer();
    btn.innerHTML = '⏸️';
  } else {
    speechSynthesis.pause();
    clearInterval(progressTimer);
    btn.innerHTML = '▶️';
  }
}

function restartSpeech() {
  const btn = document.getElementById('playPauseBtn');
  speechSynthesis.cancel();
  clearInterval(progressTimer);
  elapsedTime = 0;
  btn.textContent = '▶️';
  togglePlayPause();
}

document.getElementById('seekSlider').addEventListener('change', (e) => {
  const targetTime = parseInt(e.target.value, 10);
  const text = document.getElementById('modal-body')?.innerText || '';
  const speed = parseFloat(document.getElementById('speedSlider').value);
  const voiceIndex = parseInt(document.getElementById('voiceSelect').value, 10);

  const words = text.split(/\s+/);
  const startWord = Math.floor(targetTime * speed * 2);
  const slicedText = words.slice(startWord).join(' ');

  speechSynthesis.cancel();
  clearInterval(progressTimer);

  speechUtterance = new SpeechSynthesisUtterance(slicedText);
  speechUtterance.rate = speed;
  speechUtterance.voice = voices[voiceIndex];
  speechUtterance.onend = () => {
    clearInterval(progressTimer);
    elapsedTime = totalDuration;
    updateSeekUI();
    document.getElementById('playPauseBtn').textContent = '▶️';
  };

  speechSynthesis.speak(speechUtterance);
  elapsedTime = targetTime;
  updateSeekUI();
  startProgressTimer();
  document.getElementById('playPauseBtn').textContent = '⏸️';
});

window.addEventListener('beforeunload', () => {
  if (speechSynthesis.speaking && !speechSynthesis.paused) {
    speechSynthesis.pause();
  }
});

function setURLParam(name, value) {
    const currentUrl = new URL(window.location.href);

    currentUrl.searchParams.set(name, value);
    window.history.pushState({}, '', currentUrl);
}

function openNewsSettings(section = 'home') {
  // Code coming soon
}