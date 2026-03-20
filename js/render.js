// render.js — DOM rendering functions

function renderCurrent(d) {
  const c = d.currentConditions;
  const today = d.days[0];

  document.getElementById('main-emoji').textContent  = condEmoji(c.icon);
  document.getElementById('main-temp').textContent   = disp(c.temp);
  document.getElementById('main-desc').textContent   = c.conditions;
  document.getElementById('temp-feel').textContent   = `Feels like ${disp(c.feelslike)}`;
  document.getElementById('s-humidity').textContent  = c.humidity != null ? c.humidity.toFixed(0) + '%' : '—';
  document.getElementById('s-wind').textContent      = windDisp(c.windspeed);
  document.getElementById('s-vis').textContent       = visDisp(c.visibility);
  document.getElementById('s-pressure').textContent  = c.pressure != null ? c.pressure.toFixed(0) + ' hPa' : '—';
  document.getElementById('s-cloud').textContent     = c.cloudcover != null ? c.cloudcover.toFixed(0) + '%' : '—';
  document.getElementById('s-precip').textContent    = c.precip != null ? precipDisp(c.precip) : (unit === 'C' ? '0.0 mm' : '0.00 in');
  document.getElementById('s-sunrise').textContent   = fmt12(today.sunrise);
  document.getElementById('s-sunset').textContent    = fmt12(today.sunset);
  document.getElementById('updated-time').textContent =
    'Updated ' + new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

  document.getElementById('loc-name').childNodes[0].textContent = d.resolvedAddress.split(',')[0];
  document.getElementById('loc-sub').textContent = d.resolvedAddress.split(',').slice(1).join(',').trim();

  const grid = document.getElementById('forecast-grid');
  grid.innerHTML = '';
  const labels = [], highs = [], lows = [];

  d.days.slice(0, 5).forEach((day, i) => {
    const dt   = new Date(day.datetime + 'T12:00:00');
    const name = i === 0 ? 'Today' : dt.toLocaleDateString('en-US', {weekday:'short'});
    const hi   = day.tempmax, lo = day.tempmin;
    const rain = day.precipprob;
    labels.push(name);
    highs.push(unit === 'C' ? hi : cToF(hi));
    lows.push(unit  === 'C' ? lo : cToF(lo));

    grid.innerHTML += `<div class="forecast-card forecast-card--clickable" tabindex="0" role="button" data-day-index="${i}" aria-label="Full details for ${name}">
      <div class="fc-day">${name}</div>
      <div class="fc-emoji">${condEmoji(day.icon)}</div>
      <div><span class="fc-high">${disp(hi)}</span><span class="fc-low">${disp(lo)}</span></div>
      ${rain != null ? `<div class="fc-rain">💧 ${rain.toFixed(0)}%</div>` : ''}
      <div class="fc-desc">${day.conditions}</div>
      <div class="fc-tap-hint">Details</div>
    </div>`;
  });

  grid.querySelectorAll('.forecast-card--clickable').forEach(el => {
    const idx = parseInt(el.getAttribute('data-day-index'), 10);
    el.addEventListener('click', () => openForecastDayDetail(idx));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openForecastDayDetail(idx);
      }
    });
  });

  // Bar chart
  if (chartForecast) chartForecast.destroy();
  chartForecast = new Chart(document.getElementById('forecast-chart').getContext('2d'), {
    type: 'bar',
    data: { labels, datasets: [
      {label:'High', data:highs, backgroundColor:'rgba(251,146,60,0.75)', borderRadius:6},
      {label:'Low',  data:lows,  backgroundColor:'rgba(103,232,249,0.75)', borderRadius:6},
    ]},
    options: {
      responsive: true,
      plugins: {legend:{labels:{color:'#6b7280', font:{family:'DM Mono'}}}},
      scales: {
        x: {ticks:{color:'#6b7280'}, grid:{color:'rgba(255,255,255,0.05)'}},
        y: {ticks:{color:'#6b7280', callback:v=>v.toFixed(0)+(unit==='C'?'°C':'°F')}, grid:{color:'rgba(255,255,255,0.05)'}},
      }
    }
  });

  document.getElementById('current-view').style.display = 'block';
}

let forecastDayEscHandler = null;

function closeForecastDayModal() {
  const ov = document.getElementById('forecast-day-overlay');
  if (ov) ov.classList.remove('visible');
  document.body.style.overflow = '';
  if (forecastDayEscHandler) {
    document.removeEventListener('keydown', forecastDayEscHandler);
    forecastDayEscHandler = null;
  }
}

function openForecastDayDetail(dayIndex, dataSource) {
  const src = dataSource != null ? dataSource : currentData;
  if (!src || !src.days || src.days[dayIndex] == null) return;
  const day = src.days[dayIndex];
  const dt = new Date(day.datetime + 'T12:00:00');
  const fullDate = dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  document.getElementById('forecast-day-title').textContent = fullDate;
  const pp = day.precipprob;
  const cloud = day.cloudcover;
  document.getElementById('forecast-day-body').innerHTML = `
    <div class="forecast-day-hero">
      <span class="forecast-day-emoji" aria-hidden="true">${condEmoji(day.icon)}</span>
      <div>
        <div class="forecast-day-cond">${day.conditions}</div>
        <div class="forecast-day-hilo"><span class="fc-high">${disp(day.tempmax)}</span> <span class="fc-low">${disp(day.tempmin)}</span></div>
      </div>
    </div>
    <div class="forecast-day-stats">
      <div class="fd-stat"><span>💨 Max wind</span><strong>${windDisp(day.windspeed)}</strong></div>
      <div class="fd-stat"><span>🌧 Precipitation (day)</span><strong>${precipDisp(day.precip)}</strong></div>
      ${pp != null ? `<div class="fd-stat"><span>📊 Precip chance</span><strong>${pp.toFixed(0)}%</strong></div>` : ''}
      ${cloud != null ? `<div class="fd-stat"><span>☁️ Avg cloud cover</span><strong>${cloud.toFixed(0)}%</strong></div>` : ''}
      <div class="fd-stat"><span>🌅 Sunrise</span><strong>${fmt12(day.sunrise)}</strong></div>
      <div class="fd-stat"><span>🌇 Sunset</span><strong>${fmt12(day.sunset)}</strong></div>
    </div>
    <p class="forecast-day-note">${dataSource === rangeData
      ? 'Same daily summary as in the Forecast &amp; History breakdown.'
      : 'Daily summary from Open‑Meteo.'}</p>`;

  const ov = document.getElementById('forecast-day-overlay');
  if (ov) {
    ov.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }
  if (forecastDayEscHandler) document.removeEventListener('keydown', forecastDayEscHandler);
  forecastDayEscHandler = e => { if (e.key === 'Escape') closeForecastDayModal(); };
  document.addEventListener('keydown', forecastDayEscHandler);
}

// render range 
function renderRange(d) {
  const breakdown = document.getElementById('day-breakdown');
  const tbody     = document.getElementById('range-table-body');
  breakdown.innerHTML = ''; tbody.innerHTML = '';
  const labels = [], highs = [], lows = [];

  d.days.forEach((day, i) => {
    const dt        = new Date(day.datetime + 'T12:00:00');
    const dayLabel  = dt.toLocaleDateString('en-US', {weekday:'long'});
    const dateLabel = dt.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
    const shortLbl  = dt.toLocaleDateString('en-US', {month:'short', day:'numeric'});
    const hi = day.tempmax, lo = day.tempmin;
    const wind   = day.windspeed;
    const precip = day.precip;
    const rain   = day.precipprob;
    const sunrise = fmt12(day.sunrise);
    const sunset  = fmt12(day.sunset);

    labels.push(shortLbl);
    highs.push(unit === 'C' ? hi : cToF(hi));
    lows.push( unit === 'C' ? lo : cToF(lo));

    const cloudLine = day.cloudcover != null ? `<br>☁️ Avg cloud: ${day.cloudcover.toFixed(0)}%` : '';
    breakdown.innerHTML += `<div class="day-card day-card--clickable" tabindex="0" role="button" data-range-day-index="${i}" aria-label="Full details for ${dayLabel}, ${dateLabel}">
      <div class="day-card-date">${condEmoji(day.icon)} ${dayLabel}<span>${dateLabel}</span></div>
      <div class="day-card-info">
        <b>${day.conditions}</b><br>
        💨 Wind: ${windDisp(wind)} &nbsp;|&nbsp; 🌧 Precip: ${precipDisp(precip)}${rain != null ? ' ('+rain.toFixed(0)+'%)' : ''}${cloudLine}<br>
        🌅 ${sunrise} &nbsp;&nbsp; 🌇 ${sunset}
        <div class="day-card-tap-hint">Details</div>
      </div>
      <div class="day-card-temps">
        <div class="hi">${disp(hi)}</div>
        <span class="lo">${disp(lo)}</span>
      </div>
    </div>`;

    tbody.innerHTML += `<tr>
      <td>${dateLabel}</td>
      <td style="color:var(--warm)">${disp(hi)}</td>
      <td style="color:var(--cold)">${disp(lo)}</td>
      <td>${windDisp(wind)}</td>
      <td>${precipDisp(precip)}</td>
      <td>${day.conditions}</td>
    </tr>`;
  });

  breakdown.querySelectorAll('.day-card--clickable').forEach(el => {
    const idx = parseInt(el.getAttribute('data-range-day-index'), 10);
    el.addEventListener('click', () => openForecastDayDetail(idx, rangeData));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openForecastDayDetail(idx, rangeData);
      }
    });
  });

  if (chartRange) chartRange.destroy();
  chartRange = new Chart(document.getElementById('range-chart').getContext('2d'), {
    type: 'bar',
    data: {labels, datasets:[
      {label:'High', data:highs, backgroundColor:'rgba(251,146,60,0.75)', borderRadius:5},
      {label:'Low',  data:lows,  backgroundColor:'rgba(103,232,249,0.75)', borderRadius:5},
    ]},
    options: {
      responsive: true,
      plugins: {legend:{labels:{color:'#6b7280', font:{family:'DM Mono'}}}},
      scales: {
        x: {ticks:{color:'#6b7280', maxRotation:45}, grid:{color:'rgba(255,255,255,0.05)'}},
        y: {ticks:{color:'#6b7280', callback:v=>v.toFixed(0)+(unit==='C'?'°C':'°F')}, grid:{color:'rgba(255,255,255,0.05)'}},
      }
    }
  });

  document.getElementById('range-view').style.display = 'block';
}

// render outfit card
function renderOutfitCard(d) {
  const day = d.days[0];
  document.getElementById('outfit-emoji').textContent = condEmoji(day.icon);
  document.getElementById('outfit-temp').textContent  = disp(day.tempmax);
  document.getElementById('outfit-desc').textContent  = day.conditions;
  document.getElementById('outfit-feel').textContent  = `High ${disp(day.tempmax)} · Low ${disp(day.tempmin)}`;
  document.getElementById('outfit-sunrise').textContent = fmt12(day.sunrise);
  document.getElementById('outfit-sunset').textContent  = fmt12(day.sunset);
  document.getElementById('outfit-weather-card').style.display = 'block';
}


