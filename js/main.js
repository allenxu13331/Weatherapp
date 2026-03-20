// main.js — search handlers, geolocation, app init

async function handleSearch() {
  const q = document.getElementById('search-input').value.trim();
  if (!q) { showError('Please enter a location.'); return; }
  clearError();
  if (mode === 'current') await doCurrentSearch(q);
  else if (mode === 'range') await doRangeSearch(q);
  else await doOutfitSearch(q);
}

async function doCurrentSearch(q) {
  setLoading(true);
  document.getElementById('current-view').style.display = 'none';
  try {
    const d = await fetchTodayView(q);
    currentData = d;
    renderCurrent(d);
  } catch(e) { showError(e.message); }
  finally { setLoading(false); }
}

async function doRangeSearch(q) {
  const s = document.getElementById('date-start').value;
  const e = document.getElementById('date-end').value;
  if (!s || !e) { showError('Please select both a start and end date.'); return; }
  if (e < s)    { showError('End date cannot be before start date.'); return; }
  setLoading(true);
  document.getElementById('range-view').style.display = 'none';
  try {
    const d = await fetchWeatherRange(q, s, e);
    rangeData = d;
    document.getElementById('range-loc-label').textContent = d.resolvedAddress;
    renderRange(d);
  } catch(e) { showError(e.message); }
  finally { setLoading(false); }
}

async function doOutfitSearch(q) {
  const dateVal = document.getElementById('date-start').value || new Date().toISOString().split('T')[0];
  setLoading(true, 'Fetching weather…');
  document.getElementById('outfit-view').style.display  = 'block';
  document.getElementById('outfit-weather-card').style.display = 'none';
  document.getElementById('ai-panel').style.display     = 'none';
  try {
    const todayIso = new Date().toISOString().split('T')[0];
    const d = dateVal < todayIso
      ? await fetchMeteoArchiveOnly(q, dateVal, dateVal)
      : await fetchMeteoForecastDailyRange(q, dateVal, dateVal, { withLive: false });
    currentData = d;
    document.getElementById('outfit-loc').childNodes[0].textContent = d.resolvedAddress.split(',')[0];
    document.getElementById('outfit-sub').textContent = d.resolvedAddress.split(',').slice(1).join(',').trim();
    document.getElementById('outfit-date-label').textContent =
      new Date(dateVal + 'T12:00:00').toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric'});
    renderOutfitCard(d);

    const day = d.days[0];
    const text = getOutfitSuggestion(
      d.resolvedAddress, dateVal,
      day.tempmax, day.tempmin,
      day.conditions, day.windspeed
    );
    outfitChatContext = {
      resolvedAddress: d.resolvedAddress,
      dateStr: dateVal,
      tempmax: day.tempmax,
      tempmin: day.tempmin,
      conditions: day.conditions,
      windspeed: day.windspeed,
      precip: day.precip,
      precipprob: day.precipprob,
    };
    clearOutfitThread();
    const fu = document.getElementById('ai-followup-input');
    if (fu) fu.value = '';
    document.getElementById('ai-panel').style.display = 'block';
    document.getElementById('ai-response').textContent = text;
    document.getElementById('ai-response').classList.add('loaded');
  } catch(e) {
    showError(e.message);
  }
  finally { setLoading(false); }
}

// get location
function getLocation() {
  clearError();
  if (!navigator.geolocation) { showError('Geolocation not supported by your browser.'); return; }
  setLoading(true, 'Getting your location…');
  navigator.geolocation.getCurrentPosition(
    pos => {
      const coords = `${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`;
      document.getElementById('search-input').value = coords;
      handleSearch();
    },
    err => {
      setLoading(false);
      if (err.code === 1) showError('Location access denied. Please search manually.');
      else if (err.code === 2) showError('Location unavailable. Please search manually.');
      else showError('Could not get your location.');
    },
    {timeout: 10000}
  );
}

// initialize the app
window.addEventListener('DOMContentLoaded', () => {
  const today     = new Date().toISOString().split('T')[0];
  const maxForecastEnd = meteoMaxForecastEndISO();
  document.getElementById('date-start').value = today;
  document.getElementById('date-end').value   = maxForecastEnd;
  document.getElementById('search-input').value = 'Atlanta, GA';
  const fu = document.getElementById('ai-followup-input');
  if (fu) {
    fu.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendOutfitFollowup(); }
    });
  }
  doCurrentSearch('Atlanta, GA');
});
