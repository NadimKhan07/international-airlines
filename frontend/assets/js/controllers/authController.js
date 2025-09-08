// Authentication Controller
class AuthController {
  constructor() {
    this.currentUser = null
    this.isLoading = false
  }

  // Initialize auth controller
  init() {
    console.log("Initializing AuthController...")
    this.checkAuthStatus()
    this.bindEvents()
  }

  // Check if user is already authenticated
  checkAuthStatus() {
    if (window.StorageService.isAuthenticated()) {
      console.log("User is authenticated, checking current page...")
      // If on login page and authenticated, redirect to dashboard
      if (window.location.pathname.includes("login.html")) {
        console.log("Redirecting to dashboard...")
        window.location.href = "/views/dashboard.html"
      }
    } else {
      console.log("User not authenticated")
      // If not on login page and not authenticated, redirect to login
      if (!window.location.pathname.includes("login.html")) {
        console.log("Redirecting to login...")
        window.location.href = "/views/login.html"
      }
    }
  }

  // Bind form events
  bindEvents() {
    const loginForm = document.getElementById("loginForm")
    const registerForm = document.getElementById("registerForm")

    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e))
      console.log("Login form event bound")
    }

    if (registerForm) {
      registerForm.addEventListener("submit", (e) => this.handleRegister(e))
      console.log("Register form event bound")
    }
  }

  // Handle login form submission
  async handleLogin(event) {
    event.preventDefault()
    console.log("Login form submitted")

    if (this.isLoading) return

    const formData = {
      email: document.getElementById("loginEmail").value.trim(),
      password: document.getElementById("loginPassword").value,
    }

    console.log("Login attempt with email:", formData.email)

    // Basic validation
    if (!formData.email || !formData.password) {
      this.showMessage("Please fill in all fields", "error")
      return
    }

    try {
      this.setLoading(true, "loginBtn")
      this.clearMessages()

      console.log("Sending login request...")
      const response = await window.apiService.post(window.CONFIG.ENDPOINTS.AUTH.LOGIN, formData)
      console.log("Login response:", response)

      if (response.success) {
        console.log("Login successful, storing data...")

        // Store authentication data
        window.apiService.setToken(response.data.token)
        window.StorageService.setUser(response.data.user)

        this.showMessage("Login successful! Redirecting...", "success")

        // Redirect to dashboard
        setTimeout(() => {
          console.log("Redirecting to dashboard...")
          window.location.href = "/views/dashboard.html"
        }, 1500)
      } else {
        this.showMessage(response.message || "Login failed", "error")
      }
    } catch (error) {
      console.error("Login error:", error)
      this.showMessage(error.message || "Login failed. Please try again.", "error")
    } finally {
      this.setLoading(false, "loginBtn")
    }
  }

  // Handle register form submission
  async handleRegister(event) {
    event.preventDefault()
    console.log("Register form submitted")

    if (this.isLoading) return

    const formData = {
      firstName: document.getElementById("firstName").value.trim(),
      lastName: document.getElementById("lastName").value.trim(),
      email: document.getElementById("registerEmail").value.trim(),
      dateOfBirth: document.getElementById("dateOfBirth").value,
      password: document.getElementById("registerPassword").value,
      confirmPassword: document.getElementById("confirmPassword").value,
    }

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      this.showMessage("Please fill in all required fields", "error")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      this.showMessage("Passwords do not match", "error")
      return
    }

    if (formData.password.length < 6) {
      this.showMessage("Password must be at least 6 characters long", "error")
      return
    }

    try {
      this.setLoading(true, "registerBtn")
      this.clearMessages()

      // Remove confirmPassword from data sent to server
      const { confirmPassword, ...registerData } = formData

      console.log("Sending register request...")
      const response = await window.apiService.post(window.CONFIG.ENDPOINTS.AUTH.REGISTER, registerData)
      console.log("Register response:", response)

      if (response.success) {
        this.showMessage("Account created successfully! Please login.", "success")

        // Switch to login form after delay
        setTimeout(() => {
          this.showLogin()
          // Pre-fill email in login form
          document.getElementById("loginEmail").value = formData.email
        }, 2000)
      } else {
        this.showMessage(response.message || "Registration failed", "error")
      }
    } catch (error) {
      console.error("Register error:", error)
      this.showMessage(error.message || "Registration failed. Please try again.", "error")
    } finally {
      this.setLoading(false, "registerBtn")
    }
  }

  // Show login form
  showLogin() {
    document.getElementById("loginForm").classList.remove("hidden")
    document.getElementById("registerForm").classList.add("hidden")
    document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"))
    event.target.classList.add("active")
    this.clearMessages()
  }

  // Show register form
  showRegister() {
    document.getElementById("loginForm").classList.add("hidden")
    document.getElementById("registerForm").classList.remove("hidden")
    document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"))
    event.target.classList.add("active")
    this.clearMessages()
  }

  // Logout user
  async logout() {
    console.log("Logging out...")
    try {
      await window.apiService.post(window.CONFIG.ENDPOINTS.AUTH.LOGOUT)
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Clear local storage regardless of API call success
      window.apiService.removeToken()
      window.StorageService.clearAll()
      window.location.href = "/views/login.html"
    }
  }

  // Show validation errors
  showValidationErrors(errors) {
    // Clear previous errors
    document.querySelectorAll(".form-error").forEach((el) => (el.textContent = ""))

    // Show new errors
    Object.keys(errors).forEach((field) => {
      const errorElement = document.getElementById(`${field}Error`)
      if (errorElement) {
        errorElement.textContent = errors[field]
      }
    })
  }

  // Show message to user
  showMessage(message, type = "info") {
    console.log(`Showing ${type} message:`, message)

    const container = document.getElementById("messageContainer")
    if (!container) {
      console.error("Message container not found")
      alert(message) // Fallback to alert
      return
    }

    const messageDiv = document.createElement("div")
    messageDiv.className = `message message-${type}`
    messageDiv.textContent = message

    container.innerHTML = ""
    container.appendChild(messageDiv)

    // Auto-hide after delay
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove()
      }
    }, window.CONFIG.UI.TOAST_DURATION)
  }

  // Clear all messages
  clearMessages() {
    const container = document.getElementById("messageContainer")
    if (container) {
      container.innerHTML = ""
    }

    // Clear validation errors
    document.querySelectorAll(".form-error").forEach((el) => (el.textContent = ""))
  }

  // Set loading state
  setLoading(loading, buttonId) {
    this.isLoading = loading
    const button = document.getElementById(buttonId)

    if (button) {
      const textSpan = button.querySelector(".btn-text")
      const loaderSpan = button.querySelector(".btn-loader")

      if (loading) {
        button.disabled = true
        if (textSpan) textSpan.classList.add("hidden")
        if (loaderSpan) loaderSpan.classList.remove("hidden")
      } else {
        button.disabled = false
        if (textSpan) textSpan.classList.remove("hidden")
        if (loaderSpan) loaderSpan.classList.add("hidden")
      }
    }
  }

  // Show forgot password dialog
  showForgotPassword() {
    alert(
      "Forgot password functionality will be implemented. Please contact administrator at admin@internationalairlines.com",
    )
  }
}

// Create global auth controller instance
window.authController = new AuthController()

// Reload page function
function reloadPage() {
  location.reload()
}
