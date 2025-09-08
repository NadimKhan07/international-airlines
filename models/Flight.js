const mongoose = require("mongoose")

const flightSchema = new mongoose.Schema(
  {
    flightNumber: {
      type: String,
      required: [true, "Flight number is required"],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z]{2,3}[0-9]{1,4}$/, "Flight number must be in format like 'IA123' or 'BAW456'"],
    },
    airline: {
      type: String,
      required: [true, "Airline name is required"],
      trim: true,
      maxlength: [100, "Airline name cannot exceed 100 characters"],
    },
    origin: {
      city: {
        type: String,
        required: [true, "Origin city is required"],
        trim: true,
      },
      airport: {
        type: String,
        required: [true, "Origin airport is required"],
        trim: true,
      },
      code: {
        type: String,
        required: [true, "Origin airport code is required"],
        uppercase: true,
        match: [/^[A-Z]{3}$/, "Airport code must be 3 uppercase letters"],
      },
      country: {
        type: String,
        required: [true, "Origin country is required"],
        trim: true,
      },
      timezone: {
        type: String,
        default: "UTC",
      },
    },
    destination: {
      city: {
        type: String,
        required: [true, "Destination city is required"],
        trim: true,
      },
      airport: {
        type: String,
        required: [true, "Destination airport is required"],
        trim: true,
      },
      code: {
        type: String,
        required: [true, "Destination airport code is required"],
        uppercase: true,
        match: [/^[A-Z]{3}$/, "Airport code must be 3 uppercase letters"],
      },
      country: {
        type: String,
        required: [true, "Destination country is required"],
        trim: true,
      },
      timezone: {
        type: String,
        default: "UTC",
      },
    },
    departureTime: {
      type: Date,
      required: [true, "Departure time is required"],
      validate: {
        validator: (date) => date > new Date(),
        message: "Departure time must be in the future",
      },
    },
    arrivalTime: {
      type: Date,
      required: [true, "Arrival time is required"],
      validate: {
        validator: function (date) {
          return date > this.departureTime
        },
        message: "Arrival time must be after departure time",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["Scheduled", "Boarding", "Departed", "In Air", "Landed", "Delayed", "Cancelled"],
        message: "Status must be one of: Scheduled, Boarding, Departed, In Air, Landed, Delayed, Cancelled",
      },
      default: "Scheduled",
    },
    aircraft: {
      model: {
        type: String,
        required: [true, "Aircraft model is required"],
        trim: true,
      },
      registration: {
        type: String,
        required: [true, "Aircraft registration is required"],
        uppercase: true,
        trim: true,
      },
      manufacturer: {
        type: String,
        trim: true,
      },
      yearManufactured: {
        type: Number,
        min: [1950, "Year manufactured cannot be before 1950"],
        max: [new Date().getFullYear(), "Year manufactured cannot be in the future"],
      },
    },
    capacity: {
      total: {
        type: Number,
        required: [true, "Total capacity is required"],
        min: [1, "Total capacity must be at least 1"],
        max: [1000, "Total capacity cannot exceed 1000"],
      },
      economy: {
        type: Number,
        required: [true, "Economy capacity is required"],
        min: [0, "Economy capacity cannot be negative"],
      },
      business: {
        type: Number,
        required: [true, "Business capacity is required"],
        min: [0, "Business capacity cannot be negative"],
      },
      first: {
        type: Number,
        default: 0,
        min: [0, "First class capacity cannot be negative"],
      },
    },
    gate: {
      type: String,
      default: "TBA",
      uppercase: true,
      trim: true,
    },
    terminal: {
      type: String,
      default: "1",
      trim: true,
    },
    price: {
      economy: {
        type: Number,
        required: [true, "Economy price is required"],
        min: [0, "Economy price cannot be negative"],
      },
      business: {
        type: Number,
        required: [true, "Business price is required"],
        min: [0, "Business price cannot be negative"],
      },
      first: {
        type: Number,
        default: 0,
        min: [0, "First class price cannot be negative"],
      },
    },
    delay: {
      duration: {
        type: Number, // in minutes
        default: 0,
        min: [0, "Delay duration cannot be negative"],
      },
      reason: {
        type: String,
        trim: true,
      },
    },
    weather: {
      departure: {
        condition: String,
        temperature: Number,
        windSpeed: Number,
        visibility: Number,
      },
      arrival: {
        condition: String,
        temperature: Number,
        windSpeed: Number,
        visibility: Number,
      },
    },
    crew: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        role: {
          type: String,
          enum: ["Captain", "First Officer", "Flight Engineer", "Flight Attendant"],
          required: true,
        },
        employeeId: {
          type: String,
          required: true,
        },
      },
    ],
    notes: {
      type: String,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for better query performance
flightSchema.index({ flightNumber: 1 })
flightSchema.index({ departureTime: 1 })
flightSchema.index({ status: 1 })
flightSchema.index({ "origin.code": 1, "destination.code": 1 })
flightSchema.index({ createdAt: -1 })

// Validate capacity totals
flightSchema.pre("save", function (next) {
  const totalSeats = this.capacity.economy + this.capacity.business + this.capacity.first
  if (totalSeats !== this.capacity.total) {
    next(new Error("Sum of class capacities must equal total capacity"))
  }
  next()
})

// Calculate flight duration virtual
flightSchema.virtual("duration").get(function () {
  if (!this.departureTime || !this.arrivalTime) return null

  const diff = this.arrivalTime - this.departureTime
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m`
})

// Calculate distance virtual (simplified calculation)
flightSchema.virtual("estimatedDistance").get(function () {
  // This is a simplified calculation - in reality you'd use proper geolocation
  const avgSpeed = 900 // km/h average commercial flight speed
  if (!this.departureTime || !this.arrivalTime) return null

  const durationHours = (this.arrivalTime - this.departureTime) / (1000 * 60 * 60)
  return Math.round(durationHours * avgSpeed)
})

// Route string virtual
flightSchema.virtual("route").get(function () {
  return `${this.origin.code} → ${this.destination.code}`
})

// Check if flight is international
flightSchema.virtual("isInternational").get(function () {
  return this.origin.country !== this.destination.country
})

// Static method to find flights by route
flightSchema.statics.findByRoute = function (originCode, destinationCode) {
  return this.find({
    "origin.code": originCode,
    "destination.code": destinationCode,
  })
}

// Static method to find active flights
flightSchema.statics.findActive = function () {
  return this.find({
    status: { $in: ["Scheduled", "Boarding", "Departed", "In Air"] },
  })
}

// Instance method to update status
flightSchema.methods.updateStatus = function (newStatus, reason = null) {
  this.status = newStatus

  if (newStatus === "Delayed" && reason) {
    this.delay.reason = reason
  }

  return this.save()
}

module.exports = mongoose.model("Flight", flightSchema)
