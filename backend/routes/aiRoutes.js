const express = require("express")
const AIController = require("../controllers/aiController")
const authMiddleware = require("../middleware/authMiddleware")
const router = express.Router()

// All AI routes require authentication
router.use(authMiddleware)

// AI Route Safety Analysis
router.post("/route-safety", AIController.analyzeRouteSafety)

// AI Dynamic Pricing
router.post("/dynamic-pricing", AIController.generateDynamicPricing)

// AI Flight Delay Prediction
router.post("/delay-prediction", AIController.predictFlightDelay)

// AI Passenger Flow Optimization
router.post("/passenger-flow", AIController.optimizePassengerFlow)

// AI Maintenance Prediction
router.post("/maintenance-prediction", AIController.predictMaintenance)

module.exports = router
