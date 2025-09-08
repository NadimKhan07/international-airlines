const mongoose = require("mongoose")

const loginActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: function () {
      return this.success === true
    },
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
  },
  loginTime: {
    type: Date,
    default: Date.now,
    index: true,
  },
  ipAddress: {
    type: String,
    validate: {
      validator: (ip) => {
        // Basic IP validation
        return /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip) || ip === "::1" || ip === "localhost"
      },
      message: "Invalid IP address format",
    },
  },
  userAgent: {
    type: String,
    maxlength: [500, "User agent string too long"],
  },
  success: {
    type: Boolean,
    required: true,
    default: false,
    index: true,
  },
  failureReason: {
    type: String,
    enum: ["Invalid Email", "Invalid Password", "Account Disabled", "Other"],
    required: function () {
      return this.success === false
    },
  },
  sessionId: String,
  logoutTime: Date,
})

// Index for efficient queries
loginActivitySchema.index({ email: 1, loginTime: -1 })
loginActivitySchema.index({ userId: 1, loginTime: -1 })

// Get login attempts in last hour
loginActivitySchema.statics.getRecentAttempts = function (email, hours = 1) {
  const timeLimit = new Date(Date.now() - hours * 60 * 60 * 1000)
  return this.countDocuments({
    email: email,
    loginTime: { $gte: timeLimit },
    success: false,
  })
}

module.exports = mongoose.model("LoginActivity", loginActivitySchema)
