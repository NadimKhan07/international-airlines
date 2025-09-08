// Weather JavaScript

// Constants
const API_BASE_URL = "/api/weather"

// Load weather data
async function loadWeatherData() {
  await loadDefaultWeather()
}

// Initialize Weather Section
function initializeWeather() {
  // Set up event listeners for weather search
  const citySearch = document.getElementById("citySearch")
  if (citySearch) {
    citySearch.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        searchWeather()
      }
    })
  }

  // Load default weather
  loadDefaultWeather()
}

// Load Default Weather
function loadDefaultWeather() {
  const defaultCities = ["Dhaka", "New York", "London", "Tokyo"]
  const randomCity = defaultCities[Math.floor(Math.random() * defaultCities.length)]
  searchWeather(randomCity)
}

// Load Dhaka weather
async function loadDhakaWeather() {
  try {
    const response = await fetch(`${API_BASE_URL}/dhaka`)
    if (response.ok) {
      const weather = await response.json()
      displayDhakaWeather(weather)
      updateWeatherStatus(weather)
      checkWeatherAlerts(weather)
      saveWeatherHistory(weather)
    } else {
      displayWeatherError()
    }
  } catch (error) {
    console.error("Error loading weather:", error)
    displayWeatherError()
  }
}

// Display Dhaka weather
function displayDhakaWeather(weather) {
  document.querySelector(".weather-temp").textContent = Math.round(weather.main.temp) + "°C"
  document.querySelector(".weather-desc").textContent = weather.weather[0].description
  document.getElementById("humidity").textContent = weather.main.humidity
  document.getElementById("windSpeed").textContent = Math.round(weather.wind.speed * 3.6) // Convert m/s to km/h
  document.getElementById("visibility").textContent = weather.visibility
    ? (weather.visibility / 1000).toFixed(1)
    : "N/A"
}

// Update weather status in dashboard
function updateWeatherStatus(weather) {
  const temp = Math.round(weather.main.temp)
  const condition = weather.weather[0].main
  const statusElement = document.getElementById("weatherStatus")

  if (statusElement) {
    statusElement.textContent = `${temp}°C, ${condition}`

    // Color code based on conditions
    if (condition === "Clear") {
      statusElement.style.color = "var(--success)"
    } else if (condition === "Rain" || condition === "Thunderstorm") {
      statusElement.style.color = "var(--error)"
    } else {
      statusElement.style.color = "var(--warning)"
    }
  }
}

// Display weather error
function displayWeatherError() {
  document.querySelector(".weather-temp").textContent = "N/A"
  document.querySelector(".weather-desc").textContent = "Weather data unavailable"
  document.getElementById("humidity").textContent = "-"
  document.getElementById("windSpeed").textContent = "-"
  document.getElementById("visibility").textContent = "-"

  const statusElement = document.getElementById("weatherStatus")
  if (statusElement) {
    statusElement.textContent = "Unavailable"
    statusElement.style.color = "var(--gray)"
  }
}

// Search city weather
async function searchWeather(city) {
  if (!city) {
    city = document.getElementById("citySearch").value.trim()
  }

  if (!city) {
    showMessage("Please enter a city name", "error")
    return
  }

  try {
    showLoading(true)
    const response = await fetch(`${API_BASE_URL}/${encodeURIComponent(city)}`)
    if (response.ok) {
      const weather = await response.json()
      displaySearchWeatherResult(weather)
      checkWeatherAlerts(weather)
      saveWeatherHistory(weather)
    } else {
      showMessage("Weather data not found for this city.", "error")
    }
  } catch (error) {
    console.error("Error searching weather:", error)
    showMessage("Error fetching weather data. Please try again.", "error")
  } finally {
    showLoading(false)
  }
}

// Enhanced Search Weather with Forecast
async function searchWeatherWithForecast(city) {
  if (!city) {
    city = document.getElementById("citySearch").value.trim()
  }

  if (!city) {
    showMessage("Please enter a city name", "error")
    return
  }

  try {
    showLoading(true)

    // Get current weather and forecast
    const [weatherResponse, forecastResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/${encodeURIComponent(city)}`),
      fetch(`${API_BASE_URL}/${encodeURIComponent(city)}/forecast`),
    ])

    if (weatherResponse.ok) {
      const weatherData = await weatherResponse.json()
      updateWeatherCard(weatherData.weather)

      if (weatherData.note) {
        showMessage(weatherData.note, "info")
      }
    }

    if (forecastResponse.ok) {
      const forecastData = await forecastResponse.json()
      updateWeatherForecast(forecastData.forecast)

      if (forecastData.note) {
        showMessage(forecastData.note, "info")
      }
    }
  } catch (error) {
    console.error("Weather error:", error)
    showMessage("Error loading weather data", "error")
  } finally {
    showLoading(false)
  }
}

// Display search weather result
function displaySearchWeatherResult(weather) {
  const resultDiv = document.getElementById("searchWeatherResult")
  resultDiv.innerHTML = `
        <h3>${weather.name}, ${weather.sys.country}</h3>
        <div class="weather-info">
            <div class="weather-temp">${Math.round(weather.main.temp)}°C</div>
            <div class="weather-desc">${weather.weather[0].description}</div>
            <div class="weather-details">
                <span>Humidity: ${weather.main.humidity}%</span>
                <span>Wind: ${Math.round(weather.wind.speed * 3.6)} km/h</span>
                <span>Feels like: ${Math.round(weather.main.feels_like)}°C</span>
            </div>
        </div>
    `
  resultDiv.classList.remove("hidden")
}

// Update Weather Card
function updateWeatherCard(weather) {
  const weatherContainer = document.getElementById("weatherCard")
  if (!weatherContainer || !weather) return

  const weatherHTML = `
        <div class="weather-item">
            <div class="weather-temp">${Math.round(weather.main.temp)}°C</div>
            <div class="weather-desc">${weather.weather[0].description}</div>
            <div class="weather-details">
                <span>Humidity: ${weather.main.humidity}%</span>
                <span>Wind: ${Math.round(weather.wind.speed * 3.6)} km/h</span>
                <span>Visibility: ${weather.visibility ? (weather.visibility / 1000).toFixed(1) : "N/A"} km</span>
            </div>
        </div>
    `

  weatherContainer.innerHTML = weatherHTML
}

// Update Weather Forecast
function updateWeatherForecast(forecast) {
  const forecastContainer = document.getElementById("weatherForecast")
  if (!forecastContainer || !forecast) return

  const forecastHTML = forecast
    .map(
      (day) => `
        <div class="forecast-item">
            <div class="forecast-date">${formatForecastDate(day.date)}</div>
            <div class="forecast-icon">
                <i class="fas fa-${getWeatherIcon(day.icon)}"></i>
            </div>
            <div class="forecast-temp">${day.temperature}°C</div>
            <div class="forecast-desc">${day.description}</div>
        </div>
    `,
    )
    .join("")

  forecastContainer.innerHTML = forecastHTML
}

// Format Forecast Date
function formatForecastDate(dateString) {
  const date = new Date(dateString)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) {
    return "Today"
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow"
  } else {
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  }
}

// Get Weather Icon
function getWeatherIcon(iconCode) {
  // This function would map icon codes to icon names
  // For now, return a placeholder icon name
  return "sun"
}

// Weather Alert System
function checkWeatherAlerts(weather) {
  const alerts = []

  // Temperature alerts
  if (weather.main.temp > 35) {
    alerts.push({
      type: "warning",
      message: "High temperature alert: Extreme heat conditions",
    })
  } else if (weather.main.temp < 0) {
    alerts.push({
      type: "warning",
      message: "Low temperature alert: Freezing conditions",
    })
  }

  // Wind alerts
  if (weather.wind.speed > 15) {
    alerts.push({
      type: "warning",
      message: "High wind alert: Strong winds may affect flights",
    })
  }

  // Visibility alerts
  if (weather.visibility < 5000) {
    alerts.push({
      type: "danger",
      message: "Low visibility alert: Poor visibility conditions",
    })
  }

  // Display alerts
  displayWeatherAlerts(alerts)
}

// Display Weather Alerts
function displayWeatherAlerts(alerts) {
  const alertContainer = document.getElementById("weatherAlerts")
  if (!alertContainer) return

  if (alerts.length === 0) {
    alertContainer.innerHTML = ""
    return
  }

  const alertsHTML = alerts
    .map(
      (alert) => `
        <div class="weather-alert alert-${alert.type}">
            <i class="fas fa-exclamation-triangle"></i>
            <span>${alert.message}</span>
        </div>
    `,
    )
    .join("")

  alertContainer.innerHTML = alertsHTML
}

// Weather History
function saveWeatherHistory(weather) {
  const history = JSON.parse(localStorage.getItem("weatherHistory") || "[]")

  // Add new entry
  history.unshift({
    city: weather.name,
    country: weather.sys.country,
    temperature: weather.main.temp,
    description: weather.weather[0].description,
    timestamp: new Date().toISOString(),
  })

  // Keep only last 10 entries
  if (history.length > 10) {
    history.splice(10)
  }

  localStorage.setItem("weatherHistory", JSON.stringify(history))
  updateWeatherHistory()
}

// Update Weather History Display
function updateWeatherHistory() {
  const historyContainer = document.getElementById("weatherHistory")
  if (!historyContainer) return

  const history = JSON.parse(localStorage.getItem("weatherHistory") || "[]")

  if (history.length === 0) {
    historyContainer.innerHTML = '<div class="no-history">No recent searches</div>'
    return
  }

  const historyHTML = history
    .map(
      (entry) => `
        <div class="history-item" onclick="searchWeather('${entry.city}')">
            <div class="history-city">${entry.city}${entry.country ? ", " + entry.country : ""}</div>
            <div class="history-temp">${entry.temperature}°C</div>
            <div class="history-time">${formatRelativeTime(entry.timestamp)}</div>
        </div>
    `,
    )
    .join("")

  historyContainer.innerHTML = historyHTML
}

// Format Relative Time
function formatRelativeTime(timestamp) {
  const now = new Date()
  const time = new Date(timestamp)
  const diffMs = now - time
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return time.toLocaleDateString()
}

// Weather Comparison
function compareWeather(city1, city2) {
  // This would compare weather between two cities
  // Implementation would involve fetching both weather data and displaying comparison
  console.log(`Comparing weather between ${city1} and ${city2}`)
}

// Weather Map Integration
function showWeatherMap(city) {
  // This would integrate with a weather map service
  // For now, just show a placeholder
  showMessage("Weather map feature coming soon!", "info")
}

// Show Loading Indicator
function showLoading(isLoading) {
  const loadingIndicator = document.getElementById("loadingIndicator")
  if (loadingIndicator) {
    loadingIndicator.style.display = isLoading ? "block" : "none"
  }
}

// Show Message
function showMessage(message, type) {
  const messageContainer = document.getElementById("messageContainer")
  if (!messageContainer) return

  messageContainer.innerHTML = `
        <div class="message message-${type}">
            <span>${message}</span>
        </div>
    `
}

// Allow Enter key for weather search
document.getElementById("citySearch").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchWeather()
  }
})

// Initialize weather when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("weather")) {
    initializeWeather()
  }
})
