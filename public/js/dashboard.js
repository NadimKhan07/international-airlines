// Dashboard JavaScript
const API_BASE_URL = "http://localhost:5000/api"

let currentUser = null
let authToken = null
let flights = [] // Declare flights variable

// Initialize Dashboard
document.addEventListener("DOMContentLoaded", () => {
  initializeDashboard()
})

// Initialize Dashboard
async function initializeDashboard() {
  // Check authentication
  authToken = localStorage.getItem("authToken")
  const userData = localStorage.getItem("userData")

  if (!authToken || !userData) {
    window.location.href = "login.html"
    return
  }

  try {
    currentUser = JSON.parse(userData)
    updateUserWelcome()
    await loadDashboardData()
    setupEventListeners()
  } catch (error) {
    console.error("Dashboard initialization error:", error)
    logout()
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Profile form submission
  const profileForm = document.getElementById("profileForm")
  if (profileForm) {
    profileForm.addEventListener("submit", handleProfileUpdate)
  }

  // Add flight form submission
  const addFlightForm = document.getElementById("addFlightForm")
  if (addFlightForm) {
    addFlightForm.addEventListener("submit", handleAddFlight) // Declare handleAddFlight function
  }
}

// Update User Welcome Message
function updateUserWelcome() {
  const userWelcome = document.getElementById("userWelcome")
  if (userWelcome && currentUser) {
    userWelcome.textContent = `Welcome, ${currentUser.firstName}`
  }
}

// Navigation functions
function showSection(sectionId) {
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.remove("active")
  })
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active")
  })

  document.getElementById(sectionId).classList.add("active")
  // Declare event before using it
  const event = window.event
  event.target.classList.add("active")

  // Load section-specific data
  switch (sectionId) {
    case "flights":
      loadFlightsSection() // Declare loadFlightsSection function
      break
    case "tickets":
      loadTicketPricing()
      break
    case "activity":
      loadLoginActivity() // Declare loadLoginActivity function
      break
    case "profile":
      loadUserProfile()
      loadLoginActivities()
      break
    case "performance":
      loadPerformanceData()
      break
    case "weather":
      loadWeatherSection()
      break
  }
}

function goHome() {
  showSection("dashboard")
  document.querySelector(".nav-link").classList.add("active")
}

function logout() {
  localStorage.removeItem("authToken")
  localStorage.removeItem("userData")
  window.location.href = "login.html"
}

// Dashboard data loading
async function loadDashboardData() {
  try {
    showLoading(true)

    // Load all dashboard data concurrently
    await Promise.all([loadFlightStats(), loadRecentFlights(), loadUserProfile(), loadLoginActivities()])
  } catch (error) {
    console.error("Error loading dashboard data:", error)
    showMessage("Error loading dashboard data", "error")
  } finally {
    showLoading(false)
  }
}

// Load Flight Statistics
async function loadFlightStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/flights/stats/overview`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      updateStatsCards(data.overview)
      flights = data.recentFlights // Update flights variable
      updateRecentFlightsList(data.recentFlights)
    }
  } catch (error) {
    console.error("Error loading flight stats:", error)
  }
}

// Update Stats Cards
function updateStatsCards(stats) {
  document.getElementById("totalFlights").textContent = stats.totalFlights || 0
  document.getElementById("activeFlights").textContent = stats.activeFlights || 0
  document.getElementById("delayedFlights").textContent = stats.delayedFlights || 0

  // Update total tickets from ticket stats if available
  loadTicketStats()
}

// Load Ticket Statistics
async function loadTicketStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/stats/overview`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      document.getElementById("totalTickets").textContent = data.overview.totalTickets || 0

      // Update revenue if available
      const totalRevenue = data.revenueStats.reduce((sum, item) => sum + item.totalRevenue, 0)
      const revenueElement = document.getElementById("totalRevenue")
      if (revenueElement) {
        revenueElement.textContent = `$${totalRevenue.toLocaleString()}`
      }
    }
  } catch (error) {
    console.error("Error loading ticket stats:", error)
  }
}

// Load Recent Flights
async function loadRecentFlights() {
  try {
    const response = await fetch(`${API_BASE_URL}/flights`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      updateRecentFlightsList(data.flights.slice(0, 5))
    }
  } catch (error) {
    console.error("Error loading recent flights:", error)
  }
}

// Update Recent Flights List
function updateRecentFlightsList(flights) {
  const recentFlightsContainer = document.getElementById("recentFlights")
  if (!recentFlightsContainer) return

  if (!flights || flights.length === 0) {
    recentFlightsContainer.innerHTML = '<div class="loading">No recent flights found</div>'
    return
  }

  const flightsHTML = flights
    .map(
      (flight) => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-plane"></i>
            </div>
            <div class="activity-info">
                <h4>${flight.flightNumber} - ${flight.airline}</h4>
                <p>${flight.origin.city} → ${flight.destination.city}</p>
                <p><small>${formatDateTime(flight.departureTime)}</small></p>
            </div>
            <div class="status-badge status-${flight.status.toLowerCase()}">
                ${flight.status}
            </div>
        </div>
    `,
    )
    .join("")

  recentFlightsContainer.innerHTML = flightsHTML
}

// Profile management
async function loadUserProfile() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      updateProfileForm(data.user)
    }
  } catch (error) {
    console.error("Error loading user profile:", error)
  }
}

// Update Profile Form
function updateProfileForm(user) {
  document.getElementById("profileName").textContent = `${user.firstName} ${user.lastName}`
  document.getElementById("profileEmail").textContent = user.email
  document.getElementById("profileFirstName").value = user.firstName
  document.getElementById("profileLastName").value = user.lastName

  if (user.dateOfBirth) {
    const date = new Date(user.dateOfBirth)
    document.getElementById("profileDateOfBirth").value = date.toISOString().split("T")[0]
  }
}

// Profile form handler
async function handleProfileUpdate(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const profileData = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    dateOfBirth: formData.get("dateOfBirth"),
  }

  try {
    showLoading(true)

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(profileData),
    })

    const data = await response.json()

    if (response.ok) {
      // Update stored user data
      currentUser = { ...currentUser, ...data.user }
      localStorage.setItem("userData", JSON.stringify(currentUser))

      updateUserWelcome()
      updateProfileForm(data.user)
      showMessage("Profile updated successfully!", "success")
    } else {
      showMessage(data.message || "Failed to update profile", "error")
    }
  } catch (error) {
    console.error("Profile update error:", error)
    showMessage("Network error. Please try again.", "error")
  } finally {
    showLoading(false)
  }
}

// Add flight handler
async function handleAddFlight(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const flightData = {
    flightNumber: formData.get("flightNumber"),
    airline: formData.get("airline"),
    origin: { city: formData.get("originCity"), country: formData.get("originCountry") },
    destination: { city: formData.get("destinationCity"), country: formData.get("destinationCountry") },
    departureTime: formData.get("departureTime"),
    status: formData.get("status"),
  }

  try {
    showLoading(true)

    const response = await fetch(`${API_BASE_URL}/flights`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(flightData),
    })

    const data = await response.json()

    if (response.ok) {
      flights.push(data.flight) // Update flights array
      updateRecentFlightsList(flights.slice(-5)) // Show last 5 flights
      showMessage("Flight added successfully!", "success")
      closeAddFlightModal()
    } else {
      showMessage(data.message || "Failed to add flight", "error")
    }
  } catch (error) {
    console.error("Flight addition error:", error)
    showMessage("Network error. Please try again.", "error")
  } finally {
    showLoading(false)
  }
}

// Load flights section
function loadFlightsSection() {
  // Load flights data
  loadFlightStats()
}

// Login activity
async function loadLoginActivities() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/activities`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      updateLoginActivities(data.activities)
    }
  } catch (error) {
    console.error("Error loading login activities:", error)
  }
}

// Update Login Activities
function updateLoginActivities(activities) {
  const activitiesContainer = document.getElementById("loginActivities")
  if (!activitiesContainer) return

  if (!activities || activities.length === 0) {
    activitiesContainer.innerHTML = '<div class="loading">No recent activities found</div>'
    return
  }

  const activitiesHTML = activities
    .map(
      (activity) => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-${activity.status === "success" ? "check-circle" : "times-circle"}"></i>
            </div>
            <div class="activity-info">
                <h4>${activity.status === "success" ? "Successful Login" : "Failed Login"}</h4>
                <p>${formatDateTime(activity.loginTime)}</p>
                <p><small>IP: ${activity.ipAddress}</small></p>
            </div>
        </div>
    `,
    )
    .join("")

  activitiesContainer.innerHTML = activitiesHTML
}

// Ticket pricing
async function loadTicketPricing() {
  // Generate sample ticket pricing data
  const samplePricing = [
    {
      route: "Dhaka - Dubai",
      aircraft: "Boeing 777",
      economy: { base: 45000, current: 48000 },
      business: { base: 120000, current: 125000 },
      firstClass: { base: 200000, current: 210000 },
    },
    {
      route: "Dhaka - London",
      aircraft: "Airbus A350",
      economy: { base: 65000, current: 70000 },
      business: { base: 180000, current: 185000 },
      firstClass: { base: 300000, current: 315000 },
    },
    {
      route: "Dhaka - Bangkok",
      aircraft: "Boeing 737",
      economy: { base: 25000, current: 27000 },
      business: { base: 65000, current: 68000 },
      firstClass: { base: 110000, current: 115000 },
    },
  ]

  const container = document.getElementById("ticketPricing")
  container.innerHTML = samplePricing
    .map(
      (pricing) => `
        <div class="pricing-card">
            <h3>${pricing.route}</h3>
            <p style="color: var(--gray); margin-bottom: 15px;">${pricing.aircraft}</p>
            <div class="price-class">
                <span>Economy Class</span>
                <span style="font-weight: bold; color: var(--primary-blue);">৳${pricing.economy.current.toLocaleString()}</span>
            </div>
            <div class="price-class">
                <span>Business Class</span>
                <span style="font-weight: bold; color: var(--primary-blue);">৳${pricing.business.current.toLocaleString()}</span>
            </div>
            <div class="price-class">
                <span>First Class</span>
                <span style="font-weight: bold; color: var(--primary-blue);">৳${pricing.firstClass.current.toLocaleString()}</span>
            </div>
        </div>
    `,
    )
    .join("")
}

// Performance data
function loadPerformanceData() {
  // Performance data is static for demo purposes
  // In a real application, this would come from the backend
  console.log("Performance data loaded")
}

// Safe route suggestions
function getSafeRoute() {
  const origin = document.getElementById("routeOrigin").value
  const destination = document.getElementById("routeDestination").value

  if (!origin || !destination) {
    alert("Please enter both origin and destination cities.")
    return
  }

  // Simulate AI route analysis
  const analysisDiv = document.getElementById("routeAnalysis")
  analysisDiv.innerHTML = `
        <h4>AI Route Analysis: ${origin} → ${destination}</h4>
        <ul>
            <li><span>Weather Conditions:</span> <span style="color: var(--success);">Favorable</span></li>
            <li><span>Air Traffic:</span> <span style="color: var(--warning);">Moderate</span></li>
            <li><span>Political Stability:</span> <span style="color: var(--success);">Stable</span></li>
            <li><span>Fuel Efficiency:</span> <span style="color: var(--success);">Optimal</span></li>
            <li><span>Safety Rating:</span> <span style="color: var(--success);">95%</span></li>
        </ul>
        <p style="margin-top: 15px; padding: 10px; background: var(--light-blue); border-radius: 8px;">
            <strong>Recommendation:</strong> Route is safe for travel. Consider alternative altitude of 35,000ft for better fuel efficiency.
        </p>
    `
  analysisDiv.classList.remove("hidden")
}

// Report generation
async function generateReport() {
  try {
    // In a real application, this would generate a PDF report
    const reportData = {
      date: new Date().toLocaleDateString(),
      totalFlights: flights.length,
      onTimeFlights: flights.filter((f) => f.status === "On Time").length,
      delayedFlights: flights.filter((f) => f.status === "Delayed").length,
      cancelledFlights: flights.filter((f) => f.status === "Cancelled").length,
      totalPassengers: flights.reduce((sum, f) => sum + (f.passengers?.total || 0), 0),
    }

    // Create a simple text report (in a real app, you'd use jsPDF or similar)
    const reportContent = `
INTERNATIONAL AIRLINES - DAILY PERFORMANCE REPORT
Date: ${reportData.date}
Airport: Hazrat Shahjalal International Airport, Dhaka

FLIGHT STATISTICS:
- Total Flights: ${reportData.totalFlights}
- On-Time Flights: ${reportData.onTimeFlights}
- Delayed Flights: ${reportData.delayedFlights}
- Cancelled Flights: ${reportData.cancelledFlights}
- Total Passengers: ${reportData.totalPassengers}

ON-TIME PERFORMANCE: ${reportData.totalFlights > 0 ? Math.round((reportData.onTimeFlights / reportData.totalFlights) * 100) : 0}%

Generated on: ${new Date().toLocaleString()}
        `

    // Create and download the report
    const blob = new Blob([reportContent], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Daily_Report_${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    alert("Daily report generated and downloaded successfully!")
  } catch (error) {
    console.error("Error generating report:", error)
    alert("Error generating report. Please try again.")
  }
}

// Modal functions
function showAddFlightModal() {
  const modal = document.getElementById("addFlightModal")
  if (modal) {
    modal.classList.add("show")
  }
}

function closeAddFlightModal() {
  const modal = document.getElementById("addFlightModal")
  if (modal) {
    modal.classList.remove("show")
    document.getElementById("addFlightForm").reset()
  }
}

// Close modal when clicking outside
window.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    e.target.classList.add("hidden")
  }
})

// Load Weather Section
function loadWeatherSection() {
  // Load default weather for Dhaka
  searchWeather("Dhaka")
}

// Search Weather
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

    const response = await fetch(`${API_BASE_URL}/weather/${encodeURIComponent(city)}`)
    const data = await response.json()

    if (response.ok) {
      updateWeatherCard(data.weather)
      if (data.note) {
        showMessage(data.note, "info")
      }
    } else {
      showMessage("Weather data not available", "error")
    }
  } catch (error) {
    console.error("Weather error:", error)
    showMessage("Error loading weather data", "error")
  } finally {
    showLoading(false)
  }
}

// Update Weather Card
function updateWeatherCard(weather) {
  const weatherCard = document.getElementById("weatherCard")
  if (!weatherCard) return

  const weatherHTML = `
        <div class="weather-icon">
            <i class="fas fa-${getWeatherIcon(weather.icon)}"></i>
        </div>
        <div class="weather-temp">${weather.temperature}°C</div>
        <div class="weather-desc">${weather.description}</div>
        <h3>${weather.city}${weather.country ? ", " + weather.country : ""}</h3>
        <div class="weather-details">
            <div class="weather-detail">
                <i class="fas fa-tint"></i>
                <span>Humidity: ${weather.humidity}%</span>
            </div>
            <div class="weather-detail">
                <i class="fas fa-wind"></i>
                <span>Wind: ${weather.windSpeed} m/s</span>
            </div>
            <div class="weather-detail">
                <i class="fas fa-thermometer-half"></i>
                <span>Pressure: ${weather.pressure} hPa</span>
            </div>
            <div class="weather-detail">
                <i class="fas fa-eye"></i>
                <span>Visibility: ${weather.visibility} km</span>
            </div>
        </div>
    `

  weatherCard.innerHTML = weatherHTML
}

// Get Weather Icon
function getWeatherIcon(iconCode) {
  const iconMap = {
    "01d": "sun",
    "01n": "moon",
    "02d": "cloud-sun",
    "02n": "cloud-moon",
    "03d": "cloud",
    "03n": "cloud",
    "04d": "cloud",
    "04n": "cloud",
    "09d": "cloud-rain",
    "09n": "cloud-rain",
    "10d": "cloud-sun-rain",
    "10n": "cloud-moon-rain",
    "11d": "bolt",
    "11n": "bolt",
    "13d": "snowflake",
    "13n": "snowflake",
    "50d": "smog",
    "50n": "smog",
  }

  return iconMap[iconCode] || "cloud"
}

// Show Loading
function showLoading(show) {
  const loadingOverlay = document.getElementById("loadingOverlay")
  if (loadingOverlay) {
    if (show) {
      loadingOverlay.classList.add("show")
    } else {
      loadingOverlay.classList.remove("show")
    }
  }
}

// Show Message
function showMessage(message, type = "info") {
  // Create message element
  const messageDiv = document.createElement("div")
  messageDiv.className = `message ${type}`
  messageDiv.textContent = message
  messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
    `

  // Set background color based on type
  switch (type) {
    case "success":
      messageDiv.style.background = "#28a745"
      break
    case "error":
      messageDiv.style.background = "#dc3545"
      break
    case "info":
      messageDiv.style.background = "#17a2b8"
      break
    default:
      messageDiv.style.background = "#6c757d"
  }

  document.body.appendChild(messageDiv)

  // Auto-remove message after 5 seconds
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.style.animation = "slideOutRight 0.3s ease-in"
      setTimeout(() => messageDiv.remove(), 300)
    }
  }, 5000)
}

// Utility Functions
function formatDateTime(dateString) {
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
  return new Date(dateString).toLocaleDateString("en-US", options)
}

function formatDate(dateString) {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }
  return new Date(dateString).toLocaleDateString("en-US", options)
}

// Add CSS animations
const style = document.createElement("style")
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`
document.head.appendChild(style)
