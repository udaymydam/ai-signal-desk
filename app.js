const supportedRoles = ['architect', 'developer', 'other'];
const roleFromUrl = new URLSearchParams(window.location.search).get('role');
const state = { filter: 'all', sort: 'recommended', search: '', role: supportedRoles.includes(roleFromUrl) ? roleFromUrl : (localStorage.getItem('ai-signal-role') || 'architect'), saved: new Set(JSON.parse(localStorage.getItem('ai-signal-saved') || '[]')) };
let events = [], signals = [];

const formatDate = (dateString) => {
  const date = new Date(`${dateString}T12:00:00`);
  return { month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(), day: date.toLocaleDateString('en-US', { day: '2-digit' }), full: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) };
};
const today = new Date(); today.setHours(0, 0, 0, 0);
const isUpcoming = (event) => new Date(`${event.endDate || event.date}T23:59:59`) >= today;
const isRelevant = (event) => (event.roles || ['architect', 'developer', 'other']).includes(state.role);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
function getVisibleEvents() {
  const filtered = events.filter((e) => {
    const text = `${e.title} ${e.description} ${e.tags.join(' ')}`.toLowerCase();
    const matchFilter = state.filter === 'all' || (state.filter === 'relevant' && isRelevant(e)) || (state.filter === 'remote' && e.access !== 'In person') || e.tags.some((tag) => tag.toLowerCase().includes(state.filter));
    return isUpcoming(e) && matchFilter && text.includes(state.search);
  });
  if (state.sort === 'soonest') return filtered.sort((a, b) => a.date.localeCompare(b.date));
  if (state.sort === 'impact') return filtered.sort((a, b) => (b.score || 0) - (a.score || 0) || a.date.localeCompare(b.date));
  return filtered.sort((a, b) => Number(isRelevant(b)) - Number(isRelevant(a)) || (b.score || 0) - (a.score || 0) || a.date.localeCompare(b.date));
}

function renderMetrics() {
  const upcoming = events.filter(isUpcoming); document.querySelector('#upcomingCount').textContent = upcoming.length;
  document.querySelector('#remoteCount').textContent = upcoming.filter((e) => e.access !== 'In person').length;
  document.querySelector('#savedCount').textContent = state.saved.size;
}
function renderEvents() {
  const list = document.querySelector('#eventList');
  const filtered = getVisibleEvents();
  document.querySelector('#resultCount').textContent = `${filtered.length} result${filtered.length === 1 ? '' : 's'}`;
  document.querySelector('#emptyState').classList.toggle('hidden', filtered.length !== 0);
  list.innerHTML = filtered.map((event, index) => { const date = formatDate(event.date); const saved = state.saved.has(event.id); const relevant = isRelevant(event); const destination = event.registrationUrl || event.url; return `<article class="event-card ${saved ? 'saved-card' : ''}">
    <div class="event-date"><span class="event-rank">#${String(index + 1).padStart(2, '0')}</span><strong>${date.day}</strong>${date.month}<br /><span>${event.year || date.full.slice(-4)}</span></div>
    <div><div class="event-title-row"><h3 class="event-title">${escapeHtml(event.title)}</h3>${relevant ? '<span class="match-badge">Best match</span>' : ''}<span class="impact-score">Impact ${event.score || '—'}</span></div><p class="event-description">${escapeHtml(event.description)}</p><div class="tags">${event.access !== 'In person' ? '<span class="tag remote">Remote-friendly</span>' : ''}${event.tags.map((tag) => `<span class="tag ${tag.toLowerCase().includes('policy') || tag.toLowerCase().includes('safety') ? 'policy' : ''}">${escapeHtml(tag)}</span>`).join('')}</div><div class="event-location">${escapeHtml(event.location)} · ${escapeHtml(event.access)}</div><div class="event-actions"><a class="event-register" href="${destination}" target="_blank" rel="noreferrer">Register / attend ↗</a><a class="event-details" href="${event.url}" target="_blank" rel="noreferrer">Official details</a></div></div>
    <button class="save-button ${saved ? 'saved' : ''}" data-save="${event.id}" aria-label="${saved ? 'Remove from' : 'Save'} ${escapeHtml(event.title)}">${saved ? '★' : '☆'}</button></article>`; }).join('');
  list.querySelectorAll('[data-save]').forEach((button) => button.addEventListener('click', () => { const id = button.dataset.save; state.saved.has(id) ? state.saved.delete(id) : state.saved.add(id); localStorage.setItem('ai-signal-saved', JSON.stringify([...state.saved])); renderMetrics(); renderEvents(); }));
  const bulkButton = document.querySelector('#openAllButton'); bulkButton.textContent = `Open ${filtered.length} registration page${filtered.length === 1 ? '' : 's'} ↗`; bulkButton.disabled = filtered.length === 0;
  document.querySelector('#bulkNote').textContent = filtered.length ? `Opens ${filtered.length} matching organizer page${filtered.length === 1 ? '' : 's'} in new tab${filtered.length === 1 ? '' : 's'}. You complete each registration there.` : 'No matching event pages to open.';
}
function renderNext() { const next = events.filter(isUpcoming).sort((a,b) => a.date.localeCompare(b.date))[0]; if (!next) return; const destination = next.registrationUrl || next.url; document.querySelector('#nextEvent').innerHTML = `<div class="next-event"><span class="next-date">${formatDate(next.date).full} · ${escapeHtml(next.access)}</span><h3>${escapeHtml(next.title)}</h3><p>${escapeHtml(next.description)}</p><a class="next-link" href="${destination}" target="_blank" rel="noreferrer">Register / attend ↗</a></div>`; }
function renderSignals() { document.querySelector('#signalList').innerHTML = signals.slice(0, 3).map((item) => `<article class="signal-item"><span class="signal-source">${escapeHtml(item.source)} · ${escapeHtml(item.date)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p></article>`).join(''); }
function renderDates() { document.querySelector('#watchDate').textContent = today.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }); const nextFriday = new Date(today); const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7; nextFriday.setDate(today.getDate() + daysUntilFriday); document.querySelector('#nextRefresh').textContent = nextFriday.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }); }
async function init() { const [eventResponse, signalResponse] = await Promise.all([fetch('data/events.json'), fetch('data/updates.json')]); events = await eventResponse.json(); signals = await signalResponse.json(); renderDates(); renderMetrics(); renderEvents(); renderNext(); renderSignals(); }
document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.filter').forEach((b) => b.classList.remove('active')); button.classList.add('active'); state.filter = button.dataset.filter; renderEvents(); }));
document.querySelector('#openAllButton').addEventListener('click', () => { getVisibleEvents().forEach((event) => window.open(event.registrationUrl || event.url, '_blank', 'noopener,noreferrer')); });
document.querySelectorAll('.role-button').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.role-button').forEach((b) => b.classList.remove('active')); button.classList.add('active'); state.role = button.dataset.role; localStorage.setItem('ai-signal-role', state.role); document.querySelector('#roleStatus').textContent = `${button.textContent} lens · best matches first`; renderEvents(); }));
document.querySelector('#searchInput').addEventListener('input', (event) => { state.search = event.target.value.toLowerCase().trim(); renderEvents(); });
document.querySelector('#sortSelect').addEventListener('change', (event) => { state.sort = event.target.value; renderEvents(); });
document.querySelector('#themeToggle').addEventListener('click', () => document.body.classList.toggle('dark'));
document.querySelector('#subscribeForm').addEventListener('submit', (event) => { event.preventDefault(); const email = document.querySelector('#emailInput').value; localStorage.setItem('ai-signal-email', email); document.querySelector('#subscribeStatus').textContent = `Saved for ${email}. Monthly delivery is enabled in the workflow setup.`; });
document.querySelectorAll('.role-button').forEach((button) => button.classList.toggle('active', button.dataset.role === state.role));
const initialRoleButton = document.querySelector(`.role-button[data-role="${state.role}"]`); if (initialRoleButton) document.querySelector('#roleStatus').textContent = `${initialRoleButton.textContent} lens · best matches first`;
init().catch(() => { document.querySelector('#eventList').innerHTML = '<div class="empty-state">Could not load the watchlist. Serve this folder locally, then refresh.</div>'; });
