# Atmos — Weather App

**Author:** Allen Xu

Built for the **PM Accelerator** technical assessment.

---

## Overview

Atmos is a responsive weather web app with three core features:

- **Today** — Live current conditions, detailed stats (humidity, wind, visibility, pressure, cloud cover, precipitation), sunrise/sunset, 5-day forecast with an interactive temperature chart. Click any forecast day for a full breakdown.
- **Forecast & History** — Look up weather for any date range — past or future. Uses Open-Meteo archive for historical data and their forecast API for up to ~16 days ahead. Includes a daily breakdown, summary table, and high/low chart.
- **Weather Assistant** — A rule-based chat assistant that answers questions about the loaded forecast. Ask what to wear, whether a specific activity is a good idea ("should I go hiking?", "can I have a picnic?"), get activity ideas, or ask meteorology questions. Covers 20+ activities with temperature-aware responses.

---

## Getting Started

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd <cloned-folder>   # directory that contains index.html
```

### 2. Add your OpenWeather API key

The app works without a key because it falls back to Open-Meteo for all data. But adding an OpenWeather key unlocks richer real-time data on the Today tab (live temperature, feels like, humidity, wind, pressure, and visibility).

```bash
cp config.example.js config.js
```

Then open `config.js` and replace the placeholder:

```js
window.OW_KEY = 'your_key_here';
```

Get a free key at [openweathermap.org/api](https://openweathermap.org/api). Note: new keys take up to 2 hours to activate.

### 3. Run the app

The app is static HTML/JS, so there is no build step. Dependencies load from the internet via CDN, so you need a network connection.

**Recommended: serve the folder over HTTP**

Some browsers block or limit `fetch()` when the page is opened as a `file://` URL. Using a tiny local server avoids that and matches how you’d deploy to real hosting.

From the project root (the folder that contains `index.html`):

```bash
# Node.js (no global install; npx downloads serve on the fly)
npx --yes serve .

# Or Python 3
python -m http.server 8080
```

- **`serve`:** the terminal prints a URL (often `http://localhost:3000`). Open that link — if the port differs, use whatever it shows.
- **Python:** open `http://localhost:8080` and click `index.html`, or go to `http://localhost:8080/index.html`.

**Alternative: open `index.html` directly**

Open `index.html` in Chrome, Edge, or Firefox. This is fine on many setups; if searches fail silently or the console shows CORS/network errors, switch to a local server above.

No `npm install` or project `package.json` is required.

---

## Features

| Feature | Details |
|---|---|
| Location search | City name, zip code, landmark, or `lat,lon` GPS coordinates |
| Use my location | Browser geolocation API with reverse geocoding |
| °C / °F toggle | Converts all values live including charts |
| 5-day forecast | Tap any clickable card for full stats |
| Date range | Past dates use Open-Meteo archive; future uses their 16-day forecast |
| Weather Assistant | Outfit advice, activity checks, meteorology Q&A, wardrobe helper |
| Responsive | Works on desktop, tablet, and mobile |
| Error handling | Invalid locations, API failures, and date validation all handled |

---

## Tech Stack

| | |
|---|---|
| **Language** | Plain HTML / CSS / JavaScript — no framework, no build step |
| **Weather data** | [Open-Meteo](https://open-meteo.com) (free, no key — geocoding, archive, forecast) |
| **Current conditions** | [OpenWeather](https://openweathermap.org) (optional key — live now data) |
| **Charts** | [Chart.js](https://www.chartjs.org) via CDN |

---

## Project Structure

```
atmos/
├── index.html           # App shell — tabs, search, modals
├── css/
│   └── styles.css       # All styling + responsive breakpoints
├── js/
│   ├── utils.js         # Helper functions, unit conversions
│   ├── ui.js            # State, mode switching, error/loading handlers
│   ├── api.js           # Weather fetching and geocoding
│   ├── render.js        # DOM rendering (current, range, outfit views)
│   ├── chat.js          # Weather assistant logic
│   └── main.js          # Search handlers, geolocation, init
├── config.js            # Your API key — gitignored, never committed
├── config.example.js    # Template for config.js — safe to commit
└── .gitignore
```

---

## API Key Security

`config.js` is listed in `.gitignore` so your key is never committed to GitHub. Reviewers should copy `config.example.js` to `config.js` and add their own key.
