// Dashboard Controller
import StorageService from "../services/StorageService"
import apiService from "../services/apiService"
import CONFIG from "../config"
import flightController from "./flightController"
import weatherController from "./weatherController"

class DashboardController {
  constructor() {
    this.currentUser = null
    this.flights = []
    this.stats = {}
  }

  // Initialize dashboard
  async init() {
    this.checkAuthentication()
    await this.loadUserData()
    await this.loadDashboardData()
    this.bindEvents()
  }

  // Check if user is authenticated
  checkAuthentication() {
    if (!StorageService.isAuthenticated()) {
      window.location.href = "/views/login.html"
      return
    }

    this.currentUser = StorageService.getUser()
    apiService.setToken(StorageService.getToken())
  }

  // Load user data
  async loadUserData() {
    try {
      if (this.currentUser) {
        // Update user display in navbar if needed
        this.updateUserDisplay()
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

  // Load dashboard data
  async loadDashboardData() {
    try {
      // Load flights and stats
      await Promise.all([this.loadFlightStats(), this.loadRecentFlights(), this.loadWeatherData()])
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    }
  }

  // Load flight statistics
  async loadFlightStats() {
    try {
      const response = await apiService.get(CONFIG.ENDPOINTS.FLIGHTS.STATS)
      if (response.success) {
        this.stats = response.data
        this.updateDashboardStats()
      }
    } catch (error) {
      console.error("Error loading flight stats:", error)
      this.showStatsError()
    }
  }

  // Load recent flights
  async loadRecentFlights() {
    try {
      const response = await apiService.get(CONFIG.ENDPOINTS.FLIGHTS.BASE, { limit: 5 })
      if (response.success) {
        this.flights = response.data.flights
        this.displayRecentFlights()
      }
    } catch (error) {
      console.error("Error loading recent flights:", error)
      this.showRecentFlightsError()
    }
  }

  // Load weather data
  async loadWeatherData() {
    try {
      const response = await apiService.get(CONFIG.ENDPOINTS.WEATHER.DHAKA)
      if (response.success) {
        this.updateWeatherDisplay(response.data)
      }
    } catch (error) {
      console.error("Error loading weather data:", error)
      this.showWeatherError()
    }
  }

  // Update dashboard statistics
  updateDashboardStats() {
    const stats = this.stats

    // Active flights
    const totalFlights = stats.totalFlights?.[0]?.count || 0
    const todayFlights = stats.todayFlights?.[0]?.count || 0
    document.getElementById("activeFlights").textContent = todayFlights

    // On-time performance
    const statusBreakdown = stats.statusBreakdown || []
    const onTimeFlights = statusBreakdown.find((s) => s._id === "On Time")?.count || 0
    const onTimePercentage = totalFlights > 0 ? Math.round((onTimeFlights / totalFlights) * 100) : 0
    document.getElementById("onTimePerf").textContent = onTimePercentage + "%"

    // Total passengers
    const totalPassengers = stats.totalPassengers?.[0]?.total || 0
    document.getElementById("totalPassengers").textContent = totalPassengers.toLocaleString()
  }

  // Display recent flights
  displayRecentFlights() {
    const container = document.getElementById("recentFlights")

    if (this.flights.length === 0) {
      container.innerHTML = '<div class="no-data">No recent flights found</div>'
      return
    }

    container.innerHTML = this.flights
      .map(
        (flight) => `
            <div class="activity-item">
                <div class="activity-info">
                    <strong>${flight.flightNumber}</strong> - ${flight.origin} to ${flight.destination}
                    <br><small>Platform ${flight.platform} • ${this.formatDateTime(flight.departureTime)}</small>
                </div>
                <span class="status-badge status-${this.getStatusClass(flight.status)}">${flight.status}</span>
            </div>
        `,
      )
      .join("")
  }

  // Update weather display
  updateWeatherDisplay(weatherData) {
    const current = weatherData.current

    document.querySelector(".weather-temp").textContent = `${current.temperature}°C`
    document.querySelector(".weather-desc").textContent = current.description
    document.getElementById("humidity").textContent = current.humidity
    document.getElementById("windSpeed").textContent = current.windSpeed
    document.getElementById("visibility").textContent = current.visibility || "N/A"

    // Update weather status in dashboard
    const statusElement = document.getElementById("weatherStatus")
    if (statusElement) {
      statusElement.textContent = `${current.temperature}°C, ${current.condition}`
      statusElement.style.color = this.getWeatherColor(current.condition)
    }
  }

  // Show section
  showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll(".content-section").forEach((section) => {
      section.classList.remove("active")
    })

    // Remove active class from all nav links
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active")
    })

    // Show selected section
    document.getElementById(sectionId).classList.add("active")

    // Add active class to clicked nav link
    event.target.classList.add("active")

    // Load section-specific data
    this.loadSectionData(sectionId)
  }

  // Load section-specific data
  async loadSectionData(sectionId) {
    switch (sectionId) {
      case "flights":
        if (window.flightController) {
          await flightController.loadFlights()
        }
        break
      case "tickets":
        await this.loadTicketPricing()
        break
      case "weather":
        if (window.weatherController) {
          await weatherController.loadWeatherData()
        }
        break
      case "activity":
        await this.loadLoginActivity()
        break
      case "profile":
        await this.loadProfile()
        break
      case "performance":
        this.loadPerformanceData()
        break
    }
  }

  // Go to home/dashboard
  goHome() {
    this.showSection("dashboard")
    document.querySelector(".nav-link").classList.add("active")
  }

  // Bind events
  bindEvents() {
    // Add any dashboard-specific event listeners here
  }

  // Utility methods
  formatDateTime(dateString) {
    return new Date(dateString).toLocaleString()
  }

  getStatusClass(status) {
    return status.toLowerCase().replace(/\s+/g, "")
  }

  getWeatherColor(condition) {
    switch (condition.toLowerCase()) {
      case "clear":
        return "var(--success)"
      case "rain":
      case "thunderstorm":
        return "var(--error)"
      default:
        return "var(--warning)"
    }
  }

  // Error display methods
  showStatsError() {
    document.getElementById("activeFlights").textContent = "Error"
    document.getElementById("onTimePerf").textContent = "Error"
    document.getElementById("totalPassengers").textContent = "Error"
  }

  showRecentFlightsError() {
    document.getElementById("recentFlights").innerHTML = '<div class="error">Error loading recent flights</div>'
  }

  showWeatherError() {
    document.querySelector(".weather-temp").textContent = "N/A"
    document.querySelector(".weather-desc").textContent = "Weather unavailable"
    document.getElementById("humidity").textContent = "-"
    document.getElementById("windSpeed").textContent = "-"
    document.getElementById("visibility").textContent = "-"

    const statusElement = document.getElementById("weatherStatus")
    if (statusElement) {
      statusElement.textContent = "Unavailable"
      statusElement.style.color = "var(--gray)"
    }
  }

  // Placeholder methods for sections not yet implemented
  async loadTicketPricing() {
    // Implementation will be added
    console.log("Loading ticket pricing...")
  }

  async loadLoginActivity() {
    // Implementation will be added
    console.log("Loading login activity...")
  }

  async loadProfile() {
    // Implementation will be added
    console.log("Loading profile...")
  }

  loadPerformanceData() {
    // Implementation will be added
    console.log("Loading performance data...")
  }

  updateUserDisplay() {
    // Update user display in navbar if needed
    if (this.currentUser) {
      console.log(`Welcome, ${this.currentUser.firstName} ${this.currentUser.lastName}`)
    }
  }
}

// Create global dashboard controller instance
const dashboardController = new DashboardController()
