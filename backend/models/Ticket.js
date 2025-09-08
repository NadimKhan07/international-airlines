const mongoose = require("mongoose")

const ticketSchema = new mongoose.Schema({
  flightNumber: {
    type: String,
    required: [true, "Flight number is required"],
    uppercase: true,
  },
  route: {
    origin: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
  },
  aircraft: {
    type: String,
    required: true,
  },
  pricing: {
    economy: {
      base: {
        type: Number,
        required: true,
        min: [0, "Base price cannot be negative"],
      },
      current: {
        type: Number,
        required: true,
        min: [0, "Current price cannot be negative"],
      },
      currency: {
        type: String,
        default: "BDT",
      },
    },
    business: {
      base: {
        type: Number,
        required: true,
        min: [0, "Base price cannot be negative"],
      },
      current: {
        type: Number,
        required: true,
        min: [0, "Current price cannot be negative"],
      },
      currency: {
        type: String,
        default: "BDT",
      },
    },
    firstClass: {
      base: {
        type: Number,
        required: true,
        min: [0, "Base price cannot be negative"],
      },
      current: {
        type: Number,
        required: true,
        min: [0, "Current price cannot be negative"],
      },
      currency: {
        type: String,
        default: "BDT",
      },
    },
  },
  factors: {
    distance: {
      type: Number,
      min: [0, "Distance cannot be negative"],
    },
    demand: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    season: {
      type: String,
      enum: ["Peak", "Off-Peak", "Regular"],
      default: "Regular",
    },
    fuelCost: {
      type: Number,
      min: [0, "Fuel cost cannot be negative"],
    },
  },
  validFrom: {
    type: Date,
    default: Date.now,
  },
  validUntil: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
})

// Update timestamp on save
ticketSchema.pre("save", function (next) {
  this.lastUpdated = new Date()
  next()
})

// Calculate price difference percentage
ticketSchema.methods.getPriceChange = function (classType) {
  const pricing = this.pricing[classType]
  if (pricing && pricing.base > 0) {
    return (((pricing.current - pricing.base) / pricing.base) * 100).toFixed(2)
  }
  return 0
}

// Check if pricing is valid
ticketSchema.methods.isValidPricing = function () {
  return new Date() >= this.validFrom && new Date() <= this.validUntil && this.isActive
}

module.exports = mongoose.model("Ticket", ticketSchema)
