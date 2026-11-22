const KEY = 'nyushuttle.v1';
const DIRECTIONS = {
  'dorm-campus': 'Dorms → Campus',
  'campus-dorm': 'Campus → Dorms'
};
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DEFAULT = { buses: { weekday: {'dorm-campus': [], 'campus-dorm': []}, saturday: {'dorm-campus': [], 'campus-dorm': []}, sunday: {'dorm-campus': [], 'campus-dorm': []} }, classes: [], reminders: true };
let data = loadData();
let selectedDay = 'weekday';
let deferredInstall = null;

function loadData() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || 'null');
    return stored ? {...structuredClone(DEFAULT), ...stored, buses: {...DEFAULT.buses, ...(stored.buses || {})}} : structuredClone(DEFAULT);
  } catch { return structuredClone(DEFAULT); }
}
function saveData() { localStorage.setItem(KEY, JSON.stringify(data)); render(); }
function esc(value) { return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function minutes(value) { const [h,m] = value.split(':').map(Number); return h * 60 + m; }
function formatDay(date) { return DAY_NAMES[date.getDay()]; }
function daySchedule(day) { return day === 0 ? 'sunday' : day === 6 ? 'saturday' : 'weekday'; }
function upcomingClasses(limit=12) {
  const now = new Date();
  return data.classes.map(cls => {
    let date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    let delta = (Number(cls.day) - date.getDay() + 7) % 7;
    date.setDate(date.getDate() + delta);
    const [h,m] = cls.time.split(':').map(Number); date.setHours(h,m,0,0);
    if (date <= now) date.setDate(date.getDate() + 7);
    const buses = (data.buses[daySchedule(date.getDay())]?.[cls.direction] || []).slice().sort((a,b) => minutes(a)-minutes(b));
    const options = buses.filter(t => minutes(t) < minutes(cls.time)).slice(-3).reverse();
    return {...cls, date, options, last: options[0] || null};
  }).sort((a,b) => a.date-b.date).slice(0,limit);
}
function renderUpcoming() {
  const items = upcomingClasses(3);
  const container = document.getElementById('upcoming');
  document.getElementById('emptyUpcoming').hidden = items.length > 0;
  container.innerHTML = items.map(item => {
    const d = item.date;
    const label = d.toDateString() === new Date().toDateString() ? 'TODAY' : `${SHORT_DAYS[d.getDay()]} · ${d.toLocaleDateString(undefined,{month:'short',day:'numeric'})}`;
    if (!item.last) return `<article class="ride-card"><div class="ride-day">${label}</div><div class="ride-class">${esc(item.name)} · ${esc(item.time)}</div><div class="ride-empty">No earlier departures saved for ${esc(DIRECTIONS[item.direction])}.</div></article>`;
    const alternatives = item.options.map(t => `<span>${esc(t)}</span>`).join('<span>·</span>');
    return `<article class="ride-card featured"><div class="ride-top"><span class="ride-day">${label}</span><span class="badge">LAST BUS</span></div><div class="ride-class">${esc(item.name)} · ${esc(item.time)}</div><strong class="bus-time">${esc(item.last)}</strong><div class="ride-bottom"><span>${esc(DIRECTIONS[item.direction])}</span><span class="choices">${alternatives}</span></div></article>`;
  }).join('');
}
function renderTimetable() {
  const dir = document.getElementById('directionSelect').value;
  const times = data.buses[selectedDay]?.[dir] || [];
  document.getElementById('timetable').innerHTML = times.length ? times.map(t => `<span class="time-pill">${esc(t)}</span>`).join('') : '<span class="no-times">No times saved yet. Add the real timetable below.</span>';
  document.getElementById('busTimes').value = times.join(', ');
}
function renderClasses() {
  const list = document.getElementById('classList');
  if (!data.classes.length) { list.innerHTML = '<p class="class-empty">Your classes will appear here after you add them.</p>'; return; }
  list.innerHTML = data.classes.slice().sort((a,b) => Number(a.day)-Number(b.day) || a.time.localeCompare(b.time)).map(cls => `<div class="class-row"><span class="class-day-box">${SHORT_DAYS[Number(cls.day)]}<br>${esc(cls.time)}</span><div class="class-row-main"><strong>${esc(cls.name)}</strong><span>${esc(DIRECTIONS[cls.direction])}</span></div><button class="class-remove" data-remove="${esc(cls.id)}" aria-label="Remove ${esc(cls.name)}">×</button></div>`).join('');
  list.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => { data.classes = data.classes.filter(c => c.id !== btn.dataset.remove); saveData(); }));
}
function render() {
  const now = new Date();
  document.getElementById('todayLabel').textContent = now.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'}).toUpperCase();
  renderUpcoming(); renderTimetable(); renderClasses();
  const status = document.getElementById('notificationStatus');
  const button = document.getElementById('notifyButton');
  if (!('Notification' in window)) { status.textContent = 'This browser does not support notifications.'; button.hidden = true; }
  else if (Notification.permission === 'granted') { status.textContent = 'Reminders are on while this app is open.'; button.textContent = 'On'; button.disabled = true; }
  else if (Notification.permission === 'denied') { status.textContent = 'Notifications are blocked in browser settings.'; button.textContent = 'Blocked'; button.disabled = true; }
  else { status.textContent = 'Get a heads-up 10 minutes before your last bus.'; button.textContent = 'Enable'; button.disabled = false; }
}
function parseTimes(raw) {
  const matches = raw.match(/(?:[01]?\d|2[0-3]):[0-5]\d/g) || [];
  return [...new Set(matches.map(t => t.padStart(5,'0')))].sort((a,b)=>minutes(a)-minutes(b));
}
function checkReminders() {
  if (!('Notification' in window) || Notification.permission !== 'granted' || !data.reminders) return;
  const now = new Date();
  const stamp = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  for (const item of upcomingClasses(10)) {
    if (!item.last || item.date.toDateString() !== now.toDateString()) continue;
    const departure = new Date(now.getFullYear(),now.getMonth(),now.getDate(),Number(item.last.slice(0,2)),Number(item.last.slice(3)),0,0);
    const remindAt = departure.getTime() - 10*60*1000;
    const key = `nyushuttle.reminded.${stamp}.${item.id}.${item.last}`;
    if (now.getTime() >= remindAt && now.getTime() < remindAt + 60000 && !localStorage.getItem(key)) {
      new Notification(`Time to head to the ${item.last} shuttle`, {body:`${item.name} starts at ${item.time}. This is the last saved bus before class.`, icon:new URL('icon.svg', location.href).href, tag:key});
      localStorage.setItem(key,'1');
    }
  }
}

document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
  selectedDay = tab.dataset.day;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
  renderTimetable();
}));
document.getElementById('directionSelect').addEventListener('change', renderTimetable);
document.getElementById('saveBusTimes').addEventListener('click', () => {
  const times = parseTimes(document.getElementById('busTimes').value);
  data.buses[selectedDay] ||= {'dorm-campus':[], 'campus-dorm':[]};
  data.buses[selectedDay][document.getElementById('directionSelect').value] = times;
  saveData();
  document.getElementById('importStatus').textContent = `${times.length} departure${times.length===1?'':'s'} saved for ${selectedDay} · ${DIRECTIONS[document.getElementById('directionSelect').value]}.`;
});
document.getElementById('classForm').addEventListener('submit', e => {
  e.preventDefault();
  data.classes.push({id:crypto.randomUUID(), name:document.getElementById('className').value.trim(), day:document.getElementById('classDay').value, time:document.getElementById('classTime').value, direction:document.getElementById('classDirection').value});
  e.target.reset(); saveData();
});
document.getElementById('notifyButton').addEventListener('click', async () => {
  if (!('Notification' in window)) return;
  const permission = await Notification.requestPermission();
  if (permission === 'granted') { data.reminders = true; saveData(); }
  else render();
});
document.querySelectorAll('[data-scroll]').forEach(btn => btn.addEventListener('click', () => document.getElementById(btn.dataset.scroll).scrollIntoView({behavior:'smooth'})));

async function readUpload(file, statusNode) {
  if (!file) return;
  statusNode.textContent = 'Reading the file…';
  try {
    let text = '';
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const pdfjs = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
      const pdf = await pdfjs.getDocument({data:await file.arrayBuffer()}).promise;
      for (let page=1; page<=pdf.numPages; page++) {
        const content = await (await pdf.getPage(page)).getTextContent();
        text += ' ' + content.items.map(item=>item.str).join(' ');
      }
    } else {
      const { createWorker } = await import('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js');
      const worker = await createWorker('eng');
      const result = await worker.recognize(file); text = result.data.text; await worker.terminate();
    }
    const times = parseTimes(text);
    if (!times.length) { statusNode.textContent = 'No clock times found. Please enter the times manually below.'; return; }
    if (statusNode.id === 'importStatus') {
      document.getElementById('busTimes').value = times.join(', ');
      statusNode.textContent = `Found ${times.length} clock times. Review the list above; only save it if this page and direction match.`;
      document.getElementById('busTimes').scrollIntoView({behavior:'smooth',block:'center'});
    } else {
      const box = document.createElement('div');
      box.className = 'detected-times';
      box.innerHTML = `<span>Detected times · tap one to add it as a class start</span><div>${times.map(t=>`<button type="button" class="time-pill detected" data-time="${t}">${t}</button>`).join('')}</div>`;
      statusNode.replaceChildren(box);
      box.querySelectorAll('[data-time]').forEach(button => button.addEventListener('click',()=>{document.getElementById('classTime').value=button.dataset.time;document.getElementById('className').focus();}));
    }
  } catch (error) {
    console.warn(error);
    statusNode.textContent = 'Could not read that file. Times can still be entered manually.';
  }
}
document.getElementById('timetableFile').addEventListener('change', e => readUpload(e.target.files[0],document.getElementById('importStatus')));
document.getElementById('classFile').addEventListener('change', e => readUpload(e.target.files[0],document.getElementById('classImportStatus')));
for (const [inputId, previewId] of [['timetableFile','timetablePreview'],['classFile','classPreview']]) {
  document.getElementById(inputId).addEventListener('change', e => {
    const file = e.target.files[0], preview = document.getElementById(previewId);
    preview.replaceChildren();
    if (!file) return;
    const url = URL.createObjectURL(file);
    const link = document.createElement('a'); link.href=url; link.target='_blank'; link.rel='noopener'; link.textContent=`Open ${file.name} to check the original schedule`;
    preview.append(link);
    if (file.type.startsWith('image/')) { const image=document.createElement('img'); image.src=url; image.alt='Uploaded schedule preview'; preview.append(image); }
  });
}
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredInstall = event; document.getElementById('installButton').hidden = false; });
document.getElementById('installButton').addEventListener('click', async () => { if (!deferredInstall) return; deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; });
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});
render(); setInterval(checkReminders,15000); checkReminders();
