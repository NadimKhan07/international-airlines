const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const compression = require("compression")
const rateLimit = require("express-rate-limit")
const path = require("path")
require("dotenv").config()

const app = express()

// Security middleware
app.use(helmet())
app.use(compression())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
})
app.use("/api/", limiter)

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Serve static files
app.use(express.static("public"))
app.use("/uploads", express.static("uploads"))

// API Routes
app.use("/api/auth", require("./routes/auth"))
app.use("/api/flights", require("./routes/flights"))
app.use("/api/weather", require("./routes/weather"))
app.use("/api/tickets", require("./routes/tickets"))
app.use("/api/reports", require("./routes/reports"))

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "International Airlines API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV,
    features: [
      "User Authentication",
      "Flight Management",
      "Weather Integration",
      "Ticket Management",
      "Reporting System",
      "Real-time Updates",
    ],
  })
})

// Serve frontend pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"))
})

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"))
})

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    message: `The requested endpoint ${req.originalUrl} does not exist`,
  })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.stack)

  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      message: err.message,
    })
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      error: "Invalid ID",
      message: "The provided ID is not valid",
    })
  }

  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
  })
})

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB")
    console.log(`📊 Database: ${mongoose.connection.name}`)
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err)
    process.exit(1)
  })

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`)
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`)
  console.log(`🖥️  Frontend URL: http://localhost:${PORT}`)
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...")
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed.")
    process.exit(0)
  })
})

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...")
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed.")
    process.exit(0)
  })
})
