const Ticket = require("../models/Ticket")
const Flight = require("../models/Flight")

class TicketController {
  // Get all tickets
  static async getAllTickets(req, res) {
    try {
      const page = Number.parseInt(req.query.page) || 1
      const limit = Number.parseInt(req.query.limit) || 20
      const skip = (page - 1) * limit

      // Build filter object
      const filter = {}
      if (req.query.route) {
        filter.$or = [
          { "route.origin": new RegExp(req.query.route, "i") },
          { "route.destination": new RegExp(req.query.route, "i") },
        ]
      }
      if (req.query.aircraft) {
        filter.aircraft = new RegExp(req.query.aircraft, "i")
      }
      if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === "true"
      }

      const tickets = await Ticket.find(filter)
        .populate("updatedBy", "firstName lastName email")
        .sort({ lastUpdated: -1 })
        .skip(skip)
        .limit(limit)

      const total = await Ticket.countDocuments(filter)

      res.json({
        success: true,
        data: {
          tickets,
          pagination: {
            current: page,
            total: Math.ceil(total / limit),
            count: tickets.length,
            totalRecords: total,
          },
        },
      })
    } catch (error) {
      console.error("Get tickets error:", error)
      res.status(500).json({
        success: false,
        message: "Error fetching tickets",
      })
    }
  }

  // Get single ticket
  static async getTicket(req, res) {
    try {
      const ticket = await Ticket.findById(req.params.id).populate("updatedBy", "firstName lastName email")

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found",
        })
      }

      res.json({
        success: true,
        data: ticket,
      })
    } catch (error) {
      console.error("Get ticket error:", error)
      res.status(500).json({
        success: false,
        message: "Error fetching ticket",
      })
    }
  }

  // Create new ticket
  static async createTicket(req, res) {
    try {
      const ticketData = {
        ...req.body,
        updatedBy: req.user?.userId,
      }

      // Check if flight exists
      const flight = await Flight.findOne({ flightNumber: ticketData.flightNumber })
      if (!flight) {
        return res.status(400).json({
          success: false,
          message: "Flight not found",
        })
      }

      // Auto-populate route and aircraft from flight if not provided
      if (!ticketData.route) {
        ticketData.route = {
          origin: flight.origin,
          destination: flight.destination,
        }
      }
      if (!ticketData.aircraft) {
        ticketData.aircraft = flight.aircraft
      }

      // Set default valid until date (30 days from now)
      if (!ticketData.validUntil) {
        const validUntil = new Date()
        validUntil.setDate(validUntil.getDate() + 30)
        ticketData.validUntil = validUntil
      }

      const ticket = new Ticket(ticketData)
      await ticket.save()

      const populatedTicket = await Ticket.findById(ticket._id).populate("updatedBy", "firstName lastName email")

      res.status(201).json({
        success: true,
        message: "Ticket created successfully",
        data: populatedTicket,
      })
    } catch (error) {
      console.error("Create ticket error:", error)

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
        message: "Error creating ticket",
      })
    }
  }

  // Update ticket
  static async updateTicket(req, res) {
    try {
      const updateData = {
        ...req.body,
        updatedBy: req.user?.userId,
      }

      const ticket = await Ticket.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      }).populate("updatedBy", "firstName lastName email")

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found",
        })
      }

      res.json({
        success: true,
        message: "Ticket updated successfully",
        data: ticket,
      })
    } catch (error) {
      console.error("Update ticket error:", error)

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
        message: "Error updating ticket",
      })
    }
  }

  // Delete ticket
  static async deleteTicket(req, res) {
    try {
      const ticket = await Ticket.findByIdAndDelete(req.params.id)

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found",
        })
      }

      res.json({
        success: true,
        message: "Ticket deleted successfully",
      })
    } catch (error) {
      console.error("Delete ticket error:", error)
      res.status(500).json({
        success: false,
        message: "Error deleting ticket",
      })
    }
  }

  // Update ticket pricing
  static async updatePricing(req, res) {
    try {
      const { pricing, factors } = req.body

      const updateData = {
        pricing,
        factors,
        updatedBy: req.user?.userId,
      }

      const ticket = await Ticket.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found",
        })
      }

      res.json({
        success: true,
        message: "Ticket pricing updated successfully",
        data: ticket,
      })
    } catch (error) {
      console.error("Update pricing error:", error)
      res.status(500).json({
        success: false,
        message: "Error updating ticket pricing",
      })
    }
  }

  // Get ticket by flight number
  static async getTicketByFlight(req, res) {
    try {
      const ticket = await Ticket.findOne({
        flightNumber: req.params.flightNumber,
        isActive: true,
      }).populate("updatedBy", "firstName lastName email")

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found for this flight",
        })
      }

      res.json({
        success: true,
        data: ticket,
      })
    } catch (error) {
      console.error("Get ticket by flight error:", error)
      res.status(500).json({
        success: false,
        message: "Error fetching ticket",
      })
    }
  }

  // Get ticket statistics
  static async getTicketStats(req, res) {
    try {
      const stats = await Ticket.aggregate([
        {
          $facet: {
            totalTickets: [{ $count: "count" }],
            activeTickets: [{ $match: { isActive: true } }, { $count: "count" }],
            routeBreakdown: [
              {
                $group: {
                  _id: {
                    origin: "$route.origin",
                    destination: "$route.destination",
                  },
                  count: { $sum: 1 },
                  avgEconomyPrice: { $avg: "$pricing.economy.current" },
                  avgBusinessPrice: { $avg: "$pricing.business.current" },
                  avgFirstClassPrice: { $avg: "$pricing.firstClass.current" },
                },
              },
            ],
            aircraftBreakdown: [{ $group: { _id: "$aircraft", count: { $sum: 1 } } }],
            demandAnalysis: [{ $group: { _id: "$factors.demand", count: { $sum: 1 } } }],
          },
        },
      ])

      res.json({
        success: true,
        data: stats[0],
      })
    } catch (error) {
      console.error("Get ticket stats error:", error)
      res.status(500).json({
        success: false,
        message: "Error fetching ticket statistics",
      })
    }
  }

  // Generate sample ticket data for existing flights
  static async generateSampleTickets(req, res) {
    try {
      const flights = await Flight.find({ status: { $ne: "Cancelled" } })

      const sampleTickets = flights.map((flight) => {
        const distance = Math.floor(Math.random() * 5000) + 500 // 500-5500 km
        const demandLevels = ["Low", "Medium", "High"]
        const seasons = ["Peak", "Off-Peak", "Regular"]

        const baseEconomy = Math.floor(distance * 8) + Math.floor(Math.random() * 10000) + 15000
        const baseBusiness = baseEconomy * 2.5
        const baseFirstClass = baseEconomy * 4

        return {
          flightNumber: flight.flightNumber,
          route: {
            origin: flight.origin,
            destination: flight.destination,
          },
          aircraft: flight.aircraft,
          pricing: {
            economy: {
              base: baseEconomy,
              current: baseEconomy + Math.floor(Math.random() * 5000),
              currency: "BDT",
            },
            business: {
              base: baseBusiness,
              current: baseBusiness + Math.floor(Math.random() * 15000),
              currency: "BDT",
            },
            firstClass: {
              base: baseFirstClass,
              current: baseFirstClass + Math.floor(Math.random() * 25000),
              currency: "BDT",
            },
          },
          factors: {
            distance: distance,
            demand: demandLevels[Math.floor(Math.random() * demandLevels.length)],
            season: seasons[Math.floor(Math.random() * seasons.length)],
            fuelCost: Math.floor(Math.random() * 50) + 30,
          },
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          isActive: true,
        }
      })

      // Insert sample tickets (avoid duplicates)
      const insertedTickets = []
      for (const ticketData of sampleTickets) {
        try {
          const existingTicket = await Ticket.findOne({
            flightNumber: ticketData.flightNumber,
          })

          if (!existingTicket) {
            const ticket = new Ticket(ticketData)
            await ticket.save()
            insertedTickets.push(ticket)
          }
        } catch (error) {
          console.error(`Error creating ticket for flight ${ticketData.flightNumber}:`, error)
        }
      }

      res.json({
        success: true,
        message: `Generated ${insertedTickets.length} sample tickets`,
        data: insertedTickets,
      })
    } catch (error) {
      console.error("Generate sample tickets error:", error)
      res.status(500).json({
        success: false,
        message: "Error generating sample tickets",
      })
    }
  }
}

module.exports = TicketController
