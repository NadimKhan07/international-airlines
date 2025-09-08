const Flight = require("../models/Flight")
const LoginActivity = require("../models/LoginActivity")
const Ticket = require("../models/Ticket")

class ReportController {
  // Generate daily report
  static async getDailyReport(req, res) {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const [flights, loginActivities, tickets] = await Promise.all([
        Flight.find({
          departureTime: {
            $gte: today,
            $lt: tomorrow,
          },
        }),
        LoginActivity.find({
          loginTime: {
            $gte: today,
            $lt: tomorrow,
          },
        }),
        Ticket.find({
          lastUpdated: {
            $gte: today,
            $lt: tomorrow,
          },
        }),
      ])

      const report = {
        date: today.toISOString().split("T")[0],
        flights: {
          total: flights.length,
          scheduled: flights.filter((f) => f.status === "Scheduled").length,
          onTime: flights.filter((f) => f.status === "On Time").length,
          delayed: flights.filter((f) => f.status === "Delayed").length,
          cancelled: flights.filter((f) => f.status === "Cancelled").length,
          departed: flights.filter((f) => f.status === "Departed").length,
        },
        passengers: {
          total: flights.reduce((sum, f) => sum + (f.passengers?.total || 0), 0),
          economy: flights.reduce((sum, f) => sum + (f.passengers?.economy || 0), 0),
          business: flights.reduce((sum, f) => sum + (f.passengers?.business || 0), 0),
          firstClass: flights.reduce((sum, f) => sum + (f.passengers?.firstClass || 0), 0),
        },
        loginActivities: {
          total: loginActivities.length,
          successful: loginActivities.filter((a) => a.success).length,
          failed: loginActivities.filter((a) => !a.success).length,
        },
        tickets: {
          total: tickets.length,
          active: tickets.filter((t) => t.isActive).length,
        },
        performance: {
          onTimePercentage:
            flights.length > 0
              ? Math.round((flights.filter((f) => f.status === "On Time").length / flights.length) * 100)
              : 0,
        },
        generatedAt: new Date().toISOString(),
      }

      res.json({
        success: true,
        data: report,
      })
    } catch (error) {
      console.error("Daily report error:", error)
      res.status(500).json({
        success: false,
        message: "Error generating daily report",
      })
    }
  }

  // Generate weekly report
  static async getWeeklyReport(req, res) {
    try {
      const today = new Date()
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

      const flights = await Flight.find({
        departureTime: {
          $gte: weekAgo,
          $lt: today,
        },
      })

      const report = {
        period: {
          from: weekAgo.toISOString().split("T")[0],
          to: today.toISOString().split("T")[0],
        },
        flights: {
          total: flights.length,
          dailyAverage: Math.round(flights.length / 7),
          statusBreakdown: this.getStatusBreakdown(flights),
        },
        passengers: {
          total: flights.reduce((sum, f) => sum + (f.passengers?.total || 0), 0),
          dailyAverage: Math.round(flights.reduce((sum, f) => sum + (f.passengers?.total || 0), 0) / 7),
        },
        performance: {
          onTimePercentage:
            flights.length > 0
              ? Math.round((flights.filter((f) => f.status === "On Time").length / flights.length) * 100)
              : 0,
        },
        generatedAt: new Date().toISOString(),
      }

      res.json({
        success: true,
        data: report,
      })
    } catch (error) {
      console.error("Weekly report error:", error)
      res.status(500).json({
        success: false,
        message: "Error generating weekly report",
      })
    }
  }

  // Generate monthly report
  static async getMonthlyReport(req, res) {
    try {
      const today = new Date()
      const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())

      const flights = await Flight.find({
        departureTime: {
          $gte: monthAgo,
          $lt: today,
        },
      })

      const report = {
        period: {
          from: monthAgo.toISOString().split("T")[0],
          to: today.toISOString().split("T")[0],
        },
        flights: {
          total: flights.length,
          statusBreakdown: this.getStatusBreakdown(flights),
          aircraftBreakdown: this.getAircraftBreakdown(flights),
        },
        passengers: {
          total: flights.reduce((sum, f) => sum + (f.passengers?.total || 0), 0),
          classBreakdown: {
            economy: flights.reduce((sum, f) => sum + (f.passengers?.economy || 0), 0),
            business: flights.reduce((sum, f) => sum + (f.passengers?.business || 0), 0),
            firstClass: flights.reduce((sum, f) => sum + (f.passengers?.firstClass || 0), 0),
          },
        },
        performance: {
          onTimePercentage:
            flights.length > 0
              ? Math.round((flights.filter((f) => f.status === "On Time").length / flights.length) * 100)
              : 0,
          averageDelay: this.calculateAverageDelay(flights),
        },
        generatedAt: new Date().toISOString(),
      }

      res.json({
        success: true,
        data: report,
      })
    } catch (error) {
      console.error("Monthly report error:", error)
      res.status(500).json({
        success: false,
        message: "Error generating monthly report",
      })
    }
  }

  // Generate performance report
  static async getPerformanceReport(req, res) {
    try {
      const flights = await Flight.find()

      const report = {
        overall: {
          totalFlights: flights.length,
          onTimePercentage:
            flights.length > 0
              ? Math.round((flights.filter((f) => f.status === "On Time").length / flights.length) * 100)
              : 0,
          cancellationRate:
            flights.length > 0
              ? Math.round((flights.filter((f) => f.status === "Cancelled").length / flights.length) * 100)
              : 0,
        },
        byAircraft: this.getPerformanceByAircraft(flights),
        byRoute: this.getPerformanceByRoute(flights),
        trends: await this.getPerformanceTrends(),
        generatedAt: new Date().toISOString(),
      }

      res.json({
        success: true,
        data: report,
      })
    } catch (error) {
      console.error("Performance report error:", error)
      res.status(500).json({
        success: false,
        message: "Error generating performance report",
      })
    }
  }

  // Generate financial report
  static async getFinancialReport(req, res) {
    try {
      const tickets = await Ticket.find({ isActive: true })
      const flights = await Flight.find()

      const revenue = {
        economy: 0,
        business: 0,
        firstClass: 0,
        total: 0,
      }

      // Calculate estimated revenue based on tickets and passenger counts
      tickets.forEach((ticket) => {
        const flight = flights.find((f) => f.flightNumber === ticket.flightNumber)
        if (flight && flight.passengers) {
          revenue.economy += (flight.passengers.economy || 0) * (ticket.pricing.economy.current || 0)
          revenue.business += (flight.passengers.business || 0) * (ticket.pricing.business.current || 0)
          revenue.firstClass += (flight.passengers.firstClass || 0) * (ticket.pricing.firstClass.current || 0)
        }
      })

      revenue.total = revenue.economy + revenue.business + revenue.firstClass

      const report = {
        revenue: {
          total: revenue.total,
          byClass: {
            economy: revenue.economy,
            business: revenue.business,
            firstClass: revenue.firstClass,
          },
          currency: "BDT",
        },
        tickets: {
          total: tickets.length,
          averagePrice: {
            economy:
              tickets.length > 0
                ? Math.round(tickets.reduce((sum, t) => sum + (t.pricing.economy.current || 0), 0) / tickets.length)
                : 0,
            business:
              tickets.length > 0
                ? Math.round(tickets.reduce((sum, t) => sum + (t.pricing.business.current || 0), 0) / tickets.length)
                : 0,
            firstClass:
              tickets.length > 0
                ? Math.round(tickets.reduce((sum, t) => sum + (t.pricing.firstClass.current || 0), 0) / tickets.length)
                : 0,
          },
        },
        generatedAt: new Date().toISOString(),
      }

      res.json({
        success: true,
        data: report,
      })
    } catch (error) {
      console.error("Financial report error:", error)
      res.status(500).json({
        success: false,
        message: "Error generating financial report",
      })
    }
  }

  // Helper methods
  static getStatusBreakdown(flights) {
    const breakdown = {}
    flights.forEach((flight) => {
      breakdown[flight.status] = (breakdown[flight.status] || 0) + 1
    })
    return breakdown
  }

  static getAircraftBreakdown(flights) {
    const breakdown = {}
    flights.forEach((flight) => {
      breakdown[flight.aircraft] = (breakdown[flight.aircraft] || 0) + 1
    })
    return breakdown
  }

  static calculateAverageDelay(flights) {
    const delayedFlights = flights.filter((f) => f.delay && f.delay.duration)
    if (delayedFlights.length === 0) return 0

    const totalDelay = delayedFlights.reduce((sum, f) => sum + f.delay.duration, 0)
    return Math.round(totalDelay / delayedFlights.length)
  }

  static getPerformanceByAircraft(flights) {
    const aircraftPerformance = {}

    flights.forEach((flight) => {
      if (!aircraftPerformance[flight.aircraft]) {
        aircraftPerformance[flight.aircraft] = {
          total: 0,
          onTime: 0,
          delayed: 0,
          cancelled: 0,
        }
      }

      aircraftPerformance[flight.aircraft].total++
      if (flight.status === "On Time") aircraftPerformance[flight.aircraft].onTime++
      if (flight.status === "Delayed") aircraftPerformance[flight.aircraft].delayed++
      if (flight.status === "Cancelled") aircraftPerformance[flight.aircraft].cancelled++
    })

    // Calculate percentages
    Object.keys(aircraftPerformance).forEach((aircraft) => {
      const perf = aircraftPerformance[aircraft]
      perf.onTimePercentage = perf.total > 0 ? Math.round((perf.onTime / perf.total) * 100) : 0
    })

    return aircraftPerformance
  }

  static getPerformanceByRoute(flights) {
    const routePerformance = {}

    flights.forEach((flight) => {
      const route = `${flight.origin}-${flight.destination}`
      if (!routePerformance[route]) {
        routePerformance[route] = {
          total: 0,
          onTime: 0,
          delayed: 0,
          cancelled: 0,
        }
      }

      routePerformance[route].total++
      if (flight.status === "On Time") routePerformance[route].onTime++
      if (flight.status === "Delayed") routePerformance[route].delayed++
      if (flight.status === "Cancelled") routePerformance[route].cancelled++
    })

    // Calculate percentages
    Object.keys(routePerformance).forEach((route) => {
      const perf = routePerformance[route]
      perf.onTimePercentage = perf.total > 0 ? Math.round((perf.onTime / perf.total) * 100) : 0
    })

    return routePerformance
  }

  static async getPerformanceTrends() {
    // This would typically involve more complex aggregation queries
    // For now, return a simple trend structure
    return {
      last7Days: [],
      last30Days: [],
      note: "Trend analysis requires more historical data",
    }
  }
}

module.exports = ReportController
