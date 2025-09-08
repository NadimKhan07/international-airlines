const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const session = require("express-session")
const path = require("path")
require("dotenv").config()

const app = express()

// Import Routes
const authRoutes = require("./routes/authRoutes")
const flightRoutes = require("./routes/flightRoutes")
const ticketRoutes = require("./routes/ticketRoutes")
const weatherRoutes = require("./routes/weatherRoutes")
const reportRoutes = require("./routes/reportRoutes")
const aiRoutes = require("./routes/aiRoutes")

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
    },
  }),
)

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err))

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/flights", flightRoutes)
app.use("/api/tickets", ticketRoutes)
app.use("/api/weather", weatherRoutes)
app.use("/api/reports", reportRoutes)
app.use("/api/ai", aiRoutes) // 🤖 AI Routes

// Health Check Route
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "International Airlines Backend Server with AI is running",
    timestamp: new Date().toISOString(),
    features: ["Flight Management", "Weather Analysis", "AI Route Safety", "Dynamic Pricing", "Delay Prediction"],
  })
})

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  })
})

// 404 Handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "API endpoint not found" })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Backend Server running on port ${PORT}`)
  console.log(`🤖 AI Features enabled`)
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`)
})
