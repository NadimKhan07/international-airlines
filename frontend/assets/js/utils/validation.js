// Validation Utility Functions
class ValidationService {
  // Email validation
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Password validation
  static isValidPassword(password) {
    return password && password.length >= 6
  }

  // Flight number validation
  static isValidFlightNumber(flightNumber) {
    const flightRegex = /^[A-Z]{2}[0-9]{3,4}$/
    return flightRegex.test(flightNumber.toUpperCase())
  }

  // Platform validation
  static isValidPlatform(platform) {
    const platformRegex = /^[A-Z][0-9]{1,2}$/
    return platformRegex.test(platform.toUpperCase())
  }

  // Date validation
  static isValidDate(dateString) {
    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date)
  }

  // Future date validation
  static isFutureDate(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    return date > now
  }

  // Required field validation
  static isRequired(value) {
    return value !== null && value !== undefined && value.toString().trim() !== ""
  }

  // Number range validation
  static isInRange(value, min, max) {
    const num = Number(value)
    return !isNaN(num) && num >= min && num <= max
  }

  // Form validation
  static validateForm(formData, rules) {
    const errors = {}

    Object.keys(rules).forEach((field) => {
      const value = formData[field]
      const fieldRules = rules[field]

      fieldRules.forEach((rule) => {
        if (rule.type === "required" && !this.isRequired(value)) {
          errors[field] = rule.message || `${field} is required`
        } else if (rule.type === "email" && value && !this.isValidEmail(value)) {
          errors[field] = rule.message || "Invalid email format"
        } else if (rule.type === "password" && value && !this.isValidPassword(value)) {
          errors[field] = rule.message || "Password must be at least 6 characters"
        } else if (rule.type === "minLength" && value && value.length < rule.value) {
          errors[field] = rule.message || `Minimum length is ${rule.value} characters`
        } else if (rule.type === "maxLength" && value && value.length > rule.value) {
          errors[field] = rule.message || `Maximum length is ${rule.value} characters`
        }
      })
    })

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  }
}
