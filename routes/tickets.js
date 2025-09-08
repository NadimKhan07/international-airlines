const express = require("express")
const jwt = require("jsonwebtoken")
const Ticket = require("../models/Ticket")
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

// Get all tickets
router.get("/", verifyToken, async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate("flightId")
      .populate("createdBy", "firstName lastName")
      .sort({ bookingDate: -1 })

    res.json({ tickets })
  } catch (error) {
    console.error("Get tickets error:", error)
    res.status(500).json({ message: "Server error fetching tickets" })
  }
})

// Get ticket by ID
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate("flightId").populate("createdBy", "firstName lastName")

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" })
    }

    res.json({ ticket })
  } catch (error) {
    console.error("Get ticket error:", error)
    res.status(500).json({ message: "Server error fetching ticket" })
  }
})

// Create new ticket
router.post("/", verifyToken, async (req, res) => {
  try {
    const ticketData = {
      ...req.body,
      createdBy: req.user.userId,
      passenger: {
        ...req.body.passenger,
        dateOfBirth: new Date(req.body.passenger.dateOfBirth),
        passport: {
          ...req.body.passenger.passport,
          expiryDate: new Date(req.body.passenger.passport.expiryDate),
        },
      },
    }

    // Check if flight exists
    const flight = await Flight.findById(req.body.flightId)
    if (!flight) {
      return res.status(404).json({ message: "Flight not found" })
    }

    const ticket = new Ticket(ticketData)
    await ticket.save()

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate("flightId")
      .populate("createdBy", "firstName lastName")

    res.status(201).json({
      message: "Ticket created successfully",
      ticket: populatedTicket,
    })
  } catch (error) {
    console.error("Create ticket error:", error)
    res.status(500).json({ message: "Server error creating ticket" })
  }
})

// Update ticket
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      passenger: {
        ...req.body.passenger,
        dateOfBirth: new Date(req.body.passenger.dateOfBirth),
        passport: {
          ...req.body.passenger.passport,
          expiryDate: new Date(req.body.passenger.passport.expiryDate),
        },
      },
    }

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate("flightId")
      .populate("createdBy", "firstName lastName")

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" })
    }

    res.json({
      message: "Ticket updated successfully",
      ticket,
    })
  } catch (error) {
    console.error("Update ticket error:", error)
    res.status(500).json({ message: "Server error updating ticket" })
  }
})

// Delete ticket
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id)

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" })
    }

    res.json({ message: "Ticket deleted successfully" })
  } catch (error) {
    console.error("Delete ticket error:", error)
    res.status(500).json({ message: "Server error deleting ticket" })
  }
})

// Get ticket statistics
router.get("/stats/overview", verifyToken, async (req, res) => {
  try {
    const totalTickets = await Ticket.countDocuments()
    const confirmedTickets = await Ticket.countDocuments({ status: "confirmed" })
    const cancelledTickets = await Ticket.countDocuments({ status: "cancelled" })
    const checkedInTickets = await Ticket.countDocuments({ status: "checked-in" })

    // Revenue by class
    const revenueStats = await Ticket.aggregate([
      {
        $group: {
          _id: "$seatClass",
          totalRevenue: { $sum: "$price" },
          count: { $sum: 1 },
        },
      },
    ])

    // Recent bookings
    const recentBookings = await Ticket.find()
      .populate("flightId", "flightNumber origin destination")
      .sort({ bookingDate: -1 })
      .limit(5)

    res.json({
      overview: {
        totalTickets,
        confirmedTickets,
        cancelledTickets,
        checkedInTickets,
      },
      revenueStats,
      recentBookings,
    })
  } catch (error) {
    console.error("Ticket stats error:", error)
    res.status(500).json({ message: "Server error fetching ticket statistics" })
  }
})

module.exports = router
