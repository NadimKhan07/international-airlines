const express = require("express")
const FlightController = require("../controllers/flightController")
const authMiddleware = require("../middleware/authMiddleware")
const router = express.Router()

// All flight routes require authentication
router.use(authMiddleware)

router.get("/", FlightController.getAllFlights)
router.get("/stats", FlightController.getFlightStats)
router.get("/:id", FlightController.getFlight)
router.post("/", FlightController.createFlight)
router.put("/:id", FlightController.updateFlight)
router.delete("/:id", FlightController.deleteFlight)
router.patch("/:id/status", FlightController.updateFlightStatus)

module.exports = router
