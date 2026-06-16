// script.js

// ── In-Memory Classes & Overrides ─────────────────────────────
let classesList = [
  { id: 1, name: 'FRSH/SOPH PE', duration: 58, period: 1 },
  { id: 2, name: 'CODING MATH', duration: 58, period: 2 },
  { id: 3, name: 'INTERGATED MATH 1', duration: 58, period: 3 },
  { id: 4, name: 'BIO LIVING EARTH', duration: 58, period: 4 },
  { id: 5, name: 'GEOGRAPHY', duration: 58, period: 5 },
  { id: 6, name: 'PACE ENG 09', duration: 58, period: 6 }
];
let overrideList = []; // {id,target,type,key,duration}

// ── IndexedDB Setup for Logs & Config ─────────────────────────
const DB_NAME = 'academicViewer', DB_VER = 1;
let db;
window.addEventListener('DOMContentLoaded', init);

async function init() {
  await openDB();
  await ensureDefaultConfig();
  initSettings();
  initOverview();
  initClasses();
  initCalendar();
  renderCalendar();
}

// Create stores: config + 3 log stores
function openDB() {
  return new Promise((res, rej) => {
    const rq = indexedDB.open(DB_NAME, DB_VER);
    rq.onupgradeneeded = e => {
      const D = e.target.result;
      if (!D.objectStoreNames.contains('config'))
        D.createObjectStore('config', { keyPath:'key' });
      ['assignments','assessments','notes']
        .forEach(s => {
          if (!D.objectStoreNames.contains(s))
            D.createObjectStore(s, { keyPath:'id', autoIncrement:true });
        });
    };
    rq.onsuccess  = () => { db = rq.result; res(); };
    rq.onerror    = () => rej(rq.error);
  });
}

// minimal CRUD
const save    = (s,o) => new Promise(r=>{
  const tx = db.transaction(s,'readwrite');
  tx.objectStore(s).put(o);
  tx.oncomplete = () => r();
});
const getAll  = s   => new Promise(r=>{
  try {
    const rq = db.transaction(s,'readonly').objectStore(s).getAll();
    rq.onsuccess = ()=>r(rq.result||[]);
  } catch { r([]); }
});
const getEntry= (s,k) => new Promise(r=>{
  try {
    const rq = db.transaction(s,'readonly').objectStore(s).get(k);
    rq.onsuccess = ()=>r(rq.result||null);
  } catch { r(null); }
});
const del     = (s,k) => new Promise(r=>{
  const tx = db.transaction(s,'readwrite');
  tx.objectStore(s).delete(k);
  tx.oncomplete = ()=>r();
});

// ── Settings & Overview (Year/Week/Day + Notes) ───────────────
async function ensureDefaultConfig() {
  if (!await getEntry('config','dateRange'))
    await save('config',{ key:'dateRange', value:{ start:'2025-08-18', end:'2026-06-11' }});
  if (!await getEntry('config','options'))
    await save('config',{ key:'options',   value:{ includeWeekends:false, holidays:[] }});
  if (!await getEntry('config','overviewNotes'))
    await save('config',{ key:'overviewNotes', value:'' });
}

function initSettings() {
  // open/close popup
  document.getElementById('settings-btn').onclick =
    () => toggleClass(settPop,'open');

  // tab nav
  const tabs = document.querySelectorAll('.sidebar button');
  const pans = document.querySelectorAll('.panel');
  tabs.forEach((t,i) => t.onclick = ()=>{
    tabs.forEach(x=>x.classList.remove('active'));
    pans.forEach(x=>x.classList.add('hidden'));
    t.classList.add('active');
    pans[i].classList.remove('hidden');
  });

  // load saved
  Promise.all([
    getEntry('config','dateRange'),
    getEntry('config','options'),
    getEntry('config','overviewNotes')
  ]).then(([dr,opt,on]) => {
    if (dr) {
      document.getElementById('cfg-start').value = dr.value.start;
      document.getElementById('cfg-end')  .value = dr.value.end;
    }
    if (opt) {
      document.getElementById('cfg-weekends').checked = opt.value.includeWeekends;
      document.getElementById('cfg-holidays').value   = opt.value.holidays.join(',');
    }
    if (on) document.getElementById('overview-notes').value = on.value;
  });

  // save settings
  document.getElementById('save-config').onclick = async () => {
    const start  = document.getElementById('cfg-start').value;
    const end    = document.getElementById('cfg-end').value;
    const includeWeekends = document.getElementById('cfg-weekends').checked;
    const holidays = document.getElementById('cfg-holidays').value
        .split(',').map(s=>s.trim()).filter(Boolean);

    await save('config',{ key:'dateRange', value:{ start,end }});
    await save('config',{ key:'options',   value:{ includeWeekends, holidays }});
    toggleClass(settPop,'open');
    initOverview();
    renderCalendar();
  };
}

// Year / week / day progress + notes
async function initOverview() {
  const dr = await getEntry('config','dateRange');
  if (!dr) return;
  const { start,end } = dr.value;
  const s = new Date(start), e = new Date(end), now = new Date();
  const totalDays = Math.floor((e-s)/86400000)+1;
  const dayIdx    = Math.min(totalDays, Math.floor((now-s)/86400000)+1);
  const weekCount = Math.ceil(totalDays/7);
  const pct       = Math.floor(dayIdx/totalDays*100);

  document.querySelector('#year-progress-bar .fill').style.width = pct+'%';
  document.getElementById('year-progress-text').textContent = pct+'%';
  document.getElementById('week-info').textContent = `Week ${Math.ceil(dayIdx/7)} / ${weekCount}`;
  document.getElementById('day-info').textContent  = `Day ${dayIdx} / ${totalDays}`;

  // notes
  const ta = document.getElementById('overview-notes');
  if (!ta.dataset.bound) {
    ta.dataset.bound = 1;
    ta.onblur = ()=> save('config',{ key:'overviewNotes', value:ta.value });
  }
}

// ── Classes List & Detail Sections ────────────────────────────
function initClasses() {
  document.getElementById('add-class').onclick = showAddClassForm;
  renderClasses();
}

function showAddClassForm() {
  const sec = document.getElementById('classes-section');
  if (sec.querySelector('.add-class-form')) return;
  const f = document.createElement('div');
  f.className = 'add-class-form';
  f.innerHTML = `
    <input id="c-name" placeholder="Name"/>
    <input id="c-dur"  type="number" placeholder="Duration"/>
    <input id="c-pr"   type="number" placeholder="Period #" min=1 max=12/>
    <button id="c-save">Save</button>
    <button id="c-cancel">Cancel</button>
  `;
  sec.prepend(f);
  f.querySelector('#c-save').onclick = ()=>{
    const n = f.querySelector('#c-name').value.trim();
    const d = Number(f.querySelector('#c-dur').value);
    const p = Number(f.querySelector('#c-pr').value);
    if (!n||!d||!p) return;
    classesList.push({ id:Date.now(), name:n, duration:d, period:p });
    classesList.sort((a,b)=>a.period-b.period);
    f.remove(); renderClasses();
  };
  f.querySelector('#c-cancel').onclick = ()=> f.remove();
}

async function renderClasses() {
    const ul = document.getElementById('classes-list');
    ul.innerHTML = '';
  
    for (const c of classesList) {
      const det = document.createElement('details');
      const sum = document.createElement('summary');
      sum.innerHTML = `P${c.period}: ${c.name} (${c.duration}m)
        <button class="overview-btn">Weekly Overview</button>`;
      det.appendChild(sum);
  
      // Overview button
      sum.querySelector('.overview-btn').onclick =
        () => showWeeklyOverview(c.period);
  
      // Build content
      const content = document.createElement('div');
      content.className = 'class-content';
  
      for (const store of ['assignments', 'assessments', 'notes']) {
        const title = store === 'assessments' ? 'Quiz/Tests' : store[0].toUpperCase() + store.slice(1);
        content.innerHTML += `
          <h3>${title}
            <button class="add-btn" data-store="${store}" data-class="${c.id}">+</button>
          </h3>
          <ul class="${store}-${c.id}"></ul>`;
      }
  
      det.appendChild(content);
      ul.appendChild(det);
  
      // Bind add buttons
      for (const store of ['assignments', 'assessments', 'notes']) {
        content.querySelector(`[data-store="${store}"]`).onclick = async () => {
          const val = prompt(`New ${store.slice(0, -1)}:`)?.trim();
          if (!val) return;
          const obj = {
            id: Date.now(),
            classId: c.id,
            date: new Date().toISOString().slice(0, 10)
          };
          if (store === 'notes') obj.content = val;
          else obj.title = val;
          await save(store, obj);
          await renderClassSectionItems(c.id, store);
        };
  
        // ✅ Render items with delete buttons
        await renderClassSectionItems(c.id, store);
      }
    }
  }

  
  async function renderClassSectionItems(classId, storeName) {
    const listEl = document.querySelector(`.${storeName}-${classId}`);
    if (!listEl) return;
  
    listEl.innerHTML = '';
    const items = (await getAll(storeName)).filter(it => it.classId === classId);
  
    for (const item of items) {
      const li = document.createElement('li');
      const text = storeName === 'notes'
        ? item.content
        : `${item.date || ''} ${item.title || ''}`;
      li.textContent = text;
  
      // Add delete button
      const delBtn = document.createElement('button');
      delBtn.textContent = '🗑️';
      delBtn.style.marginLeft = '8px';
      delBtn.onclick = async () => {
        await del(storeName, item.id);
        await renderClassSectionItems(classId, storeName);
      };
  
      li.appendChild(delBtn);
      listEl.appendChild(li);
    }
  }
  

// ── Weekly Overview Modal ──────────────────────────────────────
async function showWeeklyOverview(periodNum) {
  // compute week range
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const start = new Date(today); start.setDate(today.getDate()-dayOfWeek);
  const end   = new Date(today); end.setDate(today.getDate()+(6-dayOfWeek));

  // gather items
  const assigns = (await getAll('assignments')).filter(a=>{
    const d=new Date(a.date); return d>=start&&d<=end && classesList.find(c=>c.id===a.classId)?.period===periodNum;
  });
  const assesses= (await getAll('assessments')).filter(a=>{
    const d=new Date(a.date); return d>=start&&d<=end && classesList.find(c=>c.id===a.classId)?.period===periodNum;
  });

  // build modal
  let modal = document.getElementById('weekly-overview');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'weekly-overview';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <button id="wo-close">✖️</button>
        <h2>Week Overview: Period ${periodNum}</h2>
        <h3>Assignments</h3><ul id="wo-assign"></ul>
        <h3>Quiz/Tests</h3><ul id="wo-assess"></ul>
      </div>`;
    document.body.appendChild(modal);
    document.getElementById('wo-close').onclick = () => modal.classList.remove('open');
  }

  // populate lists
  const aEl = modal.querySelector('#wo-assign');
  const qEl = modal.querySelector('#wo-assess');
  aEl.innerHTML = assigns.map(a=>`<li>${a.date} ${a.title}</li>`).join('') || '<li>—</li>';
  qEl.innerHTML = assesses.map(a=>`<li>${a.date} ${a.title}</li>`).join('')||'<li>—</li>';

  modal.classList.add('open');
}

// ── Calendar (today’s month) ──────────────────────────────────
let currentMonth, currentYear;
async function initCalendar() {
  const now = new Date();
  currentMonth = now.getMonth();
  currentYear  = now.getFullYear();
  document.getElementById('prev-month').onclick = async ()=>{
    currentMonth--; if(currentMonth<0){currentMonth=11;currentYear--;}
    renderCalendar();
  };
  document.getElementById('next-month').onclick = async ()=>{
    currentMonth++; if(currentMonth>11){currentMonth=0;currentYear++;}
    renderCalendar();
  };
}

async function renderCalendar() {
  const cal = document.getElementById('calendar');
  const title = document.getElementById('calendar-title');
  const dr = (await getEntry('config','dateRange'))?.value;
  const opts = (await getEntry('config','options'))?.value || {};
  if (!cal||!title) return;
  title.textContent = new Date(currentYear, currentMonth)
    .toLocaleString('default',{month:'long',year:'numeric'});
  cal.innerHTML = '';

  // headers
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d=>{
    const wd = document.createElement('div'); wd.className='weekday'; wd.textContent=d;
    cal.appendChild(wd);
  });

  // pad first week
  const fd = new Date(currentYear,currentMonth,1).getDay();
  for (let i=0; i<fd; i++) cal.appendChild(Object.assign(document.createElement('div'),{ className:'pad-day'}));

  const days = new Date(currentYear,currentMonth+1,0).getDate();
  const todayStr = new Date().toDateString();
  const holidays = dr?.holidays||dr?.options?.holidays||[];

  for (let d=1; d<=days; d++) {
    const dt = new Date(currentYear,currentMonth,d);
    const iso = dt.toISOString().slice(0,10);
    const cell = document.createElement('div');
    cell.className = 'day';
    cell.textContent = d;
    // out of term
    if (dr && (dt < new Date(dr.start)||dt>new Date(dr.end)))
      cell.style.opacity = .3;
    // weekend
    if (!opts.includeWeekends && [0,6].includes(dt.getDay()))
      cell.classList.add('weekend');
    // holiday
    if (holidays.includes(iso)) cell.classList.add('holiday');
    // today
    if (dt.toDateString()===todayStr) cell.classList.add('today');

    // badge counts
    const a = (await getAll('assignments')).filter(x=>x.date===iso).length;
    const q = (await getAll('assessments')).filter(x=>x.date===iso).length;
    const n = (await getAll('notes')).filter(x=>x.date===iso).length;

    let totalMin = 0;
    for (const cls of classesList) {
      let dur = cls.duration || 0;

      // apply overrides
      for (const ovr of overrideList) {
        const matchTarget = ovr.target === 'all' || String(ovr.target) === String(cls.id);
        const matchKey = ovr.type === 'date'
          ? ovr.key === iso
          : new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(dt) === ovr.key;
        if (matchTarget && matchKey) dur = ovr.duration;
      }

      // skip if weekend/holiday
      if (!opts.includeWeekends && [0, 6].includes(dt.getDay())) dur = 0;
      if (holidays.includes(iso)) dur = 0;

      totalMin += dur;
    }

    const info = document.createElement('div');
    info.className='date-info';
    info.innerHTML = `<span>${totalMin}m</span><span>${a}✏️</span><span>${q}🏆</span><span>${n}🗒️</span>`;
    cell.appendChild(info);

    cal.appendChild(cell);
  }

  // pad last week
  const total = fd + days;
  const trail = (7 - (total % 7)) % 7;
  for (let i=0; i<trail; i++)
    cal.appendChild(Object.assign(document.createElement('div'),{ className:'pad-day'}));
}

// ── Helpers ───────────────────────────────────────────────────
function toggleClass(el,cls) {
  if (!el) return;
  el.classList.toggle(cls);
}
