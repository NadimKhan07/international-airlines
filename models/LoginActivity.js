const mongoose = require("mongoose")

const loginActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    ipAddress: {
      type: String,
      required: [true, "IP address is required"],
      validate: {
        validator: (ip) => {
          // Basic IP validation (IPv4 and IPv6)
          const ipv4Regex =
            /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
          const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
          return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip === "::1" || ip === "127.0.0.1"
        },
        message: "Invalid IP address format",
      },
    },
    userAgent: {
      type: String,
      required: [true, "User agent is required"],
      maxlength: [1000, "User agent cannot exceed 1000 characters"],
    },
    loginTime: {
      type: Date,
      default: Date.now,
      required: true,
    },
    logoutTime: {
      type: Date,
    },
    sessionDuration: {
      type: Number, // in minutes
      min: [0, "Session duration cannot be negative"],
    },
    status: {
      type: String,
      enum: {
        values: ["success", "failed", "logout", "timeout"],
        message: "Status must be one of: success, failed, logout, timeout",
      },
      default: "success",
    },
    failureReason: {
      type: String,
      enum: ["invalid_credentials", "account_locked", "account_disabled", "invalid_token", "expired_token"],
    },
    location: {
      country: {
        type: String,
        trim: true,
      },
      region: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      timezone: {
        type: String,
        trim: true,
      },
      coordinates: {
        latitude: {
          type: Number,
          min: [-90, "Latitude must be between -90 and 90"],
          max: [90, "Latitude must be between -90 and 90"],
        },
        longitude: {
          type: Number,
          min: [-180, "Longitude must be between -180 and 180"],
          max: [180, "Longitude must be between -180 and 180"],
        },
      },
    },
    device: {
      type: {
        type: String,
        enum: ["desktop", "mobile", "tablet", "unknown"],
        default: "unknown",
      },
      os: {
        type: String,
        trim: true,
      },
      browser: {
        type: String,
        trim: true,
      },
      version: {
        type: String,
        trim: true,
      },
    },
    securityFlags: {
      suspiciousActivity: {
        type: Boolean,
        default: false,
      },
      newDevice: {
        type: Boolean,
        default: false,
      },
      newLocation: {
        type: Boolean,
        default: false,
      },
      vpnDetected: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for better query performance
loginActivitySchema.index({ userId: 1, loginTime: -1 })
loginActivitySchema.index({ loginTime: -1 })
loginActivitySchema.index({ status: 1 })
loginActivitySchema.index({ ipAddress: 1 })
loginActivitySchema.index({ email: 1 })

// Calculate session duration before saving logout
loginActivitySchema.pre("save", function (next) {
  if (this.logoutTime && this.loginTime && !this.sessionDuration) {
    const duration = (this.logoutTime - this.loginTime) / (1000 * 60) // in minutes
    this.sessionDuration = Math.round(duration)
  }
  next()
})

// Virtual for formatted session duration
loginActivitySchema.virtual("formattedDuration").get(function () {
  if (!this.sessionDuration) return "N/A"

  const hours = Math.floor(this.sessionDuration / 60)
  const minutes = this.sessionDuration % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
})

// Virtual for login status description
loginActivitySchema.virtual("statusDescription").get(function () {
  const descriptions = {
    success: "Successful login",
    failed: "Failed login attempt",
    logout: "User logged out",
    timeout: "Session timed out",
  }
  return descriptions[this.status] || "Unknown status"
})

// Static method to get recent activities for a user
loginActivitySchema.statics.getRecentForUser = function (userId, limit = 10) {
  return this.find({ userId }).sort({ loginTime: -1 }).limit(limit).populate("userId", "firstName lastName email")
}

// Static method to get failed login attempts
loginActivitySchema.statics.getFailedAttempts = function (email, timeWindow = 24) {
  const since = new Date(Date.now() - timeWindow * 60 * 60 * 1000)
  return this.find({
    email,
    status: "failed",
    loginTime: { $gte: since },
  }).sort({ loginTime: -1 })
}

// Static method to detect suspicious activity
loginActivitySchema.statics.detectSuspiciousActivity = function (userId, ipAddress) {
  return this.find({
    userId,
    ipAddress: { $ne: ipAddress },
    loginTime: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
  }).limit(1)
}

// Instance method to mark as suspicious
loginActivitySchema.methods.markSuspicious = function (reason) {
  this.securityFlags.suspiciousActivity = true
  this.notes = reason
  return this.save()
}

module.exports = mongoose.model("LoginActivity", loginActivitySchema)
