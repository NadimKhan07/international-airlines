// Authentication JavaScript for International Airlines
const currentUser = null
const API_BASE_URL = "http://localhost:5000/api"
const loginForm = document.getElementById("loginFormElement")
const registerForm = document.getElementById("registerFormElement")
const loadingOverlay = document.getElementById("loadingOverlay")

// DOM Elements
const loginFormDiv = document.getElementById("loginForm")
const registerFormDiv = document.getElementById("registerForm")
const tabButtons = document.querySelectorAll(".tab-btn")

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is already logged in
  const token = localStorage.getItem("token")
  if (token) {
    // Verify token is still valid
    fetch(`${API_BASE_URL}/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          window.location.href = "/dashboard.html"
        } else {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
        }
      })
      .catch((error) => {
        console.error("Token verification error:", error)
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      })
  }
})

// Setup Event Listeners
function setupEventListeners() {
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin)
  }

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister)
  }

  // Password confirmation validation
  const confirmPassword = document.getElementById("confirmPassword")
  const registerPassword = document.getElementById("registerPassword")

  if (confirmPassword && registerPassword) {
    confirmPassword.addEventListener("input", function () {
      if (this.value !== registerPassword.value) {
        this.setCustomValidity("Passwords do not match")
      } else {
        this.setCustomValidity("")
      }
    })
  }
}

// Switch between login and register tabs
function switchTab(tab) {
  const loginTab = document.querySelector(".tab-btn:first-child")
  const registerTab = document.querySelector(".tab-btn:last-child")

  if (tab === "login") {
    loginTab.classList.add("active")
    registerTab.classList.remove("active")
    loginFormDiv.classList.add("active")
    registerFormDiv.classList.remove("active")
  } else {
    registerTab.classList.add("active")
    loginTab.classList.remove("active")
    registerFormDiv.classList.add("active")
    loginFormDiv.classList.remove("active")
  }
}

// Handle Login
async function handleLogin(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const loginData = {
    email: formData.get("email"),
    password: formData.get("password"),
  }

  try {
    showLoading()

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    })

    const data = await response.json()

    if (response.ok) {
      // Store token and user data
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      showMessage("Login successful! Redirecting...", "success")

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "/dashboard.html"
      }, 1500)
    } else {
      showMessage(data.message || "Login failed", "error")
    }
  } catch (error) {
    console.error("Login error:", error)
    showMessage("Network error. Please try again.", "error")
  } finally {
    hideLoading()
  }
}

// Handle Register
async function handleRegister(e) {
  e.preventDefault()

  const formData = new FormData(e.target)

  // Validate password confirmation
  const password = formData.get("password")
  const confirmPassword = formData.get("confirmPassword")

  if (password !== confirmPassword) {
    showMessage("Passwords do not match", "error")
    return
  }

  const registerData = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    dateOfBirth: formData.get("dateOfBirth"),
    password: password,
  }

  try {
    showLoading()

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registerData),
    })

    const data = await response.json()

    if (response.ok) {
      showMessage("Registration successful! Please login.", "success")

      // Switch to login tab
      setTimeout(() => {
        switchTab("login")
        registerForm.reset()
      }, 2000)
    } else {
      showMessage(data.message || "Registration failed", "error")
    }
  } catch (error) {
    console.error("Registration error:", error)
    showMessage("Network error. Please try again.", "error")
  } finally {
    hideLoading()
  }
}

// Show Loading Overlay
function showLoading() {
  if (loadingOverlay) {
    loadingOverlay.style.display = "flex"
  }
}

function hideLoading() {
  if (loadingOverlay) {
    loadingOverlay.style.display = "none"
  }
}

// Show Message
function showMessage(message, type = "info") {
  // Remove existing messages
  const existingMessages = document.querySelectorAll(".message")
  existingMessages.forEach((msg) => msg.remove())

  // Create new message element
  const messageDiv = document.createElement("div")
  messageDiv.className = `message ${type}`
  messageDiv.textContent = message

  // Insert message at the top of the active form container
  const activeForm = document.querySelector(".auth-form.active")
  if (activeForm) {
    activeForm.insertBefore(messageDiv, activeForm.firstChild)

    // Auto-remove message after 5 seconds
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove()
      }
    }, 5000)
  }
}

// Utility function to format date
function formatDate(dateString) {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
  return new Date(dateString).toLocaleDateString("en-US", options)
}

// Utility function to validate email
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Utility function to validate password strength
function getPasswordStrength(password) {
  let strength = 0
  if (password.length >= 6) strength++
  if (password.length >= 8) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++
  return strength
}

// Real-time validation for email
document.getElementById("loginEmail").addEventListener("blur", function () {
  if (!validateEmail(this.value)) {
    this.style.borderColor = "#ef4444"
  } else {
    this.style.borderColor = "#e2e8f0"
  }
})

document.getElementById("registerEmail").addEventListener("blur", function () {
  if (!validateEmail(this.value)) {
    this.style.borderColor = "#ef4444"
  } else {
    this.style.borderColor = "#e2e8f0"
  }
})

// Password strength indicator
document.getElementById("registerPassword").addEventListener("input", function () {
  const password = this.value
  const strength = getPasswordStrength(password)

  // You can add visual feedback here
  if (strength < 3) {
    this.style.borderColor = "#ef4444"
  } else if (strength < 5) {
    this.style.borderColor = "#f59e0b"
  } else {
    this.style.borderColor = "#10b981"
  }
})
