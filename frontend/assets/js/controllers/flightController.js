// Flight Management Controller
const CONFIG = {
  UI: {
    ITEMS_PER_PAGE: 10,
  },
  ENDPOINTS: {
    FLIGHTS: {
      BASE: "/api/flights",
    },
  },
}

const apiService = {
  get: async (url, params) => {
    // Implementation for GET request
    return { success: true, data: { flights: [], pagination: { current: 1, total: 1 } } }
  },
  post: async (url, data) => {
    // Implementation for POST request
    return { success: true }
  },
  put: async (url, data) => {
    // Implementation for PUT request
    return { success: true }
  },
  patch: async (url, data) => {
    // Implementation for PATCH request
    return { success: true }
  },
  delete: async (url) => {
    // Implementation for DELETE request
    return { success: true }
  },
}

const ValidationService = {
  isRequired: (value) => value !== "",
  isValidFlightNumber: (flightNumber) => /^[A-Z]{2}\d{3,4}$/.test(flightNumber),
  isValidPlatform: (platform) => /^[A-Z]\d{1,2}$/.test(platform),
  isFutureDate: (dateString) => new Date(dateString) > new Date(),
  isInRange: (value, min, max) => value >= min && value <= max,
}

class FlightController {
  constructor() {
    this.flights = []
    this.currentPage = 1
    this.totalPages = 1
    this.filters = {
      search: "",
      status: "",
      date: "",
    }
    this.isLoading = false
  }

  // Load all flights
  async loadFlights(page = 1) {
    try {
      this.setLoading(true)

      const params = {
        page: page,
        limit: CONFIG.UI.ITEMS_PER_PAGE,
        ...this.filters,
      }

      const response = await apiService.get(CONFIG.ENDPOINTS.FLIGHTS.BASE, params)

      if (response.success) {
        this.flights = response.data.flights
        this.currentPage = response.data.pagination.current
        this.totalPages = response.data.pagination.total

        this.displayFlights()
        this.updatePagination()
      }
    } catch (error) {
      console.error("Error loading flights:", error)
      this.showError("Error loading flights. Please try again.")
    } finally {
      this.setLoading(false)
    }
  }

  // Display flights in table
  displayFlights() {
    const tbody = document.getElementById("flightsTableBody")

    if (this.flights.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="no-data">No flights found</td></tr>'
      return
    }

    tbody.innerHTML = this.flights
      .map(
        (flight) => `
            <tr>
                <td><strong>${flight.flightNumber}</strong></td>
                <td>${flight.aircraft}</td>
                <td>${flight.origin} → ${flight.destination}</td>
                <td>${this.formatDateTime(flight.departureTime)}</td>
                <td>${flight.platform}</td>
                <td>
                    <span class="status-badge status-${this.getStatusClass(flight.status)}">
                        ${flight.status}
                    </span>
                    ${
                      flight.delay && flight.delay.duration
                        ? `<br><small class="delay-info">Delayed: ${flight.delay.duration}min</small>`
                        : ""
                    }
                </td>
                <td>${flight.passengers?.total || 0}</td>
                <td>
                    <span class="fuel-status fuel-${flight.fuelStatus.toLowerCase()}">
                        ${flight.fuelStatus}
                    </span>
                </td>
                <td class="actions">
                    <button class="action-btn btn-edit" onclick="flightController.editFlight('${flight._id}')" title="Edit Flight">
                        ✏️
                    </button>
                    <button class="action-btn btn-status" onclick="flightController.updateFlightStatus('${flight._id}')" title="Update Status">
                        🔄
                    </button>
                    <button class="action-btn btn-delete" onclick="flightController.deleteFlight('${flight._id}')" title="Delete Flight">
                        🗑️
                    </button>
                </td>
            </tr>
        `,
      )
      .join("")
  }

  // Search flights
  searchFlights() {
    const searchTerm = document.getElementById("flightSearch").value.trim()
    this.filters.search = searchTerm
    this.currentPage = 1
    this.loadFlights()
  }

  // Filter flights by status
  filterFlights() {
    const status = document.getElementById("statusFilter").value
    this.filters.status = status
    this.currentPage = 1
    this.loadFlights()
  }

  // Show add flight modal
  showAddFlightModal() {
    document.getElementById("addFlightModal").classList.remove("hidden")
    this.resetFlightForm()
  }

  // Close modal
  closeModal(modalId) {
    document.getElementById(modalId).classList.add("hidden")
  }

  // Reset flight form
  resetFlightForm() {
    document.getElementById("addFlightForm").reset()

    // Set minimum datetime to current time
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    document.getElementById("departureTime").min = now.toISOString().slice(0, 16)
    document.getElementById("arrivalTime").min = now.toISOString().slice(0, 16)
  }

  // Handle add flight form submission
  async handleAddFlight(event) {
    event.preventDefault()

    if (this.isLoading) return

    const formData = this.getFlightFormData()

    // Validate form
    const validation = this.validateFlightForm(formData)
    if (!validation.isValid) {
      this.showValidationErrors(validation.errors)
      return
    }

    try {
      this.setLoading(true)

      const response = await apiService.post(CONFIG.ENDPOINTS.FLIGHTS.BASE, formData)

      if (response.success) {
        this.closeModal("addFlightModal")
        this.loadFlights(this.currentPage)
        this.showSuccess("Flight added successfully!")
      }
    } catch (error) {
      console.error("Error adding flight:", error)
      this.showError(error.message || "Error adding flight. Please try again.")
    } finally {
      this.setLoading(false)
    }
  }

  // Get flight form data
  getFlightFormData() {
    return {
      flightNumber: document.getElementById("flightNumber").value.trim().toUpperCase(),
      aircraft: document.getElementById("aircraft").value,
      origin: document.getElementById("origin").value.trim(),
      destination: document.getElementById("destination").value.trim(),
      departureTime: document.getElementById("departureTime").value,
      arrivalTime: document.getElementById("arrivalTime").value,
      platform: document.getElementById("platform").value.trim().toUpperCase(),
      passengers: {
        total: Number.parseInt(document.getElementById("totalPassengers").value),
      },
    }
  }

  // Validate flight form
  validateFlightForm(formData) {
    const errors = {}

    // Flight number validation
    if (!ValidationService.isRequired(formData.flightNumber)) {
      errors.flightNumber = "Flight number is required"
    } else if (!ValidationService.isValidFlightNumber(formData.flightNumber)) {
      errors.flightNumber = "Flight number must be in format: AB123 or AB1234"
    }

    // Aircraft validation
    if (!ValidationService.isRequired(formData.aircraft)) {
      errors.aircraft = "Aircraft type is required"
    }

    // Origin validation
    if (!ValidationService.isRequired(formData.origin)) {
      errors.origin = "Origin is required"
    }

    // Destination validation
    if (!ValidationService.isRequired(formData.destination)) {
      errors.destination = "Destination is required"
    }

    // Platform validation
    if (!ValidationService.isRequired(formData.platform)) {
      errors.platform = "Platform is required"
    } else if (!ValidationService.isValidPlatform(formData.platform)) {
      errors.platform = "Platform must be in format: A1, B12, etc."
    }

    // Date validation
    if (!ValidationService.isRequired(formData.departureTime)) {
      errors.departureTime = "Departure time is required"
    } else if (!ValidationService.isFutureDate(formData.departureTime)) {
      errors.departureTime = "Departure time must be in the future"
    }

    if (!ValidationService.isRequired(formData.arrivalTime)) {
      errors.arrivalTime = "Arrival time is required"
    } else if (new Date(formData.arrivalTime) <= new Date(formData.departureTime)) {
      errors.arrivalTime = "Arrival time must be after departure time"
    }

    // Passengers validation
    if (!ValidationService.isInRange(formData.passengers.total, 1, 500)) {
      errors.totalPassengers = "Passenger count must be between 1 and 500"
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  }

  // Edit flight
  async editFlight(flightId) {
    try {
      const response = await apiService.get(`${CONFIG.ENDPOINTS.FLIGHTS.BASE}/${flightId}`)

      if (response.success) {
        const flight = response.data
        this.populateFlightForm(flight)
        this.showAddFlightModal()

        // Change form submission handler for editing
        const form = document.getElementById("addFlightForm")
        form.onsubmit = (e) => this.handleEditFlight(e, flightId)
      }
    } catch (error) {
      console.error("Error loading flight for edit:", error)
      this.showError("Error loading flight data.")
    }
  }

  // Populate form with flight data
  populateFlightForm(flight) {
    document.getElementById("flightNumber").value = flight.flightNumber
    document.getElementById("aircraft").value = flight.aircraft
    document.getElementById("origin").value = flight.origin
    document.getElementById("destination").value = flight.destination
    document.getElementById("departureTime").value = new Date(flight.departureTime).toISOString().slice(0, 16)
    document.getElementById("arrivalTime").value = new Date(flight.arrivalTime).toISOString().slice(0, 16)
    document.getElementById("platform").value = flight.platform
    document.getElementById("totalPassengers").value = flight.passengers?.total || 0
  }

  // Handle edit flight form submission
  async handleEditFlight(event, flightId) {
    event.preventDefault()

    if (this.isLoading) return

    const formData = this.getFlightFormData()

    // Validate form
    const validation = this.validateFlightForm(formData)
    if (!validation.isValid) {
      this.showValidationErrors(validation.errors)
      return
    }

    try {
      this.setLoading(true)

      const response = await apiService.put(`${CONFIG.ENDPOINTS.FLIGHTS.BASE}/${flightId}`, formData)

      if (response.success) {
        this.closeModal("addFlightModal")
        this.loadFlights(this.currentPage)
        this.showSuccess("Flight updated successfully!")

        // Reset form submission handler
        document.getElementById("addFlightForm").onsubmit = (e) => this.handleAddFlight(e)
      }
    } catch (error) {
      console.error("Error updating flight:", error)
      this.showError(error.message || "Error updating flight. Please try again.")
    } finally {
      this.setLoading(false)
    }
  }

  // Update flight status
  async updateFlightStatus(flightId) {
    const flight = this.flights.find((f) => f._id === flightId)
    if (!flight) return

    const newStatus = prompt(
      `Update status for flight ${flight.flightNumber}:\n\nOptions: Scheduled, On Time, Delayed, Cancelled, Boarding, Departed, Arrived\n\nCurrent status: ${flight.status}`,
      flight.status,
    )

    const validStatuses = ["Scheduled", "On Time", "Delayed", "Cancelled", "Boarding", "Departed", "Arrived"]

    if (newStatus && validStatuses.includes(newStatus)) {
      let delay = null

      if (newStatus === "Delayed") {
        const delayMinutes = prompt("Enter delay duration in minutes:")
        const delayReason = prompt("Enter delay reason (Weather, Technical, Air Traffic, Security, Crew, Other):")

        if (delayMinutes && delayReason) {
          delay = {
            duration: Number.parseInt(delayMinutes),
            reason: delayReason,
          }
        }
      }

      try {
        const response = await apiService.patch(CONFIG.ENDPOINTS.FLIGHTS.STATUS.replace("{id}", flightId), {
          status: newStatus,
          delay,
        })

        if (response.success) {
          this.loadFlights(this.currentPage)
          this.showSuccess("Flight status updated successfully!")
        }
      } catch (error) {
        console.error("Error updating flight status:", error)
        this.showError("Error updating flight status. Please try again.")
      }
    }
  }

  // Delete flight
  async deleteFlight(flightId) {
    const flight = this.flights.find((f) => f._id === flightId)
    if (!flight) return

    if (confirm(`Are you sure you want to delete flight ${flight.flightNumber}?`)) {
      try {
        const response = await apiService.delete(`${CONFIG.ENDPOINTS.FLIGHTS.BASE}/${flightId}`)

        if (response.success) {
          this.loadFlights(this.currentPage)
          this.showSuccess("Flight deleted successfully!")
        }
      } catch (error) {
        console.error("Error deleting flight:", error)
        this.showError("Error deleting flight. Please try again.")
      }
    }
  }

  // Update pagination
  updatePagination() {
    const container = document.getElementById("flightsPagination")
    if (!container) return

    let paginationHTML = ""

    // Previous button
    if (this.currentPage > 1) {
      paginationHTML += `<button onclick="flightController.loadFlights(${this.currentPage - 1})" class="pagination-btn">Previous</button>`
    }

    // Page numbers
    for (let i = Math.max(1, this.currentPage - 2); i <= Math.min(this.totalPages, this.currentPage + 2); i++) {
      const activeClass = i === this.currentPage ? "active" : ""
      paginationHTML += `<button onclick="flightController.loadFlights(${i})" class="pagination-btn ${activeClass}">${i}</button>`
    }

    // Next button
    if (this.currentPage < this.totalPages) {
      paginationHTML += `<button onclick="flightController.loadFlights(${this.currentPage + 1})" class="pagination-btn">Next</button>`
    }

    container.innerHTML = paginationHTML
  }

  // Utility methods
  formatDateTime(dateString) {
    return new Date(dateString).toLocaleString()
  }

  getStatusClass(status) {
    return status.toLowerCase().replace(/\s+/g, "")
  }

  setLoading(loading) {
    this.isLoading = loading
    const tbody = document.getElementById("flightsTableBody")

    if (loading && tbody) {
      tbody.innerHTML = '<tr><td colspan="9" class="loading">Loading flights...</td></tr>'
    }
  }

  showValidationErrors(errors) {
    // Implementation for showing validation errors
    console.error("Validation errors:", errors)
    alert("Please check the form for errors: " + Object.values(errors).join(", "))
  }

  showError(message) {
    alert("Error: " + message)
  }

  showSuccess(message) {
    alert("Success: " + message)
  }
}

// Create global flight controller instance
const flightController = new FlightController()

// Bind form submission event
document.addEventListener("DOMContentLoaded", () => {
  const addFlightForm = document.getElementById("addFlightForm")
  if (addFlightForm) {
    addFlightForm.addEventListener("submit", (e) => flightController.handleAddFlight(e))
  }
})
