const express = require("express")
const jwt = require("jsonwebtoken")
const Flight = require("../models/Flight")
const Ticket = require("../models/Ticket")
const LoginActivity = require("../models/LoginActivity")
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

// Dashboard overview report
router.get("/dashboard", verifyToken, async (req, res) => {
  try {
    // Flight statistics
    const totalFlights = await Flight.countDocuments()
    const activeFlights = await Flight.countDocuments({
      status: { $in: ["Scheduled", "Boarding", "Departed", "In Air"] },
    })
    const delayedFlights = await Flight.countDocuments({ status: "Delayed" })
    const cancelledFlights = await Flight.countDocuments({ status: "Cancelled" })

    // Ticket statistics
    const totalTickets = await Ticket.countDocuments()
    const confirmedTickets = await Ticket.countDocuments({ status: "confirmed" })
    const totalRevenue = await Ticket.aggregate([{ $group: { _id: null, total: { $sum: "$price" } } }])

    // Recent activities
    const recentFlights = await Flight.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("createdBy", "firstName lastName")

    const recentBookings = await Ticket.find()
      .sort({ bookingDate: -1 })
      .limit(5)
      .populate("flightId", "flightNumber origin destination")

    // Monthly flight trends
    const monthlyFlights = await Flight.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ])

    res.json({
      flightStats: {
        totalFlights,
        activeFlights,
        delayedFlights,
        cancelledFlights,
      },
      ticketStats: {
        totalTickets,
        confirmedTickets,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
      recentActivities: {
        flights: recentFlights,
        bookings: recentBookings,
      },
      trends: {
        monthlyFlights,
      },
    })
  } catch (error) {
    console.error("Dashboard report error:", error)
    res.status(500).json({ message: "Server error generating dashboard report" })
  }
})

// Flight performance report
router.get("/flights/performance", verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    let dateFilter = {}
    if (startDate && endDate) {
      dateFilter = {
        departureTime: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      }
    }

    // On-time performance
    const performanceStats = await Flight.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ])

    // Route analysis
    const routeStats = await Flight.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            origin: "$origin.city",
            destination: "$destination.city",
          },
          flightCount: { $sum: 1 },
          avgCapacity: { $avg: "$capacity.total" },
        },
      },
      { $sort: { flightCount: -1 } },
      { $limit: 10 },
    ])

    // Aircraft utilization
    const aircraftStats = await Flight.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$aircraft.model",
          flightCount: { $sum: 1 },
          totalCapacity: { $sum: "$capacity.total" },
        },
      },
      { $sort: { flightCount: -1 } },
    ])

    res.json({
      performanceStats,
      routeStats,
      aircraftStats,
      period: { startDate, endDate },
    })
  } catch (error) {
    console.error("Flight performance report error:", error)
    res.status(500).json({ message: "Server error generating flight performance report" })
  }
})

// Revenue report
router.get("/revenue", verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    let dateFilter = {}
    if (startDate && endDate) {
      dateFilter = {
        bookingDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      }
    }

    // Revenue by class
    const revenueByClass = await Ticket.aggregate([
      { $match: { ...dateFilter, paymentStatus: "paid" } },
      {
        $group: {
          _id: "$seatClass",
          totalRevenue: { $sum: "$price" },
          ticketCount: { $sum: 1 },
          avgPrice: { $avg: "$price" },
        },
      },
    ])

    // Monthly revenue trend
    const monthlyRevenue = await Ticket.aggregate([
      { $match: { ...dateFilter, paymentStatus: "paid" } },
      {
        $group: {
          _id: {
            year: { $year: "$bookingDate" },
            month: { $month: "$bookingDate" },
          },
          revenue: { $sum: "$price" },
          tickets: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ])

    // Top routes by revenue
    const topRoutes = await Ticket.aggregate([
      { $match: { ...dateFilter, paymentStatus: "paid" } },
      {
        $lookup: {
          from: "flights",
          localField: "flightId",
          foreignField: "_id",
          as: "flight",
        },
      },
      { $unwind: "$flight" },
      {
        $group: {
          _id: {
            origin: "$flight.origin.city",
            destination: "$flight.destination.city",
          },
          revenue: { $sum: "$price" },
          tickets: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ])

    const totalRevenue = revenueByClass.reduce((sum, item) => sum + item.totalRevenue, 0)

    res.json({
      summary: {
        totalRevenue,
        totalTickets: revenueByClass.reduce((sum, item) => sum + item.ticketCount, 0),
      },
      revenueByClass,
      monthlyRevenue,
      topRoutes,
      period: { startDate, endDate },
    })
  } catch (error) {
    console.error("Revenue report error:", error)
    res.status(500).json({ message: "Server error generating revenue report" })
  }
})

// User activity report
router.get("/users/activity", verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    let dateFilter = {}
    if (startDate && endDate) {
      dateFilter = {
        loginTime: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      }
    }

    // Login statistics
    const loginStats = await LoginActivity.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ])

    // Daily login trends
    const dailyLogins = await LoginActivity.aggregate([
      { $match: { ...dateFilter, status: "success" } },
      {
        $group: {
          _id: {
            year: { $year: "$loginTime" },
            month: { $month: "$loginTime" },
            day: { $dayOfMonth: "$loginTime" },
          },
          logins: { $sum: 1 },
          uniqueUsers: { $addToSet: "$userId" },
        },
      },
      {
        $project: {
          _id: 1,
          logins: 1,
          uniqueUsers: { $size: "$uniqueUsers" },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 } },
      { $limit: 30 },
    ])

    // Most active users
    const activeUsers = await LoginActivity.aggregate([
      { $match: { ...dateFilter, status: "success" } },
      {
        $group: {
          _id: "$userId",
          loginCount: { $sum: 1 },
          lastLogin: { $max: "$loginTime" },
          email: { $first: "$email" },
        },
      },
      { $sort: { loginCount: -1 } },
      { $limit: 10 },
    ])

    res.json({
      loginStats,
      dailyLogins,
      activeUsers,
      period: { startDate, endDate },
    })
  } catch (error) {
    console.error("User activity report error:", error)
    res.status(500).json({ message: "Server error generating user activity report" })
  }
})

module.exports = router
