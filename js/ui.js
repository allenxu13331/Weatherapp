// ui.js — UI state management, mode switching, error/loading helpers

// Shared state
let unit = 'C', mode = 'current';
let currentData = null, rangeData = null;
let chartForecast = null, chartRange = null;
let outfitChatContext = null;

// OpenWeather API key: set window.OW_KEY in config.js
const OW_KEY = (typeof window.OW_KEY !== 'undefined' && window.OW_KEY) ? window.OW_KEY : '';

function normalizeOpenWeatherQuery(q) {
  const s = (q || '').trim();
  if (!s || isCoordsQuery(s)) return s;
  const m = s.match(/^(.+?),\s*([A-Za-z]{2})\s*$/);
  if (m) {
    const city = m[1].trim();
    const st = m[2].toUpperCase();
    return `${city},${st},US`;
  }
  return s;
}

// Maps condition to emoji

function syncUnitToggleButtons() {
  const u = unit.toLowerCase();
  ['btn-c', 'btn-f', 'rbtn-c', 'rbtn-f', 'obtn-c', 'obtn-f'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('active', id.endsWith(u));
  });
}

function setUnit(u) {
  unit = u;
  syncUnitToggleButtons();
  if (currentData && mode === 'current') renderCurrent(currentData);
  if (rangeData && mode === 'range') renderRange(rangeData);
  if (currentData && mode === 'outfit') {
    renderOutfitCard(currentData);
    refreshOutfitMainSuggestion();
  }
}

// mode switching
function setMode(m) {
  mode = m;
  ['current','range','outfit'].forEach(id =>
    document.getElementById('tab-'+id).classList.toggle('active', id === m));
  document.getElementById('date-wrap').style.display      = m !== 'current' ? 'flex' : 'none';
  document.getElementById('date-end-group').style.display = m === 'range'   ? 'flex' : 'none';
  document.getElementById('current-view').style.display = 'none';
  document.getElementById('range-view').style.display   = 'none';
  document.getElementById('outfit-view').style.display  = 'none';
  syncUnitToggleButtons();
  clearError();
}

// UI helpers
function showError(msg) {
  document.getElementById('error-msg').textContent = msg;
  document.getElementById('error-box').classList.add('visible');
}
function clearError() { document.getElementById('error-box').classList.remove('visible'); }
function setLoading(v, msg = 'Fetching weather data…') {
  document.getElementById('loading').classList.toggle('visible', v);
  document.getElementById('loading-msg').textContent = msg;
  document.getElementById('search-btn').disabled = v;
  document.getElementById('loc-btn').disabled = v;
}
function toggleModal() { document.getElementById('modal-overlay').classList.toggle('visible'); }

function fmt12(s) {
  if (!s || typeof s !== 'string') return '—';
  const [h, m] = s.split(':');
  const hr = parseInt(h), per = hr >= 12 ? 'pm' : 'am', h12 = hr % 12 || 12;
  return `${h12}:${m} ${per}`;
}

function toISODate(d) {
  const dt = (d instanceof Date) ? d : new Date(String(d));
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().slice(0, 10);
}

function isCoordsQuery(q) {
  return /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(q);
}
