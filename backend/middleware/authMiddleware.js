const jwt = require("jsonwebtoken")
const User = require("../models/User")

const authMiddleware = async (req, res, next) => {
  try {
    const token =
      req.header("Authorization")?.replace("Bearer ", "") || req.headers.authorization?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Check if user still exists and is active
    const user = await User.findById(decoded.userId)
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Access denied. User not found or inactive.",
      })
    }

    req.user = decoded
    next()
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token expired.",
      })
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Access denied. Invalid token.",
      })
    }

    console.error("Auth middleware error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

module.exports = authMiddleware
