const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const statusMsg = document.getElementById("statusMsg");
const currentCard = document.getElementById("currentCard");
const cityNameEl = document.getElementById("cityName");
const tempEl = document.getElementById("temp");
const windEl = document.getElementById("wind");
const conditionEl = document.getElementById("condition");
const forecastBody = document.getElementById("forecastBody");

// Stretch Goal: Unit Toggle Elements & State
const unitToggle = document.getElementById("unitToggle");
const thMax = document.getElementById("thMax");
const thMin = document.getElementById("thMin");
let isCelsius = true;
let lastPlace = null;
let lastWeatherData = null;

// ============================================================
// TASK 1 — WEATHER CODE DESCRIPTION
// ============================================================

function describeWeatherCode(code) {
  if (code === 0) return "Clear sky";
  if (code >= 1 && code <= 3) return "Partly cloudy";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 95 && code <= 99) return "Thunderstorm";
  return "Unknown";
}

// ============================================================
// TASK 2 — STATUS MESSAGE
// ============================================================

function setStatus(message, isError = false) {
  statusMsg.textContent = message;
  if (isError) {
    statusMsg.classList.add("error");
  } else {
    statusMsg.classList.remove("error");
  }
}

// Helper function to format temperature according to current unit (°C / °F)
function formatTemp(celsius) {
  if (isCelsius) {
    return `${Math.round(celsius)} °C`;
  } else {
    const fahrenheit = (celsius * 9) / 5 + 32;
    return `${Math.round(fahrenheit)} °F`;
  }
}

// ============================================================
// API FUNCTION 1 — GEOCODING
// ============================================================

async function geocodeCity(city) {
  const url =
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Geocoding request failed");
  }

  const data = await res.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("City not found — try another name.");
  }

  return data.results[0];
}

// ============================================================
// API FUNCTION 2 — WEATHER FORECAST
// ============================================================

async function fetchForecast(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current_weather=true` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&timezone=auto`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Forecast request failed");
  }

  return res.json();
}

// ============================================================
// TASK 3 — DISPLAY CURRENT WEATHER
// ============================================================

function renderCurrentWeather(place, weatherData) {
  const current = weatherData.current_weather;
  const locationText = place.country ? `${place.name}, ${place.country}` : place.name;

  cityNameEl.textContent = locationText;
  tempEl.textContent = formatTemp(current.temperature);
  windEl.textContent = `${current.windspeed} km/h`;
  conditionEl.textContent = describeWeatherCode(current.weathercode);

  currentCard.classList.remove("hidden");
}

// ============================================================
// TASK 4 — CREATE THE FORECAST TABLE
// ============================================================

function renderForecastTable(daily) {
  // 3. Clear previous rows before inserting new ones
  forecastBody.innerHTML = "";

  // 1. Loop over the parallel arrays using their shared index (5 days)
  const count = Math.min(5, daily.time.length);

  for (let i = 0; i < count; i++) {
    // 2. Create a new <tr> element
    const row = document.createElement("tr");

    // Extract values using index i
    const date = daily.time[i];
    const condition = describeWeatherCode(daily.weathercode[i]);
    const maxTemp = formatTemp(daily.temperature_2m_max[i]);
    const minTemp = formatTemp(daily.temperature_2m_min[i]);
    const precip = daily.precipitation_sum[i] ?? 0;

    // 4. Stretch goal: highlight rainy days (precipitation > 0) with class "rainy"
    if (precip > 0) {
      row.classList.add("rainy");
    }

    // Five <td> cells
    row.innerHTML = `
      <td>${date}</td>
      <td>${condition}</td>
      <td>${maxTemp}</td>
      <td>${minTemp}</td>
      <td>${precip} mm</td>
    `;

    // Append to <tbody>
    forecastBody.appendChild(row);
  }
}

// ============================================================
// TASK 5 — HANDLE SEARCH
// ============================================================

async function handleSearch() {
  const city = cityInput.value.trim();

  // If input is empty
  if (!city) {
    setStatus("Please type a city name.", true);
    return;
  }

  // Hide current card & clear old forecast rows before new search
  currentCard.classList.add("hidden");
  forecastBody.innerHTML = "";
  setStatus("Loading…", false);

  try {
    // Step 1: Geocoding (get coordinates)
    const place = await geocodeCity(city);

    // Step 2: Fetch forecast using coordinates
    const weatherData = await fetchForecast(place.latitude, place.longitude);

    // Save references for unit toggle re-rendering
    lastPlace = place;
    lastWeatherData = weatherData;

    // Step 3: Render current weather & forecast table
    renderCurrentWeather(place, weatherData);
    renderForecastTable(weatherData.daily);

    // Clear loading message
    setStatus("", false);

  } catch (error) {
    // Show friendly error message
    setStatus(error.message, true);
  }
}

// ============================================================
// STRETCH GOAL — °C / °F TOGGLE BUTTON
// ============================================================

if (unitToggle) {
  unitToggle.addEventListener("click", () => {
    // Toggle the unit state
    isCelsius = !isCelsius;

    // Update button text
    unitToggle.textContent = isCelsius ? "Switch to °F" : "Switch to °C";

    // Update table headers
    if (thMax) thMax.textContent = isCelsius ? "Max °C" : "Max °F";
    if (thMin) thMin.textContent = isCelsius ? "Min °C" : "Min °F";

    // If data has already been loaded, re-render with new unit
    if (lastPlace && lastWeatherData) {
      renderCurrentWeather(lastPlace, lastWeatherData);
      renderForecastTable(lastWeatherData.daily);
    }
  });
}

// ============================================================
// TASK 6 & 7 — EVENT LISTENERS
// ============================================================

searchBtn.addEventListener("click", handleSearch);

cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    handleSearch();
  }
});
