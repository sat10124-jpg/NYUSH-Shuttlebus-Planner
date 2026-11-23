const KEY = 'nyushuttle.v1';
const DIRECTIONS = {
  'dorm-campus': 'Dorms → Campus',
  'campus-dorm': 'Campus → Dorms'
};
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const WEEKDAY_TO_CAMPUS = ['07:30','07:45','08:00','08:30','08:45','09:00','09:15','09:30','10:00','10:30','10:45','11:00','11:30','12:15','13:00','13:45','15:15','16:45','17:30','18:15','19:30'];
const WEEKDAY_TO_DORMS = ['09:45','11:30','12:45','13:30','14:15','15:00','15:45','16:15','16:45','17:00','17:15','17:45','18:15','18:45','19:15','19:45','20:15','20:45','21:00','21:15','21:30','21:45','22:00','22:15','22:30','22:45','23:00'];
const WEEKEND_TO_CAMPUS = ['09:00','09:30','10:30','11:30','12:45','14:00','16:30'];
const WEEKEND_TO_DORMS = ['11:00','16:00','17:45','18:45','19:45','20:15','20:45'];
const DEFAULT = { buses: {
  weekday: {'dorm-campus': WEEKDAY_TO_CAMPUS, 'campus-dorm': WEEKDAY_TO_DORMS},
  saturday: {'dorm-campus': WEEKEND_TO_CAMPUS, 'campus-dorm': WEEKEND_TO_DORMS},
  sunday: {'dorm-campus': WEEKEND_TO_CAMPUS, 'campus-dorm': WEEKEND_TO_DORMS}
}, classes: [], reminders: true };
let data = loadData();
let selectedDay = 'weekday';
let deferredInstall = null;

function loadData() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!stored) return structuredClone(DEFAULT);
    const merged = {...structuredClone(DEFAULT), classes: (stored.classes || []).map(cls => ({
      ...cls,
      days: (cls.days || [cls.day]).map(Number).filter(day => Number.isInteger(day) && day >= 0 && day <= 6)
    }))};
    return merged;
  } catch { return structuredClone(DEFAULT); }
}
function saveData() { localStorage.setItem(KEY, JSON.stringify({classes:data.classes, reminders:data.reminders})); render(); }
function esc(value) { return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function minutes(value) { const [h,m] = value.split(':').map(Number); return h * 60 + m; }
function formatDay(date) { return DAY_NAMES[date.getDay()]; }
function daySchedule(day) { return day === 0 ? 'sunday' : day === 6 ? 'saturday' : 'weekday'; }
function upcomingClasses(limit=12) {
  const now = new Date();
  return data.classes.flatMap(cls => (cls.days || []).map(day => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const delta = (Number(day) - date.getDay() + 7) % 7;
    date.setDate(date.getDate() + delta);
    const [h,m] = cls.time.split(':').map(Number); date.setHours(h,m,0,0);
    if (date <= now) date.setDate(date.getDate() + 7);
    const buses = (data.buses[daySchedule(date.getDay())]?.[cls.direction] || []).slice().sort((a,b) => minutes(a)-minutes(b));
    const options = buses.filter(t => minutes(t) < minutes(cls.time)).slice(-3).reverse();
    return {...cls, day:Number(day), date, options, last: options[0] || null};
  })).sort((a,b) => a.date-b.date).slice(0,limit);
}
function renderUpcoming() {
  const items = upcomingClasses(3);
  const container = document.getElementById('upcoming');
  document.getElementById('emptyUpcoming').hidden = items.length > 0;
  container.innerHTML = items.map(item => {
    const d = item.date;
    const label = d.toDateString() === new Date().toDateString() ? 'TODAY' : `${SHORT_DAYS[d.getDay()]} · ${d.toLocaleDateString(undefined,{month:'short',day:'numeric'})}`;
    if (!item.last) return `<article class="ride-card"><div class="ride-day">${label}</div><div class="ride-class">${esc(item.name)} · ${esc(item.time)}</div><div class="ride-empty">No earlier departures saved for ${esc(DIRECTIONS[item.direction])}.</div></article>`;
    const alternatives = item.options.slice(1).map(t => `<span>${esc(t)}</span>`).join('<span>·</span>');
    return `<article class="ride-card featured"><div class="ride-top"><span class="ride-day">${label}</span><span class="badge">LAST BUS</span></div><div class="ride-class">${esc(item.name)} · ${esc(item.time)}</div><strong class="bus-time">${esc(item.last)}</strong><div class="ride-bottom"><span>${esc(DIRECTIONS[item.direction])}</span><span class="choices">${alternatives}</span></div></article>`;
  }).join('');
}
function renderTimetable() {
  const dir = document.getElementById('directionSelect').value;
  const times = data.buses[selectedDay]?.[dir] || [];
  document.getElementById('timetable').innerHTML = times.map(t => `<span class="time-pill">${esc(t)}</span>`).join('');
}
function renderClasses() {
  const list = document.getElementById('classList');
  if (!data.classes.length) { list.innerHTML = '<p class="class-empty">Your classes will appear here after you add them.</p>'; return; }
  list.innerHTML = data.classes.slice().sort((a,b) => (a.days[0] ?? 0)-(b.days[0] ?? 0) || a.time.localeCompare(b.time)).map(cls => `<div class="class-row"><span class="class-day-box">${classDaysLabel(cls.days)}<br>${esc(cls.time)}</span><div class="class-row-main"><strong>${esc(cls.name)}</strong><span>${esc(DIRECTIONS[cls.direction])}</span></div><button class="class-remove" data-remove="${esc(cls.id)}" aria-label="Remove ${esc(cls.name)}">×</button></div>`).join('');
  list.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => { data.classes = data.classes.filter(c => c.id !== btn.dataset.remove); saveData(); }));
}
function classDaysLabel(days) {
  const sorted = [...days].sort((a,b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));
  if ([1,2,3,4,5].every(day => sorted.includes(day)) && sorted.length === 5) return 'MON–FRI';
  return sorted.map(day => SHORT_DAYS[day]).join(', ');
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
document.getElementById('classForm').addEventListener('submit', e => {
  e.preventDefault();
  const days = [...document.querySelectorAll('input[name="classDays"]:checked')].map(input => Number(input.value));
  if (!days.length) { document.getElementById('dayError').textContent = 'Choose at least one day.'; return; }
  data.classes.push({id:crypto.randomUUID(), name:document.getElementById('className').value.trim(), days, time:document.getElementById('classTime').value, direction:document.getElementById('classDirection').value});
  e.target.reset(); saveData();
});
document.querySelectorAll('[data-weekdays]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('input[name="classDays"]').forEach(input => { input.checked = Number(input.value) >= 1 && Number(input.value) <= 5; });
  document.getElementById('dayError').textContent = '';
}));
document.querySelectorAll('input[name="classDays"]').forEach(input => input.addEventListener('change', () => { document.getElementById('dayError').textContent = ''; }));
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
    const times = [...new Set((text.match(/(?:[01]?\d|2[0-3]):[0-5]\d/g) || []).map(t => t.padStart(5,'0')))].sort((a,b)=>minutes(a)-minutes(b));
    if (!times.length) { statusNode.textContent = 'No clock times found. Please enter the times manually below.'; return; }
    if (statusNode.id === 'classImportStatus') {
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
document.getElementById('classFile').addEventListener('change', e => readUpload(e.target.files[0],document.getElementById('classImportStatus')));
for (const [inputId, previewId] of [['classFile','classPreview']]) {
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
