// Flight Management Functions

const API_BASE_URL = "https://api.example.com" // Declare API_BASE_URL
const authToken = "your-auth-token" // Declare authToken
const showMessage = (message, type) => console.log(`${type}: ${message}`) // Declare showMessage
const showLoading = (isLoading) => console.log(`Loading: ${isLoading}`) // Declare showLoading
const loadFlightsSection = () => console.log("Flights section loaded") // Declare loadFlightsSection
const loadFlightStats = () => console.log("Flight stats loaded") // Declare loadFlightStats

// Edit Flight
async function editFlight(flightId) {
  try {
    const response = await fetch(`${API_BASE_URL}/flights/${flightId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      populateEditForm(data.flight)
      showEditFlightModal()
    } else {
      showMessage("Error loading flight details", "error")
    }
  } catch (error) {
    console.error("Edit flight error:", error)
    showMessage("Network error. Please try again.", "error")
  }
}

// Delete Flight
async function deleteFlight(flightId) {
  if (!confirm("Are you sure you want to delete this flight?")) {
    return
  }

  try {
    showLoading(true)

    const response = await fetch(`${API_BASE_URL}/flights/${flightId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    if (response.ok) {
      showMessage("Flight deleted successfully!", "success")
      loadFlightsSection() // Reload flights table
      loadFlightStats() // Update stats
    } else {
      const data = await response.json()
      showMessage(data.message || "Failed to delete flight", "error")
    }
  } catch (error) {
    console.error("Delete flight error:", error)
    showMessage("Network error. Please try again.", "error")
  } finally {
    showLoading(false)
  }
}

// Populate Edit Form
function populateEditForm(flight) {
  // This would populate an edit modal form with flight data
  // For now, we'll just show an alert with flight info
  alert(
    `Flight Details:\n\nFlight: ${flight.flightNumber}\nAirline: ${flight.airline}\nRoute: ${flight.origin.city} → ${flight.destination.city}\nStatus: ${flight.status}`,
  )
}

// Show Edit Flight Modal
function showEditFlightModal() {
  // This would show an edit modal
  // For now, we'll just show a message
  showMessage("Edit functionality coming soon!", "info")
}

// Filter Flights
function filterFlights(status) {
  const rows = document.querySelectorAll("#flightsTableBody tr")

  rows.forEach((row) => {
    if (status === "all") {
      row.style.display = ""
    } else {
      const statusCell = row.querySelector(".status-badge")
      if (statusCell && statusCell.textContent.toLowerCase() === status.toLowerCase()) {
        row.style.display = ""
      } else {
        row.style.display = "none"
      }
    }
  })
}

// Search Flights
function searchFlights(query) {
  const rows = document.querySelectorAll("#flightsTableBody tr")
  const searchTerm = query.toLowerCase()

  rows.forEach((row) => {
    const cells = row.querySelectorAll("td")
    let found = false

    cells.forEach((cell) => {
      if (cell.textContent.toLowerCase().includes(searchTerm)) {
        found = true
      }
    })

    row.style.display = found ? "" : "none"
  })
}

// Sort Flights
function sortFlights(column, direction = "asc") {
  const tbody = document.getElementById("flightsTableBody")
  const rows = Array.from(tbody.querySelectorAll("tr"))

  rows.sort((a, b) => {
    let aVal, bVal

    switch (column) {
      case "flightNumber":
        aVal = a.cells[0].textContent.trim()
        bVal = b.cells[0].textContent.trim()
        break
      case "route":
        aVal = a.cells[1].textContent.trim()
        bVal = b.cells[1].textContent.trim()
        break
      case "departure":
        aVal = new Date(a.cells[2].textContent.trim())
        bVal = new Date(b.cells[2].textContent.trim())
        break
      case "arrival":
        aVal = new Date(a.cells[3].textContent.trim())
        bVal = new Date(b.cells[3].textContent.trim())
        break
      case "status":
        aVal = a.cells[4].textContent.trim()
        bVal = b.cells[4].textContent.trim()
        break
      default:
        return 0
    }

    if (aVal < bVal) return direction === "asc" ? -1 : 1
    if (aVal > bVal) return direction === "asc" ? 1 : -1
    return 0
  })

  // Clear tbody and append sorted rows
  tbody.innerHTML = ""
  rows.forEach((row) => tbody.appendChild(row))
}

// Export Flight Data
function exportFlights(format = "csv") {
  const flights = Array.from(document.querySelectorAll("#flightsTableBody tr")).map((row) => {
    const cells = row.querySelectorAll("td")
    return {
      flightNumber: cells[0]?.textContent.trim(),
      route: cells[1]?.textContent.trim(),
      departure: cells[2]?.textContent.trim(),
      arrival: cells[3]?.textContent.trim(),
      status: cells[4]?.textContent.trim(),
    }
  })

  if (format === "csv") {
    const csv = [
      "Flight Number,Route,Departure,Arrival,Status",
      ...flights.map((f) => `${f.flightNumber},"${f.route}",${f.departure},${f.arrival},${f.status}`),
    ].join("\n")

    downloadFile(csv, "flights.csv", "text/csv")
  } else if (format === "json") {
    downloadFile(JSON.stringify(flights, null, 2), "flights.json", "application/json")
  }
}

// Download File Helper
function downloadFile(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

// Validate Flight Form
function validateFlightForm(formData) {
  const errors = []

  // Check required fields
  const requiredFields = [
    "flightNumber",
    "airline",
    "origin.city",
    "origin.airport",
    "origin.code",
    "destination.city",
    "destination.airport",
    "destination.code",
    "departureTime",
    "arrivalTime",
    "aircraft.model",
    "aircraft.registration",
    "capacity.total",
    "capacity.economy",
    "capacity.business",
    "price.economy",
    "price.business",
  ]

  requiredFields.forEach((field) => {
    const value = formData.get(field)
    if (!value || value.trim() === "") {
      errors.push(`${field.replace(".", " ")} is required`)
    }
  })

  // Validate dates
  const departureTime = new Date(formData.get("departureTime"))
  const arrivalTime = new Date(formData.get("arrivalTime"))

  if (departureTime >= arrivalTime) {
    errors.push("Arrival time must be after departure time")
  }

  if (departureTime <= new Date()) {
    errors.push("Departure time must be in the future")
  }

  // Validate capacity
  const totalCapacity = Number.parseInt(formData.get("capacity.total"))
  const economyCapacity = Number.parseInt(formData.get("capacity.economy"))
  const businessCapacity = Number.parseInt(formData.get("capacity.business"))
  const firstCapacity = Number.parseInt(formData.get("capacity.first")) || 0

  if (economyCapacity + businessCapacity + firstCapacity !== totalCapacity) {
    errors.push("Total capacity must equal sum of class capacities")
  }

  // Validate airport codes
  const originCode = formData.get("origin.code")
  const destinationCode = formData.get("destination.code")

  if (originCode.length !== 3) {
    errors.push("Origin airport code must be 3 characters")
  }

  if (destinationCode.length !== 3) {
    errors.push("Destination airport code must be 3 characters")
  }

  if (originCode === destinationCode) {
    errors.push("Origin and destination cannot be the same")
  }

  return errors
}
