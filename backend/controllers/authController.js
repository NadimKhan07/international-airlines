const User = require("../models/User")
const LoginActivity = require("../models/LoginActivity")
const jwt = require("jsonwebtoken")

class AuthController {
  // Register new admin user
  static async register(req, res) {
    try {
      const { firstName, lastName, email, dateOfBirth, password } = req.body

      // Check if user already exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        })
      }

      // Validate password strength
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        })
      }

      // Create new user
      const user = new User({
        firstName,
        lastName,
        email,
        dateOfBirth,
        password,
      })

      await user.save()

      res.status(201).json({
        success: true,
        message: "Admin account created successfully",
        data: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
        },
      })
    } catch (error) {
      console.error("Registration error:", error)

      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map((err) => err.message)
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: messages,
        })
      }

      res.status(500).json({
        success: false,
        message: "Internal server error during registration",
      })
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { email, password } = req.body
      const ipAddress = req.ip || req.connection.remoteAddress
      const userAgent = req.get("User-Agent")

      // Check for too many failed attempts
      const recentFailedAttempts = await LoginActivity.getRecentAttempts(email, 1)
      if (recentFailedAttempts >= 5) {
        return res.status(429).json({
          success: false,
          message: "Too many failed login attempts. Please try again later.",
        })
      }

      // Find user
      const user = await User.findOne({ email, isActive: true })
      if (!user) {
        await LoginActivity.create({
          email,
          success: false,
          failureReason: "Invalid Email",
          ipAddress,
          userAgent,
        })
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        })
      }

      // Check password
      const isMatch = await user.comparePassword(password)
      if (!isMatch) {
        await LoginActivity.create({
          userId: user._id,
          email,
          success: false,
          failureReason: "Invalid Password",
          ipAddress,
          userAgent,
        })
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        })
      }

      // Update last login
      user.lastLogin = new Date()
      await user.save()

      // Log successful login
      const loginActivity = await LoginActivity.create({
        userId: user._id,
        email,
        success: true,
        ipAddress,
        userAgent,
      })

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" },
      )

      // Set session
      req.session.userId = user._id
      req.session.loginActivityId = loginActivity._id

      res.json({
        success: true,
        message: "Login successful",
        data: {
          token,
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
          },
        },
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({
        success: false,
        message: "Internal server error during login",
      })
    }
  }

  // Logout user
  static async logout(req, res) {
    try {
      if (req.session.loginActivityId) {
        await LoginActivity.findByIdAndUpdate(req.session.loginActivityId, { logoutTime: new Date() })
      }

      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err)
        }
      })

      res.json({
        success: true,
        message: "Logout successful",
      })
    } catch (error) {
      console.error("Logout error:", error)
      res.status(500).json({
        success: false,
        message: "Error during logout",
      })
    }
  }

  // Get login activity
  static async getLoginActivity(req, res) {
    try {
      const page = Number.parseInt(req.query.page) || 1
      const limit = Number.parseInt(req.query.limit) || 50
      const skip = (page - 1) * limit

      const activities = await LoginActivity.find()
        .populate("userId", "firstName lastName email")
        .sort({ loginTime: -1 })
        .skip(skip)
        .limit(limit)

      const total = await LoginActivity.countDocuments()

      res.json({
        success: true,
        data: {
          activities,
          pagination: {
            current: page,
            total: Math.ceil(total / limit),
            count: activities.length,
            totalRecords: total,
          },
        },
      })
    } catch (error) {
      console.error("Get login activity error:", error)
      res.status(500).json({
        success: false,
        message: "Error fetching login activity",
      })
    }
  }

  // Get user profile
  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.params.id)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      res.json({
        success: true,
        data: user,
      })
    } catch (error) {
      console.error("Get profile error:", error)
      res.status(500).json({
        success: false,
        message: "Error fetching user profile",
      })
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const { firstName, lastName, email, dateOfBirth } = req.body

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { firstName, lastName, email, dateOfBirth },
        { new: true, runValidators: true },
      )

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: user,
      })
    } catch (error) {
      console.error("Update profile error:", error)

      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map((err) => err.message)
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: messages,
        })
      }

      res.status(500).json({
        success: false,
        message: "Error updating profile",
      })
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body
      const userId = req.params.id

      const user = await User.findById(userId)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword)
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        })
      }

      // Update password
      user.password = newPassword
      await user.save()

      res.json({
        success: true,
        message: "Password changed successfully",
      })
    } catch (error) {
      console.error("Change password error:", error)
      res.status(500).json({
        success: false,
        message: "Error changing password",
      })
    }
  }
}

module.exports = AuthController
