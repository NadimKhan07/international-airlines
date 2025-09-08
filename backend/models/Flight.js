const mongoose = require("mongoose")

const flightSchema = new mongoose.Schema({
  flightNumber: {
    type: String,
    required: [true, "Flight number is required"],
    unique: true,
    uppercase: true,
    match: [/^[A-Z]{2}[0-9]{3,4}$/, "Flight number must be in format: AB123 or AB1234"],
  },
  airline: {
    type: String,
    default: "International Airlines",
    required: true,
  },
  aircraft: {
    type: String,
    required: [true, "Aircraft type is required"],
    enum: {
      values: ["Boeing 737", "Boeing 777", "Boeing 787", "Airbus A320", "Airbus A330", "Airbus A350"],
      message: "Invalid aircraft type",
    },
  },
  origin: {
    type: String,
    required: [true, "Origin is required"],
    trim: true,
  },
  destination: {
    type: String,
    required: [true, "Destination is required"],
    trim: true,
  },
  transitPoints: [
    {
      type: String,
      trim: true,
    },
  ],
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
  platform: {
    type: String,
    required: [true, "Platform is required"],
    match: [/^[A-Z][0-9]{1,2}$/, "Platform must be in format: A1, B12, etc."],
  },
  status: {
    type: String,
    enum: {
      values: ["Scheduled", "On Time", "Delayed", "Cancelled", "Boarding", "Departed", "Arrived"],
      message: "Invalid flight status",
    },
    default: "Scheduled",
  },
  delay: {
    duration: {
      type: Number,
      min: [0, "Delay duration cannot be negative"],
      max: [1440, "Delay cannot exceed 24 hours"],
    },
    reason: {
      type: String,
      enum: ["Weather", "Technical", "Air Traffic", "Security", "Crew", "Other"],
    },
  },
  passengers: {
    total: {
      type: Number,
      required: true,
      min: [0, "Passenger count cannot be negative"],
      max: [500, "Passenger count cannot exceed aircraft capacity"],
    },
    economy: {
      type: Number,
      default: 0,
      min: 0,
    },
    business: {
      type: Number,
      default: 0,
      min: 0,
    },
    firstClass: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  fuelStatus: {
    type: String,
    enum: {
      values: ["Pending", "Fueling", "Fueled", "Not Required"],
      message: "Invalid fuel status",
    },
    default: "Pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
})

// Update timestamp on save
flightSchema.pre("save", function (next) {
  this.updatedAt = new Date()
  next()
})

// Calculate flight duration
flightSchema.virtual("duration").get(function () {
  if (this.departureTime && this.arrivalTime) {
    const diff = this.arrivalTime - this.departureTime
    return Math.round(diff / (1000 * 60)) // Duration in minutes
  }
  return null
})

// Check if flight is delayed
flightSchema.virtual("isDelayed").get(function () {
  return this.status === "Delayed" && this.delay && this.delay.duration > 0
})

module.exports = mongoose.model("Flight", flightSchema)
