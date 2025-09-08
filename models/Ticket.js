const mongoose = require("mongoose")

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      uppercase: true,
      match: [/^IA[0-9]{6}$/, "Ticket number must be in format IA123456"],
    },
    flightId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flight",
      required: [true, "Flight ID is required"],
    },
    passenger: {
      firstName: {
        type: String,
        required: [true, "Passenger first name is required"],
        trim: true,
        minlength: [2, "First name must be at least 2 characters"],
        maxlength: [50, "First name cannot exceed 50 characters"],
      },
      lastName: {
        type: String,
        required: [true, "Passenger last name is required"],
        trim: true,
        minlength: [2, "Last name must be at least 2 characters"],
        maxlength: [50, "Last name cannot exceed 50 characters"],
      },
      email: {
        type: String,
        required: [true, "Passenger email is required"],
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
      },
      phone: {
        type: String,
        required: [true, "Passenger phone is required"],
        trim: true,
        match: [/^\+?[\d\s-()]+$/, "Please enter a valid phone number"],
      },
      dateOfBirth: {
        type: Date,
        required: [true, "Passenger date of birth is required"],
        validate: {
          validator: (date) => {
            const today = new Date()
            const age = today.getFullYear() - date.getFullYear()
            return age >= 0 && age <= 120
          },
          message: "Invalid date of birth",
        },
      },
      gender: {
        type: String,
        enum: ["Male", "Female", "Other", "Prefer not to say"],
        required: [true, "Gender is required"],
      },
      nationality: {
        type: String,
        required: [true, "Nationality is required"],
        trim: true,
      },
      passport: {
        number: {
          type: String,
          required: [true, "Passport number is required"],
          uppercase: true,
          trim: true,
        },
        country: {
          type: String,
          required: [true, "Passport issuing country is required"],
          trim: true,
        },
        expiryDate: {
          type: Date,
          required: [true, "Passport expiry date is required"],
          validate: {
            validator: (date) => date > new Date(),
            message: "Passport must not be expired",
          },
        },
      },
    },
    seatClass: {
      type: String,
      enum: {
        values: ["economy", "business", "first"],
        message: "Seat class must be economy, business, or first",
      },
      required: [true, "Seat class is required"],
    },
    seatNumber: {
      type: String,
      required: [true, "Seat number is required"],
      uppercase: true,
      trim: true,
      match: [/^[0-9]{1,3}[A-Z]$/, "Seat number must be in format like '12A' or '156F'"],
    },
    price: {
      type: Number,
      required: [true, "Ticket price is required"],
      min: [0, "Price cannot be negative"],
    },
    taxes: {
      type: Number,
      default: 0,
      min: [0, "Taxes cannot be negative"],
    },
    fees: {
      type: Number,
      default: 0,
      min: [0, "Fees cannot be negative"],
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: {
        values: ["confirmed", "cancelled", "checked-in", "boarded", "no-show"],
        message: "Status must be one of: confirmed, cancelled, checked-in, boarded, no-show",
      },
      default: "confirmed",
    },
    specialRequests: [
      {
        type: {
          type: String,
          enum: ["meal", "accessibility", "seating", "other"],
          required: true,
        },
        description: {
          type: String,
          required: true,
          trim: true,
          maxlength: [200, "Special request description cannot exceed 200 characters"],
        },
        status: {
          type: String,
          enum: ["pending", "approved", "denied"],
          default: "pending",
        },
      },
    ],
    baggage: {
      checkedBags: {
        type: Number,
        default: 1,
        min: [0, "Checked bags cannot be negative"],
        max: [10, "Cannot exceed 10 checked bags"],
      },
      carryOnBags: {
        type: Number,
        default: 1,
        min: [0, "Carry-on bags cannot be negative"],
        max: [3, "Cannot exceed 3 carry-on bags"],
      },
      totalWeight: {
        type: Number,
        default: 0,
        min: [0, "Total weight cannot be negative"],
        max: [500, "Total weight cannot exceed 500kg"],
      },
      specialItems: [
        {
          type: String,
          trim: true,
        },
      ],
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ["pending", "paid", "refunded", "failed"],
        message: "Payment status must be pending, paid, refunded, or failed",
      },
      default: "paid",
    },
    paymentDetails: {
      method: {
        type: String,
        enum: ["credit_card", "debit_card", "bank_transfer", "cash", "points"],
      },
      transactionId: {
        type: String,
        trim: true,
      },
      amount: {
        type: Number,
        min: [0, "Payment amount cannot be negative"],
      },
      currency: {
        type: String,
        default: "USD",
        uppercase: true,
        match: [/^[A-Z]{3}$/, "Currency must be a 3-letter code"],
      },
    },
    checkIn: {
      time: Date,
      gate: String,
      terminal: String,
      boardingGroup: {
        type: String,
        enum: ["A", "B", "C", "D", "E"],
      },
      boardingTime: Date,
    },
    emergencyContact: {
      name: {
        type: String,
        trim: true,
      },
      relationship: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
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

// Indexes for better performance
ticketSchema.index({ ticketNumber: 1 })
ticketSchema.index({ flightId: 1 })
ticketSchema.index({ "passenger.email": 1 })
ticketSchema.index({ status: 1 })
ticketSchema.index({ bookingDate: -1 })
ticketSchema.index({ seatNumber: 1, flightId: 1 }, { unique: true })

// Generate ticket number before saving
ticketSchema.pre("save", async function (next) {
  if (!this.ticketNumber) {
    const count = await this.constructor.countDocuments()
    this.ticketNumber = `IA${String(count + 1).padStart(6, "0")}`
  }
  next()
})

// Calculate total price virtual
ticketSchema.virtual("totalPrice").get(function () {
  return this.price + this.taxes + this.fees
})

// Calculate passenger age virtual
ticketSchema.virtual("passengerAge").get(function () {
  if (!this.passenger.dateOfBirth) return null

  const today = new Date()
  const birthDate = new Date(this.passenger.dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
})

// Full passenger name virtual
ticketSchema.virtual("passengerFullName").get(function () {
  return `${this.passenger.firstName} ${this.passenger.lastName}`
})

// Check if passenger is minor
ticketSchema.virtual("isMinor").get(function () {
  return this.passengerAge < 18
})

// Static method to find tickets by flight
ticketSchema.statics.findByFlight = function (flightId) {
  return this.find({ flightId }).populate("flightId")
}

// Static method to find tickets by passenger email
ticketSchema.statics.findByPassengerEmail = function (email) {
  return this.find({ "passenger.email": email }).populate("flightId")
}

// Instance method to check in passenger
ticketSchema.methods.checkIn = function (gate, terminal, boardingGroup) {
  this.status = "checked-in"
  this.checkIn = {
    time: new Date(),
    gate,
    terminal,
    boardingGroup,
  }
  return this.save()
}

// Instance method to cancel ticket
ticketSchema.methods.cancel = function (reason) {
  this.status = "cancelled"
  this.cancellation = {
    date: new Date(),
    reason,
  }
  return this.save()
}

// Validate seat availability (this would typically be done at the application level)
ticketSchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("seatNumber") || this.isModified("flightId")) {
    const existingTicket = await this.constructor.findOne({
      flightId: this.flightId,
      seatNumber: this.seatNumber,
      status: { $in: ["confirmed", "checked-in", "boarded"] },
      _id: { $ne: this._id },
    })

    if (existingTicket) {
      next(new Error(`Seat ${this.seatNumber} is already taken`))
    }
  }
  next()
})

module.exports = mongoose.model("Ticket", ticketSchema)
