const Flight = require("../models/Flight")

class FlightController {
  // Get all flights
  static async getAllFlights(req, res) {
    try {
      const page = Number.parseInt(req.query.page) || 1
      const limit = Number.parseInt(req.query.limit) || 20
      const skip = (page - 1) * limit

      // Build filter object
      const filter = {}
      if (req.query.status) {
        filter.status = req.query.status
      }
      if (req.query.origin) {
        filter.origin = new RegExp(req.query.origin, "i")
      }
      if (req.query.destination) {
        filter.destination = new RegExp(req.query.destination, "i")
      }
      if (req.query.date) {
        const startDate = new Date(req.query.date)
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 1)
        filter.departureTime = { $gte: startDate, $lt: endDate }
      }

      const flights = await Flight.find(filter)
        .populate("createdBy", "firstName lastName email")
        .sort({ departureTime: 1 })
        .skip(skip)
        .limit(limit)

      const total = await Flight.countDocuments(filter)

      res.json({
        success: true,
        data: {
          flights,
          pagination: {
            current: page,
            total: Math.ceil(total / limit),
            count: flights.length,
            totalRecords: total,
          },
        },
      })
    } catch (error) {
      console.error("Get flights error:", error)
      res.status(500).json({
        success: false,
        message: "Error fetching flights",
      })
    }
  }

  // Get single flight
  static async getFlight(req, res) {
    try {
      const flight = await Flight.findById(req.params.id).populate("createdBy", "firstName lastName email")

      if (!flight) {
        return res.status(404).json({
          success: false,
          message: "Flight not found",
        })
      }

      res.json({
        success: true,
        data: flight,
      })
    } catch (error) {
      console.error("Get flight error:", error)
      res.status(500).json({
        success: false,
        message: "Error fetching flight",
      })
    }
  }

  // Create new flight
  static async createFlight(req, res) {
    try {
      const flightData = {
        ...req.body,
        createdBy: req.user?.userId,
      }

      // Auto-calculate passenger distribution if not provided
      if (flightData.passengers && flightData.passengers.total) {
        const total = flightData.passengers.total
        if (!flightData.passengers.economy) {
          flightData.passengers.economy = Math.floor(total * 0.7)
        }
        if (!flightData.passengers.business) {
          flightData.passengers.business = Math.floor(total * 0.25)
        }
        if (!flightData.passengers.firstClass) {
          flightData.passengers.firstClass = total - flightData.passengers.economy - flightData.passengers.business
        }
      }

      const flight = new Flight(flightData)
      await flight.save()

      const populatedFlight = await Flight.findById(flight._id).populate("createdBy", "firstName lastName email")

      res.status(201).json({
        success: true,
        message: "Flight created successfully",
        data: populatedFlight,
      })
    } catch (error) {
      console.error("Create flight error:", error)

      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map((err) => err.message)
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: messages,
        })
      }

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Flight number already exists",
        })
      }

      res.status(500).json({
        success: false,
        message: "Error creating flight",
      })
    }
  }

  // Update flight
  static async updateFlight(req, res) {
    try {
      const flight = await Flight.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      }).populate("createdBy", "firstName lastName email")

      if (!flight) {
        return res.status(404).json({
          success: false,
          message: "Flight not found",
        })
      }

      res.json({
        success: true,
        message: "Flight updated successfully",
        data: flight,
      })
    } catch (error) {
      console.error("Update flight error:", error)

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
        message: "Error updating flight",
      })
    }
  }

  // Delete flight
  static async deleteFlight(req, res) {
    try {
      const flight = await Flight.findByIdAndDelete(req.params.id)

      if (!flight) {
        return res.status(404).json({
          success: false,
          message: "Flight not found",
        })
      }

      res.json({
        success: true,
        message: "Flight deleted successfully",
      })
    } catch (error) {
      console.error("Delete flight error:", error)
      res.status(500).json({
        success: false,
        message: "Error deleting flight",
      })
    }
  }

  // Update flight status
  static async updateFlightStatus(req, res) {
    try {
      const { status, delay } = req.body

      const updateData = { status }
      if (delay) {
        updateData.delay = delay
      }

      const flight = await Flight.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })

      if (!flight) {
        return res.status(404).json({
          success: false,
          message: "Flight not found",
        })
      }

      res.json({
        success: true,
        message: "Flight status updated successfully",
        data: flight,
      })
    } catch (error) {
      console.error("Update flight status error:", error)
      res.status(500).json({
        success: false,
        message: "Error updating flight status",
      })
    }
  }

  // Get flight statistics
  static async getFlightStats(req, res) {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const stats = await Flight.aggregate([
        {
          $facet: {
            totalFlights: [{ $count: "count" }],
            todayFlights: [{ $match: { departureTime: { $gte: today, $lt: tomorrow } } }, { $count: "count" }],
            statusBreakdown: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
            totalPassengers: [{ $group: { _id: null, total: { $sum: "$passengers.total" } } }],
            aircraftTypes: [{ $group: { _id: "$aircraft", count: { $sum: 1 } } }],
          },
        },
      ])

      res.json({
        success: true,
        data: stats[0],
      })
    } catch (error) {
      console.error("Get flight stats error:", error)
      res.status(500).json({
        success: false,
        message: "Error fetching flight statistics",
      })
    }
  }
}

module.exports = FlightController
