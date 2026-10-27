/* NOCTURNE – College Event Registration Portal (vanilla JS)
   STORAGE: events are a fixed constant (EVENTS), so they never change between reloads.
   Only registration records live in Local Storage under one key (STORE_KEY). Every change
   goes load() -> modify -> save(); counts and seats are always computed from those records,
   so there is one source of truth. Local Storage is per-browser and is not a real database. */
(() => {
'use strict';

const BRAND = { name: 'NOCTURNE', tagline: 'Where Campus Life Comes Alive.' };
const STORE_KEY = 'nocturne.registrations.v1';
const img = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;
const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 10'%3E%3Cdefs%3E%3ClinearGradient id='g'%3E%3Cstop offset='0' stop-color='%234C1D95'/%3E%3Cstop offset='1' stop-color='%2309070F'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='16' height='10' fill='url(%23g)'/%3E%3C/svg%3E";

const EVENTS = [
 { id:'evt-001', title:'Nocturne Tech Symposium', date:'2026-11-14', time:'10:00 AM', venue:'Grand Auditorium', category:'Technical', description:'A full day of talks on AI, cloud and cybersecurity by industry engineers and alumni.', image:img('photo-1540575467063-178a50c2df87'), alt:'Speaker presenting on stage to a seated audience', capacity:120, registrationOpen:true, cancellationAllowed:true, cancellationDeadline:'2026-11-10', featured:true },
 { id:'evt-002', title:'Midnight Code Duel', date:'2026-11-20', time:'6:00 PM', venue:'Computer Lab 3', category:'Coding', description:'A three-hour competitive programming contest. Solo entries, algorithmic problems, live leaderboard.', image:img('photo-1517694712202-14dd9538aa97'), alt:'Laptop showing code on a dark desk', capacity:3, registrationOpen:true, cancellationAllowed:true, cancellationDeadline:'2026-11-18', featured:true },
 { id:'evt-003', title:'Rangoli & Raga Cultural Night', date:'2026-12-05', time:'5:30 PM', venue:'Open-Air Theatre', category:'Cultural', description:'An evening of classical music, dance and rangoli art by student troupes.', image:img('photo-1511795409834-ef04bbd61622'), alt:'Lit stage with a performance in progress', capacity:200, registrationOpen:true, cancellationAllowed:false, cancellationDeadline:'', featured:true },
 { id:'evt-004', title:'UI Design Workshop', date:'2026-11-02', time:'2:00 PM', venue:'Seminar Hall B', category:'Workshop', description:'Hands-on session on layout, colour and typography for responsive interfaces. Bring a laptop.', image:img('photo-1504384308090-c894fdcc538d'), alt:'Participants working together at a workshop table', capacity:40, registrationOpen:true, cancellationAllowed:true, cancellationDeadline:'2026-10-20' },
 { id:'evt-005', title:'Golden Hour Photo Contest', date:'2026-11-28', time:'4:00 PM', venue:'Campus Gardens', category:'Photography', description:'Capture the campus at golden hour. Theme announced on site; top three entries win prizes.', image:img('photo-1452587925148-ce544e77e70d'), alt:'Camera lens pointed at a sunset', capacity:60, registrationOpen:true, cancellationAllowed:true, cancellationDeadline:'2026-11-25' },
 { id:'evt-006', title:'Startup Pitch Evening', date:'2026-12-10', time:'3:00 PM', venue:'Incubation Centre', category:'Entrepreneurship', description:'Student teams pitch business ideas to a panel of founders and investors.', image:img('photo-1559136555-9303baea8ebd'), alt:'Presenter pitching an idea to a small panel', capacity:80, registrationOpen:true, cancellationAllowed:true, cancellationDeadline:'2026-12-07' },
 { id:'evt-007', title:'Inkwell Literary Fest', date:'2026-12-14', time:'11:00 AM', venue:'Library Reading Hall', category:'Literary', description:'Poetry slam, short-story reading and a book swap. Registration has closed; walk-in audience welcome.', image:img('photo-1481627834876-b7833e8f5570'), alt:'Shelves of books in a quiet library', capacity:70, registrationOpen:false, cancellationAllowed:true, cancellationDeadline:'2026-12-10' },
 { id:'evt-008', title:'Resume & Interview Clinic', date:'2026-12-18', time:'10:30 AM', venue:'Placement Cell', category:'Career', description:'One-to-one resume reviews and mock interviews with HR professionals.', image:img('photo-1517048676732-d65bc937f952'), alt:'Two people talking across a desk in an interview', capacity:50, registrationOpen:true, cancellationAllowed:true, cancellationDeadline:'2026-12-15' }
];
const DEPARTMENTS = ['BCA','B.Sc Computer Science','B.Com','BBA','B.A.','Other'];

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
function h(tag, attrs = {}, kids = []) {            // safe DOM builder: text is never parsed as HTML
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v; else n.setAttribute(k, v === true ? '' : v);
  }
  [].concat(kids).forEach(c => c != null && n.append(c));
  return n;
}
const pad = n => String(n).padStart(2, '0');
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const fmtDate = s => new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
const normEmail = e => String(e || '').trim().toLowerCase();
const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);   // reasonable syntax only; cannot prove the address exists
const getEvent = id => EVENTS.find(e => e.id === id);

/* ---------- storage layer ---------- */
function isValidRecord(r) {
  return r && typeof r === 'object' && getEvent(r.eventId) && typeof r.email === 'string' && typeof r.name === 'string' && (r.status === 'active' || r.status === 'cancelled');
}
function load() {                                    // safe read: bad or missing data gives []
  try {
    const data = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    return Array.isArray(data) ? data.filter(isValidRecord) : [];
  } catch { return []; }
}
function save(list) {                                // returns false if the browser refuses to store
  try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); return true; } catch { return false; }
}

/* ---------- derived state ---------- */
const activeCount = (eventId, regs = load()) => regs.filter(r => r.eventId === eventId && r.status === 'active').length;
const seatsLeft = (ev, regs = load()) => Math.max(0, ev.capacity - activeCount(ev.id, regs));
function availability(ev, regs = load()) {
  if (!ev.registrationOpen) return 'closed';
  return seatsLeft(ev, regs) === 0 ? 'full' : 'open';
}
const availText = { open: 'Open', full: 'Full', closed: 'Registration closed' };
function cancelRule(ev) {
  if (!ev.cancellationAllowed) return { ok:false, reason:'This event does not allow cancellations.' };
  if (todayStr() > ev.cancellationDeadline) return { ok:false, reason:`Cancellation closed on ${fmtDate(ev.cancellationDeadline)}.` };
  return { ok:true, reason:`Cancel free until ${fmtDate(ev.cancellationDeadline)}.` };
}
const policyText = ev => ev.cancellationAllowed ? `You may cancel until ${fmtDate(ev.cancellationDeadline)}; the seat is then released.` : 'Registrations for this event cannot be cancelled.';

/* ---------- actions (validate + change state in one step, using fresh data) ---------- */
function validate(raw) {
  const data = { name: raw.name.trim().replace(/\s+/g, ' '), email: normEmail(raw.email), regNo: raw.regNo.trim().toUpperCase(), dept: raw.dept.trim() };
  const errors = {};
  if (!data.name) errors.name = 'Enter your full name.'; else if (data.name.length < 2) errors.name = 'Name must be at least 2 characters.';
  if (!data.email) errors.email = 'Enter your email address.'; else if (!emailOk(data.email)) errors.email = 'Enter a valid email, like name@college.edu.';
  if (!data.regNo) errors.regNo = 'Enter your register number.'; else if (!/^[A-Z0-9/-]{4,20}$/.test(data.regNo)) errors.regNo = 'Use 4–20 letters, digits, / or -.';
  if (!data.dept) errors.dept = 'Select your department.';
  return { data, errors };
}
function registerStudent(eventId, raw) {
  const ev = getEvent(eventId);
  if (!ev) return { ok:false, message:'This event no longer exists.' };
  if (!ev.registrationOpen) return { ok:false, message:'Registration is closed for this event.' };
  const { data, errors } = validate(raw);
  if (Object.keys(errors).length) return { ok:false, errors, message:'Please fix the highlighted fields.' };
  const regs = load();                               // latest state, read right before saving
  const existing = regs.find(r => r.eventId === eventId && r.email === data.email);
  if (existing && existing.status === 'active') return { ok:false, message:'You are already registered for this event.' };
  if (activeCount(eventId, regs) >= ev.capacity) return { ok:false, message:'Sorry, this event is full.' };
  if (existing) Object.assign(existing, data, { status:'active', registeredAt:Date.now() });   // re-registration policy
  else regs.push({ id:`reg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, eventId, ...data, status:'active', registeredAt:Date.now() });
  if (!save(regs)) return { ok:false, message:'Could not save your registration. Check that browser storage is enabled.' };
  return { ok:true };
}
function cancelRegistration(regId) {
  const regs = load();
  const reg = regs.find(r => r.id === regId && r.status === 'active');
  if (!reg) return { ok:false, message:'That registration was not found.' };
  const rule = cancelRule(getEvent(reg.eventId));
  if (!rule.ok) return { ok:false, message:rule.reason };
  reg.status = 'cancelled';
  return save(regs) ? { ok:true } : { ok:false, message:'Could not save the cancellation.' };
}

/* ---------- UI ---------- */
let currentEventId = null, lookupEmail = '';
const detailDlg = $('#detail'), confirmDlg = $('#confirm');

function toast(msg, type = 'success') {
  const t = h('div', { class:`toast ${type}`, role: type === 'error' ? 'alert' : 'status', text:msg });
  $('#toasts').append(t); setTimeout(() => t.remove(), 4500);
}
function picture(ev, cls) {
  const im = h('img', { src:ev.image, alt:ev.alt, loading:'lazy' });
  im.addEventListener('error', () => { im.src = FALLBACK; }, { once:true });
  return h('div', { class:cls }, im);
}
function eventCard(ev, regs) {                       // one function builds every card, featured or not
  const state = availability(ev, regs), left = seatsLeft(ev, regs);
  const thumb = picture(ev, 'thumb'); thumb.append(h('span', { class:'badge', text:ev.category }));
  return h('article', { class:'card' }, [thumb, h('div', { class:'card-body' }, [
    h('h3', { text:ev.title }),
    h('p', { class:'meta', text:`${fmtDate(ev.date)}, ${ev.time} · ${ev.venue}` }),
    h('p', { class:'desc', text:ev.description }),
    h('div', { class:'card-foot' }, [
      h('span', { class:`status ${state}`, text: state === 'open' ? `${left} of ${ev.capacity} seats left` : availText[state] }),
      h('button', { class:'btn small', type:'button', 'data-open':ev.id, 'aria-label':`View details for ${ev.title}`, text:'View details' })
    ])
  ])]);
}
function filteredEvents() {
  const q = $('#fSearch').value.trim().toLowerCase(), cat = $('#fCat').value, from = $('#fDate').value;
  return EVENTS.filter(e => (!q || e.title.toLowerCase().includes(q)) && (!cat || e.category === cat) && (!from || e.date >= from));
}
function renderEvents() {
  const regs = load(), list = filteredEvents(), grid = $('#eventGrid');
  grid.replaceChildren(...list.map(e => eventCard(e, regs)));
  $('#eventEmpty').hidden = list.length > 0;
  $('#resultCount').textContent = `Showing ${list.length} of ${EVENTS.length} events`;
  $('#featuredGrid').replaceChildren(...EVENTS.filter(e => e.featured).map(e => eventCard(e, regs)));
}
function field(name, label, input, error) {
  return h('label', { class:name === 'name' || name === 'email' ? 'full' : '' }, [label, input, h('span', { class:'err', id:`err-${name}`, role:'alert', text:error || '' })]);
}
function renderDetail() {
  const ev = getEvent(currentEventId); if (!ev) return;
  const regs = load(), state = availability(ev, regs), left = seatsLeft(ev, regs);
  const body = h('div', {}, [
    h('button', { class:'close', type:'button', 'data-close':'detail', 'aria-label':'Close details', text:'Close' }),
    picture(ev, 'thumb d-img'),
    h('div', { class:'d-body' }, [
      h('h2', { id:'dTitle', text:ev.title }),
      h('p', { class:'meta', text:`${ev.category} · ${fmtDate(ev.date)}, ${ev.time} · ${ev.venue}` }),
      h('p', { text:ev.description }),
      h('div', { class:'stats' }, [['Registered', activeCount(ev.id, regs)], ['Capacity', ev.capacity], ['Seats left', left]].map(([l, v]) => h('div', {}, [h('b', { text:v }), l]))),
      h('p', { class:`status ${state}`, text:`Status: ${availText[state]}` }),
      h('p', { class:'policy', text:`Cancellation policy: ${policyText(ev)}` })
    ])
  ]);
  const dBody = body.querySelector('.d-body');
  if (state === 'open') dBody.append(buildForm(ev));
  else dBody.append(h('p', { class:'note', text: state === 'full' ? 'All seats are taken. If someone cancels, a seat may open up again.' : 'Registration is closed for this event, so new registrations are not accepted.' }));
  $('#detailBody').replaceChildren(body);
}
function buildForm(ev) {
  const dept = h('select', { id:'rDept', name:'dept', required:true }, [h('option', { value:'', text:'Select department' }), ...DEPARTMENTS.map(d => h('option', { value:d, text:d }))]);
  const form = h('form', { class:'rform', novalidate:true, 'aria-label':`Register for ${ev.title}` }, [
    field('name', 'Full name', h('input', { id:'rName', name:'name', required:true, autocomplete:'name' })),
    field('email', 'Email', h('input', { id:'rEmail', name:'email', type:'email', required:true, autocomplete:'email' })),
    field('regNo', 'Register number', h('input', { id:'rReg', name:'regNo', required:true })),
    field('dept', 'Department / course', dept),
    h('button', { class:'btn full', type:'submit', text:'Confirm registration' })
  ]);
  let busy = false;                                  // blocks accidental double submits
  form.addEventListener('submit', e => {
    e.preventDefault(); if (busy) return; busy = true;
    const btn = form.querySelector('button'); btn.disabled = true;
    const raw = Object.fromEntries(['name', 'email', 'regNo', 'dept'].map(k => [k, form.elements[k].value]));
    const res = registerStudent(ev.id, raw);
    for (const k of ['name', 'email', 'regNo', 'dept']) {
      const msg = res.errors?.[k] || ''; form.elements[k].setAttribute('aria-invalid', msg ? 'true' : 'false'); $(`#err-${k}`, form).textContent = msg;
    }
    if (res.ok) { toast(`You're registered for ${ev.title}.`); lookupEmail = normEmail(raw.email); $('#lookupEmail').value = lookupEmail; refresh(); }
    else { toast(res.message, 'error'); btn.disabled = false; busy = false; if (!res.errors) refresh(); }
  });
  return form;
}
function renderMine() {
  const box = $('#myList');
  if (!lookupEmail) return box.replaceChildren(h('div', { class:'empty' }, [h('h3', { text:'Look up your registrations' }), h('p', { text:'Enter the email you used to register.' })]));
  const mine = load().filter(r => r.email === lookupEmail && r.status === 'active');
  if (!mine.length) return box.replaceChildren(h('div', { class:'empty' }, [h('h3', { text:'No active registrations found' }), h('p', { text:'Check the spelling of the email, or explore events and register for one.' })]));
  box.replaceChildren(...mine.map(r => {
    const ev = getEvent(r.eventId), rule = cancelRule(ev);
    return h('article', { class:'reg' }, [
      h('div', {}, [h('h3', { text:ev.title }), h('p', { class:'meta', text:`${fmtDate(ev.date)}, ${ev.time} · ${ev.venue}` }),
        h('p', { class:'meta', text:`${r.name} · ${r.regNo} · ${r.dept}` }), h('p', { class:'status', text:'Status: Registered' })]),
      h('div', {}, [h('button', { class:'btn ghost', type:'button', 'data-cancel':r.id, disabled:!rule.ok, text:'Cancel registration' }), h('p', { class:'why', text:rule.reason })])
    ]);
  }));
}
function refresh() { renderEvents(); renderMine(); if (detailDlg.open) renderDetail(); }
function openDetail(id) { if (!getEvent(id)) return toast('Event not found.', 'error'); currentEventId = id; renderDetail(); if (!detailDlg.open) detailDlg.showModal(); }
function ask(message) {
  return new Promise(res => {
    $('#cMsg').textContent = message; confirmDlg.returnValue = '';
    confirmDlg.addEventListener('close', () => res(confirmDlg.returnValue === 'yes'), { once:true }); confirmDlg.showModal();
  });
}

/* ---------- wiring (listeners attached once, using delegation) ---------- */
document.addEventListener('click', async e => {
  const open = e.target.closest('[data-open]'); if (open) return openDetail(open.dataset.open);
  if (e.target.closest('[data-close]')) return detailDlg.close();
  const c = e.target.closest('[data-cancel]');
  if (c) {
    const reg = load().find(r => r.id === c.dataset.cancel); if (!reg) return refresh();
    if (!(await ask(`Cancel your registration for "${getEvent(reg.eventId).title}"? Your seat will be released.`))) return;
    const res = cancelRegistration(reg.id);
    toast(res.ok ? 'Registration cancelled. Your seat was released.' : res.message, res.ok ? 'success' : 'error'); refresh();
  }
});
['fSearch', 'fCat', 'fDate'].forEach(id => $('#' + id).addEventListener('input', renderEvents));
$('#fReset').addEventListener('click', () => { $('#filters').reset(); renderEvents(); });
$('#lookup').addEventListener('submit', e => {
  e.preventDefault();
  const v = normEmail($('#lookupEmail').value), err = $('#lookupErr');
  err.textContent = !v ? 'Enter the email you registered with.' : !emailOk(v) ? 'Enter a valid email address.' : '';
  if (err.textContent) return;
  lookupEmail = v; renderMine();
});
$('#menuBtn').addEventListener('click', e => { const o = $('#navLinks').classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', o); });
$('#navLinks').addEventListener('click', e => { if (e.target.closest('a')) { $('#navLinks').classList.remove('open'); $('#menuBtn').setAttribute('aria-expanded', 'false'); } });
window.addEventListener('storage', e => { if (e.key === STORE_KEY) refresh(); });   // another tab changed data

document.querySelectorAll('[data-brand]').forEach(n => { n.textContent = BRAND.name; });
document.querySelectorAll('[data-tagline]').forEach(n => { n.textContent = BRAND.tagline; });
$('#fCat').append(...[...new Set(EVENTS.map(e => e.category))].sort().map(c => h('option', { value:c, text:c })));
refresh();
})();