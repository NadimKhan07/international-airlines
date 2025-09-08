// Application Configuration
const CONFIG = {
  API_BASE_URL: "http://localhost:5000/api",
  BACKEND_URL: "http://localhost:5000",
  APP_NAME: "International Airlines",
  VERSION: "1.0.0",

  // API Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/login",
      REGISTER: "/auth/register",
      LOGOUT: "/auth/logout",
      PROFILE: "/auth/profile",
      ACTIVITY: "/auth/activity",
    },
    FLIGHTS: {
      BASE: "/flights",
      STATS: "/flights/stats",
      STATUS: "/flights/{id}/status",
    },
    WEATHER: {
      DHAKA: "/weather/dhaka",
      CITY: "/weather/{city}",
      MULTIPLE: "/weather/multiple",
    },
    TICKETS: "/tickets",
    REPORTS: "/reports",
  },

  // Local Storage Keys
  STORAGE_KEYS: {
    TOKEN: "ia_auth_token",
    USER: "ia_user_data",
    PREFERENCES: "ia_user_preferences",
  },

  // UI Settings
  UI: {
    ITEMS_PER_PAGE: 20,
    DEBOUNCE_DELAY: 300,
    TOAST_DURATION: 5000,
  },
}

// Environment check
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
  CONFIG.API_BASE_URL = "http://localhost:5000/api"
} else {
  // Production API URL would go here
  CONFIG.API_BASE_URL = "https://your-production-api.com/api"
}

// Make CONFIG globally available
window.CONFIG = CONFIG
