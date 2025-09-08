const express = require("express")
const jwt = require("jsonwebtoken")
const Flight = require("../models/Flight")
const router = express.Router()

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "")
  if (!token) {
    return res.status(401).json({ message: "No token provided" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ message: "Invalid token" })
  }
}

// Get all flights
router.get("/", verifyToken, async (req, res) => {
  try {
    const flights = await Flight.find().populate("createdBy", "firstName lastName").sort({ departureTime: 1 })
    res.json({ flights })
  } catch (error) {
    console.error("Get flights error:", error)
    res.status(500).json({ message: "Server error fetching flights" })
  }
})

// Get flight by ID
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id).populate("createdBy", "firstName lastName")

    if (!flight) {
      return res.status(404).json({ message: "Flight not found" })
    }

    res.json({ flight })
  } catch (error) {
    console.error("Get flight error:", error)
    res.status(500).json({ message: "Server error fetching flight" })
  }
})

// Create new flight
router.post("/", verifyToken, async (req, res) => {
  try {
    const flightData = {
      ...req.body,
      createdBy: req.user.userId,
      departureTime: new Date(req.body.departureTime),
      arrivalTime: new Date(req.body.arrivalTime),
    }

    const flight = new Flight(flightData)
    await flight.save()

    const populatedFlight = await Flight.findById(flight._id).populate("createdBy", "firstName lastName")

    res.status(201).json({
      message: "Flight created successfully",
      flight: populatedFlight,
    })
  } catch (error) {
    console.error("Create flight error:", error)
    if (error.code === 11000) {
      res.status(400).json({ message: "Flight number already exists" })
    } else {
      res.status(500).json({ message: "Server error creating flight" })
    }
  }
})

// Update flight
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      departureTime: new Date(req.body.departureTime),
      arrivalTime: new Date(req.body.arrivalTime),
    }

    const flight = await Flight.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate(
      "createdBy",
      "firstName lastName",
    )

    if (!flight) {
      return res.status(404).json({ message: "Flight not found" })
    }

    res.json({
      message: "Flight updated successfully",
      flight,
    })
  } catch (error) {
    console.error("Update flight error:", error)
    res.status(500).json({ message: "Server error updating flight" })
  }
})

// Delete flight
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const flight = await Flight.findByIdAndDelete(req.params.id)

    if (!flight) {
      return res.status(404).json({ message: "Flight not found" })
    }

    res.json({ message: "Flight deleted successfully" })
  } catch (error) {
    console.error("Delete flight error:", error)
    res.status(500).json({ message: "Server error deleting flight" })
  }
})

// Get flight statistics
router.get("/stats/overview", verifyToken, async (req, res) => {
  try {
    const totalFlights = await Flight.countDocuments()
    const activeFlights = await Flight.countDocuments({
      status: { $in: ["Scheduled", "Boarding", "Departed", "In Air"] },
    })
    const delayedFlights = await Flight.countDocuments({ status: "Delayed" })
    const cancelledFlights = await Flight.countDocuments({ status: "Cancelled" })

    // Get flights by status
    const statusStats = await Flight.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ])

    // Get recent flights
    const recentFlights = await Flight.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("createdBy", "firstName lastName")

    res.json({
      overview: {
        totalFlights,
        activeFlights,
        delayedFlights,
        cancelledFlights,
      },
      statusStats,
      recentFlights,
    })
  } catch (error) {
    console.error("Flight stats error:", error)
    res.status(500).json({ message: "Server error fetching flight statistics" })
  }
})

module.exports = router
