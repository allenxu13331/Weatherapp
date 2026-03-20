// utils.js — helper functions, constants, unit conversions

function condEmoji(icon) {
  const map = {
    'clear-day':'☀️','clear-night':'🌙','partly-cloudy-day':'⛅','partly-cloudy-night':'🌤️',
    'cloudy':'☁️','overcast':'☁️','fog':'🌫️','wind':'💨',
    'rain':'🌧️','showers-day':'🌦️','showers-night':'🌧️',
    'thunder-rain':'⛈️','thunder-showers-day':'⛈️','thunder-showers-night':'⛈️',
    'snow':'❄️','snow-showers-day':'🌨️','snow-showers-night':'🌨️',
    'sleet':'🌨️','hail':'🌨️',
    // OpenWeather icon codes
    '01d':'☀️','01n':'🌙',
    '02d':'⛅','02n':'🌤️',
    '03d':'⛅','03n':'🌤️',
    '04d':'☁️','04n':'☁️',
    '09d':'🌧️','09n':'🌧️',
    '10d':'🌦️','10n':'🌧️',
    '11d':'⛈️','11n':'⛈️',
    '13d':'🌨️','13n':'🌨️',
    '50d':'🌫️','50n':'🌫️',
  };
  return map[icon] || '🌡️';
}

// Metric or Imperial units conversion
const cToF = c => c * 9/5 + 32;
function disp(c) {
  if (c == null) return '—';
  return unit === 'C' ? c.toFixed(1) + '°C' : cToF(c).toFixed(1) + '°F';
}
function windDisp(kmh) {
  if (kmh == null) return '—';
  return unit === 'C' ? kmh.toFixed(1) + ' km/h' : (kmh * 0.621371).toFixed(1) + ' mph';
}
function visDisp(km) {
  if (km == null) return '—';
  return unit === 'C' ? km.toFixed(1) + ' km' : (km * 0.621371).toFixed(1) + ' mi';
}
function precipDisp(mm) {
  if (mm == null) return '—';
  return unit === 'C' ? mm.toFixed(1) + ' mm' : (mm / 25.4).toFixed(2) + ' in';
}
