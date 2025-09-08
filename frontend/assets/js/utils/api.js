// API Utility Functions
class ApiService {
  constructor() {
    this.baseURL = window.CONFIG.API_BASE_URL
    this.token = this.getStoredToken()
  }

  // Get stored token
  getStoredToken() {
    return localStorage.getItem(window.CONFIG.STORAGE_KEYS.TOKEN)
  }

  // Set authentication token
  setToken(token) {
    this.token = token
    localStorage.setItem(window.CONFIG.STORAGE_KEYS.TOKEN, token)
  }

  // Remove authentication token
  removeToken() {
    this.token = null
    localStorage.removeItem(window.CONFIG.STORAGE_KEYS.TOKEN)
  }

  // Get default headers
  getHeaders(includeAuth = true) {
    const headers = {
      "Content-Type": "application/json",
    }

    if (includeAuth && this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    return headers
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: this.getHeaders(options.auth !== false),
      ...options,
    }

    try {
      console.log(`Making ${config.method || "GET"} request to:`, url)

      const response = await fetch(url, config)
      const data = await response.json()

      console.log("Response:", { status: response.status, data })

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          this.removeToken()
          if (window.location.pathname !== "/views/login.html") {
            window.location.href = "/views/login.html"
          }
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error("API Request Error:", error)
      throw error
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint

    return this.request(url, {
      method: "GET",
    })
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // PATCH request
  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, {
      method: "DELETE",
    })
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${window.CONFIG.BACKEND_URL}/api/health`)
      return response.ok
    } catch (error) {
      return false
    }
  }
}

// Create global API service instance
window.apiService = new ApiService()
