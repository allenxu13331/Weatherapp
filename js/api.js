// api.js — Open‑Meteo for all daily weather (past archive + future up to ~16 days);
//           OpenWeather /weather only for live “now” stats on the Today tab.

function meteoWeather(code) {
  const c = Number(code);
  if (c === 0) return { iconKey: 'clear-day', conditions: 'Clear' };
  if (c === 1) return { iconKey: 'partly-cloudy-day', conditions: 'Mainly clear' };
  if (c === 2) return { iconKey: 'partly-cloudy-day', conditions: 'Partly cloudy' };
  if (c === 3) return { iconKey: 'cloudy', conditions: 'Overcast' };
  if (c === 45 || c === 48) return { iconKey: 'fog', conditions: 'Fog' };
  if ([51,53,55,56,57].includes(c)) return { iconKey: 'rain', conditions: 'Drizzle' };
  if ([61,63,65,66,67].includes(c)) return { iconKey: 'rain', conditions: 'Rain' };
  if ([71,73,75,77,85,86].includes(c)) return { iconKey: 'snow', conditions: 'Snow' };
  if ([80,81,82].includes(c)) return { iconKey: 'showers-day', conditions: 'Showers' };
  if ([95,96,99].includes(c)) return { iconKey: 'thunder-rain', conditions: 'Thunderstorm' };
  return { iconKey: '', conditions: '—' };
}

function parseMeteoDailyDays(d) {
  const time = d?.daily?.time || [];
  const tmax = d?.daily?.temperature_2m_max || [];
  const tmin = d?.daily?.temperature_2m_min || [];
  const wmax = d?.daily?.windspeed_10m_max || [];
  const psum = d?.daily?.precipitation_sum || [];
  const pprob = d?.daily?.precipitation_probability_max || [];
  const wc = d?.daily?.weathercode || [];
  const sunrise = d?.daily?.sunrise || [];
  const sunset = d?.daily?.sunset || [];
  const cmean = d?.daily?.cloud_cover_mean || [];

  return time.map((dateStr, i) => {
    const wx = meteoWeather(wc[i]);
    const sr = sunrise[i] ? String(sunrise[i]).split('T')[1] : null;
    const ss = sunset[i] ? String(sunset[i]).split('T')[1] : null;
    const cc = cmean[i];
    return {
      datetime: dateStr,
      tempmax: tmax[i] != null ? Number(tmax[i]) : null,
      tempmin: tmin[i] != null ? Number(tmin[i]) : null,
      windspeed: wmax[i] != null ? Number(wmax[i]) : null,
      precip: psum[i] != null ? Number(psum[i]) : null,
      precipprob: pprob[i] != null ? Number(pprob[i]) : null,
      sunrise: sr,
      sunset: ss,
      conditions: wx.conditions,
      icon: wx.iconKey,
      cloudcover: cc != null && cc !== '' ? Number(cc) : null,
    };
  });
}

function utcTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

function minISODate(a, b) {
  return a <= b ? a : b;
}

function maxISODate(a, b) {
  return a >= b ? a : b;
}

/** Open‑Meteo allows for daily forecast up to 16 days */
function meteoMaxForecastEndISO() {
  const t = utcTodayISO();
  const d = new Date(t + 'T12:00:00.000Z');
  d.setUTCDate(d.getUTCDate() + 15);
  return d.toISOString().slice(0, 10);
}

function assertMeteoFutureCap(startDate, endDate) {
  const today = utcTodayISO();
  const maxF = meteoMaxForecastEndISO();
  if (endDate < today) return;
  if (startDate > maxF || endDate > maxF) {
    throw new Error(`Open‑Meteo forecast is limited to 16 days from today (through ${maxF}). Narrow your future dates.`);
  }
}

function stubConditionsFromDay(day) {
  return {
    icon: day?.icon || '',
    temp: day?.tempmax ?? null,
    feelslike: null,
    conditions: day?.conditions || '—',
    humidity: null,
    windspeed: day?.windspeed ?? null,
    visibility: null,
    pressure: null,
    cloudcover: day?.cloudcover ?? null,
    precip: day?.precip ?? 0,
  };
}

function meteoCurrentFromForecastResponse(data) {
  const cw = data.current_weather || {};
  const wxNow = meteoWeather(cw.weathercode);
  const hourlyData = data.hourly || {};
  const times = hourlyData.time || [];
  let bestIdx = 0;
  let bestDiff = Infinity;
  const now = Date.now();
  for (let i = 0; i < times.length; i++) {
    const t = new Date(times[i]).getTime();
    const diff = Math.abs(t - now);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  const app = hourlyData.apparent_temperature?.[bestIdx];
  const rh = hourlyData.relative_humidity_2m?.[bestIdx];
  const hCloud = hourlyData.cloud_cover?.[bestIdx];
  const pressure = hourlyData.surface_pressure?.[bestIdx];
  const hprecip = hourlyData.precipitation?.[bestIdx];
  const visM = hourlyData.visibility?.[bestIdx];
  const hwind = hourlyData.windspeed_10m?.[bestIdx];

  return {
    icon: wxNow.iconKey,
    temp: cw.temperature != null ? Number(cw.temperature) : null,
    feelslike: app != null ? Number(app) : (cw.temperature != null ? Number(cw.temperature) : null),
    conditions: wxNow.conditions,
    humidity: rh != null ? Number(rh) : null,
    windspeed: cw.windspeed != null ? Number(cw.windspeed) : (hwind != null ? Number(hwind) : null),
    visibility: visM != null ? Number(visM) / 1000 : null,
    pressure: pressure != null ? Number(pressure) : null,
    cloudcover: hCloud != null ? Number(hCloud) : null,
    precip: hprecip != null ? Number(hprecip) : 0,
  };
}

// ── OPENWEATHER: current conditions only ───────────────────────

async function tryOpenWeatherCurrent(location) {
  if (!OW_KEY || OW_KEY === 'PASTE_OPENWEATHER_API_KEY_HERE') return null;

  const q = normalizeOpenWeatherQuery(location);
  const base = 'https://api.openweathermap.org/data/2.5';
  const commonParams = `appid=${encodeURIComponent(OW_KEY)}&units=metric&lang=en`;

  let url;
  if (isCoordsQuery(q)) {
    const [lat, lon] = q.split(',').map(s => s.trim());
    url = `${base}/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&${commonParams}`;
  } else {
    url = `${base}/weather?q=${encodeURIComponent(q)}&${commonParams}`;
  }

  const res = await fetch(url);
  if (!res.ok) return null;

  const j = await res.json();
  const w = j.weather?.[0] || {};
  const main = j.main || {};
  const wind = j.wind || {};
  const clouds = j.clouds || {};
  const rain = j.rain || {};
  const precip = rain['1h'] != null ? rain['1h'] : (rain['3h'] != null ? rain['3h'] : null);
  const addr = j.name && j.sys?.country ? `${j.name}, ${j.sys.country}` : q;

  return {
    resolvedAddress: addr,
    currentConditions: {
      icon: w.icon || '',
      temp: main.temp,
      feelslike: main.feels_like,
      conditions: w.description || w.main || '—',
      humidity: main.humidity,
      windspeed: wind.speed != null ? wind.speed * 3.6 : null,
      visibility: j.visibility != null ? j.visibility / 1000 : null,
      pressure: main.pressure,
      cloudcover: clouds.all,
      precip: precip != null ? precip : 0,
    },
  };
}

// ── OPEN‑METEO: geocode + forecast + archive ──────────────────────────────

async function geocodeMeteo(query) {
  let q = (query || '').trim();
  if (!q) throw new Error('Please enter a location.');
  if (isCoordsQuery(q)) {
    const [lat, lon] = q.split(',').map(s => parseFloat(s.trim()));
    return { name: q, country: '', admin1: '', latitude: lat, longitude: lon };
  }
  const m = q.match(/^(.+?),\s*([A-Za-z]{2})\s*$/);
  let url;
  let desiredAdmin1Code = null;
  if (m) {
    const city = m[1].trim();
    desiredAdmin1Code = m[2].toUpperCase();
    url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=en&format=json&country=US`;
  } else {
    url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed (${res.status}). Please try again.`);
  const data = await res.json();
  let hit = data?.results?.[0];
  if (desiredAdmin1Code && Array.isArray(data?.results) && data.results.length) {
    hit = data.results.find(r => (r.admin1_code || '').toUpperCase() === desiredAdmin1Code) || data.results[0];
  }
  if (!hit) throw new Error(`Location "${query}" not found. Try a different city, zip code, or coordinates.`);
  return hit;
}

async function fetchMeteoForecastDailyRange(location, startDate, endDate, options = {}) {
  const s = toISODate(startDate);
  const e = toISODate(endDate);
  if (!s || !e) throw new Error('Invalid date selection.');
  if (e < s) throw new Error('End date cannot be before start date.');

  assertMeteoFutureCap(s, e);

  const withLive = options.withLive === true;
  const place = await geocodeMeteo(location);
  const lat = place.latitude;
  const lon = place.longitude;
  const resolvedAddress = [place.name, place.admin1, place.country].filter(Boolean).join(', ');

  const dailyVars = [
    'weathercode',
    'temperature_2m_max',
    'temperature_2m_min',
    'precipitation_sum',
    'windspeed_10m_max',
    'sunrise',
    'sunset',
    'precipitation_probability_max',
    'cloud_cover_mean',
  ].join(',');

  let url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}`
    + `&start_date=${encodeURIComponent(s)}&end_date=${encodeURIComponent(e)}`
    + `&daily=${encodeURIComponent(dailyVars)}&timezone=auto`;

  if (withLive) {
    const hourly = [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'cloud_cover',
      'surface_pressure',
      'precipitation',
      'visibility',
      'windspeed_10m',
    ].join(',');
    url += `&current_weather=true&hourly=${encodeURIComponent(hourly)}`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open‑Meteo forecast failed (${res.status}). Please try again.`);
  const data = await res.json();

  const days = parseMeteoDailyDays(data);
  if (!days.length) throw new Error('No forecast data returned for that range.');

  let currentConditions = stubConditionsFromDay(days[0]);
  if (withLive) currentConditions = meteoCurrentFromForecastResponse(data);

  return { resolvedAddress, currentConditions, days };
}

/** Today tab: Meteo daily 5‑day strip + chart + live hero from OpenWeather */
async function fetchTodayView(location) {
  const startDate = utcTodayISO();
  const endDate = new Date(Date.now() + 4 * 864e5).toISOString().slice(0, 10);

  const meteo = await fetchMeteoForecastDailyRange(location, startDate, endDate, { withLive: true });

  const ow = await tryOpenWeatherCurrent(location);
  if (ow) {
    return {
      resolvedAddress: ow.resolvedAddress || meteo.resolvedAddress,
      currentConditions: ow.currentConditions,
      days: meteo.days,
    };
  }

  return meteo;
}

async function fetchMeteoArchiveOnly(location, startDate, endDate) {
  const s = toISODate(startDate);
  const e = toISODate(endDate);
  if (!s || !e) throw new Error('Invalid date selection.');
  if (e < s) throw new Error('End date cannot be before start date.');

  const today = utcTodayISO();
  if (e >= today) {
    throw new Error('Internal: archive request included today or future dates.');
  }

  const place = await geocodeMeteo(location);
  const lat = place.latitude;
  const lon = place.longitude;
  const resolvedAddress = [place.name, place.admin1, place.country].filter(Boolean).join(', ');

  const daily = [
    'weathercode',
    'temperature_2m_max',
    'temperature_2m_min',
    'precipitation_sum',
    'windspeed_10m_max',
    'sunrise',
    'sunset',
    'precipitation_probability_max',
    'cloud_cover_mean',
  ].join(',');

  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}`
    + `&start_date=${encodeURIComponent(s)}&end_date=${encodeURIComponent(e)}`
    + `&daily=${encodeURIComponent(daily)}&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open‑Meteo archive request failed (${res.status}). Please try again.`);
  const d = await res.json();

  const days = parseMeteoDailyDays(d);
  if (!days.length) throw new Error('No historical data returned for that date range.');

  return {
    resolvedAddress,
    currentConditions: stubConditionsFromDay(days[0]),
    days,
  };
}

/** Past → archive; today/future → forecast up to 16 days */
async function fetchWeatherRange(location, startDate, endDate) {
  const s = toISODate(startDate);
  const e = toISODate(endDate);
  if (!s || !e) throw new Error('Invalid date selection.');
  if (e < s) throw new Error('End date cannot be before start date.');

  const today = utcTodayISO();
  const yesterday = (() => {
    const d = new Date(today + 'T12:00:00.000Z');
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  if (e < today) {
    return fetchMeteoArchiveOnly(location, s, e);
  }

  if (s >= today) {
    return fetchMeteoForecastDailyRange(location, s, e, { withLive: false });
  }

  const days = [];
  let resolvedAddress = '';
  const archiveEnd = minISODate(e, yesterday);
  if (s <= archiveEnd) {
    const arch = await fetchMeteoArchiveOnly(location, s, archiveEnd);
    days.push(...arch.days);
    resolvedAddress = arch.resolvedAddress;
  }

  const futStart = maxISODate(s, today);
  if (futStart <= e) {
    const fut = await fetchMeteoForecastDailyRange(location, futStart, e, { withLive: false });
    days.push(...fut.days);
    resolvedAddress = fut.resolvedAddress || resolvedAddress;
  }

  days.sort((a, b) => a.datetime.localeCompare(b.datetime));

  if (!days.length) throw new Error('No data returned for that date range.');

  return {
    resolvedAddress,
    currentConditions: stubConditionsFromDay(days[0]),
    days,
  };
}
