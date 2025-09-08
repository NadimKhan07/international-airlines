const express = require("express")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const LoginActivity = require("../models/LoginActivity")
const { body, validationResult } = require("express-validator")
const rateLimit = require("express-rate-limit")
const router = express.Router()

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: "Too many authentication attempts",
    message: "Please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Validation middleware
const registerValidation = [
  body("firstName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("First name can only contain letters and spaces"),

  body("lastName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Last name can only contain letters and spaces"),

  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),

  body("dateOfBirth")
    .isISO8601()
    .withMessage("Please provide a valid date of birth")
    .custom((value) => {
      const today = new Date()
      const birthDate = new Date(value)
      const age = today.getFullYear() - birthDate.getFullYear()

      if (age < 18 || age > 100) {
        throw new Error("Age must be between 18 and 100 years")
      }
      return true
    }),
]

const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),

  body("password").notEmpty().withMessage("Password is required"),
]

// Helper function to generate JWT token
const generateToken = (userId, email) => {
  return jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "24h" })
}

// Helper function to log login activity
const logLoginActivity = async (userId, email, req, status, failureReason = null) => {
  try {
    const activity = new LoginActivity({
      userId,
      email,
      ipAddress: req.ip || req.connection.remoteAddress || "unknown",
      userAgent: req.get("User-Agent") || "unknown",
      status,
      failureReason,
      device: {
        type: detectDeviceType(req.get("User-Agent")),
        browser: detectBrowser(req.get("User-Agent")),
        os: detectOS(req.get("User-Agent")),
      },
    })

    await activity.save()
    return activity
  } catch (error) {
    console.error("Error logging login activity:", error)
  }
}

// Device detection helpers
const detectDeviceType = (userAgent) => {
  if (!userAgent) return "unknown"
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return "mobile"
  if (/Tablet|iPad/.test(userAgent)) return "tablet"
  return "desktop"
}

const detectBrowser = (userAgent) => {
  if (!userAgent) return "unknown"
  if (userAgent.includes("Chrome")) return "Chrome"
  if (userAgent.includes("Firefox")) return "Firefox"
  if (userAgent.includes("Safari")) return "Safari"
  if (userAgent.includes("Edge")) return "Edge"
  return "unknown"
}

const detectOS = (userAgent) => {
  if (!userAgent) return "unknown"
  if (userAgent.includes("Windows")) return "Windows"
  if (userAgent.includes("Mac")) return "macOS"
  if (userAgent.includes("Linux")) return "Linux"
  if (userAgent.includes("Android")) return "Android"
  if (userAgent.includes("iOS")) return "iOS"
  return "unknown"
}

// Register endpoint
router.post("/register", authLimiter, registerValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Please check your input data",
        details: errors.array(),
      })
    }

    const { firstName, lastName, email, password, dateOfBirth } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      await logLoginActivity(null, email, req, "failed", "account_exists")
      return res.status(400).json({
        error: "Registration failed",
        message: "An account with this email already exists",
      })
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      dateOfBirth: new Date(dateOfBirth),
    })

    await user.save()

    // Generate JWT token
    const token = generateToken(user._id, user.email)

    // Log successful registration
    await logLoginActivity(user._id, user.email, req, "success")

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)

    if (error.code === 11000) {
      return res.status(400).json({
        error: "Registration failed",
        message: "An account with this email already exists",
      })
    }

    res.status(500).json({
      error: "Registration failed",
      message: "An error occurred during registration. Please try again.",
    })
  }
})

// Login endpoint
router.post("/login", authLimiter, loginValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Please provide valid email and password",
        details: errors.array(),
      })
    }

    const { email, password } = req.body

    // Find user by email and include password field
    const user = await User.findOne({ email }).select("+password")
    if (!user) {
      await logLoginActivity(null, email, req, "failed", "invalid_credentials")
      return res.status(400).json({
        error: "Login failed",
        message: "Invalid email or password",
      })
    }

    // Check if account is locked
    if (user.isLocked) {
      await logLoginActivity(user._id, email, req, "failed", "account_locked")
      return res.status(423).json({
        error: "Account locked",
        message: "Account is temporarily locked due to too many failed login attempts",
      })
    }

    // Check if account is active
    if (!user.isActive) {
      await logLoginActivity(user._id, email, req, "failed", "account_disabled")
      return res.status(403).json({
        error: "Account disabled",
        message: "Your account has been disabled. Please contact support.",
      })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      await user.incLoginAttempts()
      await logLoginActivity(user._id, email, req, "failed", "invalid_credentials")
      return res.status(400).json({
        error: "Login failed",
        message: "Invalid email or password",
      })
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts()
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate JWT token
    const token = generateToken(user._id, user.email)

    // Log successful login
    await logLoginActivity(user._id, email, req, "success")

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
        preferences: user.preferences,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      error: "Login failed",
      message: "An error occurred during login. Please try again.",
    })
  }
})

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Access denied",
        message: "No valid token provided",
      })
    }

    const token = authHeader.replace("Bearer ", "")
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.userId)
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: "Access denied",
        message: "Invalid token or user not found",
      })
    }

    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
    }

    next()
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expired",
        message: "Your session has expired. Please login again.",
      })
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Invalid token",
        message: "The provided token is invalid",
      })
    }

    console.error("Token verification error:", error)
    res.status(401).json({
      error: "Access denied",
      message: "Token verification failed",
    })
  }
}

// Get user profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "The requested user profile was not found",
      })
    }

    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        role: user.role,
        phoneNumber: user.phoneNumber,
        address: user.address,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    res.status(500).json({
      error: "Profile fetch failed",
      message: "An error occurred while fetching your profile",
    })
  }
})

// Update user profile
router.put(
  "/profile",
  verifyToken,
  [
    body("firstName")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2 and 50 characters"),

    body("lastName")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2 and 50 characters"),

    body("dateOfBirth").optional().isISO8601().withMessage("Please provide a valid date of birth"),

    body("phoneNumber")
      .optional()
      .matches(/^\+?[\d\s-()]+$/)
      .withMessage("Please provide a valid phone number"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          message: "Please check your input data",
          details: errors.array(),
        })
      }

      const allowedUpdates = ["firstName", "lastName", "dateOfBirth", "phoneNumber", "address", "preferences"]
      const updates = {}

      // Only include allowed fields
      Object.keys(req.body).forEach((key) => {
        if (allowedUpdates.includes(key)) {
          updates[key] = req.body[key]
        }
      })

      if (updates.dateOfBirth) {
        updates.dateOfBirth = new Date(updates.dateOfBirth)
      }

      const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true, runValidators: true })

      if (!user) {
        return res.status(404).json({
          error: "User not found",
          message: "The user profile was not found",
        })
      }

      res.json({
        message: "Profile updated successfully",
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          dateOfBirth: user.dateOfBirth,
          phoneNumber: user.phoneNumber,
          address: user.address,
          preferences: user.preferences,
        },
      })
    } catch (error) {
      console.error("Profile update error:", error)
      res.status(500).json({
        error: "Profile update failed",
        message: "An error occurred while updating your profile",
      })
    }
  },
)

// Get login activities for current user
router.get("/activities", verifyToken, async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const activities = await LoginActivity.find({ userId: req.user.userId })
      .sort({ loginTime: -1 })
      .skip(skip)
      .limit(limit)
      .select("-userId")

    const total = await LoginActivity.countDocuments({ userId: req.user.userId })

    res.json({
      activities,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit,
      },
    })
  } catch (error) {
    console.error("Activities fetch error:", error)
    res.status(500).json({
      error: "Activities fetch failed",
      message: "An error occurred while fetching login activities",
    })
  }
})

// Logout endpoint
router.post("/logout", verifyToken, async (req, res) => {
  try {
    // Find the most recent login activity and update it
    const recentActivity = await LoginActivity.findOne({
      userId: req.user.userId,
      status: "success",
      logoutTime: { $exists: false },
    }).sort({ loginTime: -1 })

    if (recentActivity) {
      recentActivity.logoutTime = new Date()
      recentActivity.status = "logout"
      await recentActivity.save()
    }

    res.json({
      message: "Logged out successfully",
    })
  } catch (error) {
    console.error("Logout error:", error)
    res.status(500).json({
      error: "Logout failed",
      message: "An error occurred during logout",
    })
  }
})

// Change password endpoint
router.put(
  "/change-password",
  verifyToken,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),

    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("New password must contain at least one uppercase letter, one lowercase letter, and one number"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          message: "Please check your input data",
          details: errors.array(),
        })
      }

      const { currentPassword, newPassword } = req.body

      // Find user with password field
      const user = await User.findById(req.user.userId).select("+password")
      if (!user) {
        return res.status(404).json({
          error: "User not found",
          message: "User not found",
        })
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword)
      if (!isMatch) {
        return res.status(400).json({
          error: "Invalid password",
          message: "Current password is incorrect",
        })
      }

      // Update password
      user.password = newPassword
      await user.save()

      res.json({
        message: "Password changed successfully",
      })
    } catch (error) {
      console.error("Password change error:", error)
      res.status(500).json({
        error: "Password change failed",
        message: "An error occurred while changing your password",
      })
    }
  },
)

module.exports = router
